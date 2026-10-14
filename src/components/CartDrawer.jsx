import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import { useCart } from '../context/CartContext';
import { SHOP_WHATSAPP_NUMBER } from '../utils/shopWhatsapp';
import { getLocaleFromPathname, buildLocalizedPath } from '../utils/locale';
import { BASE_URL } from '../data/pageMeta';
import { getProductBySku } from '../data/shop';
import { formatPrice } from '../utils/price';
import { packageSummary, toPackageItem } from '../utils/tourPackage';
import { useSendTourRequest, WA_ICON } from './TravelProductsCrossSell';

const BAG_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

// A legacy cart tour line (added before tour packages existed) has no
// package record — build the snapshot a package needs from the line.
function snapshotFromTourLine(line) {
  return {
    title: line.title,
    image: line.image || null,
    url: line.url,
    dateText: null,
    hotel: null,
    price: line.price != null ? { amount: line.price, currency: line.currency } : null,
    manager: null,
  };
}

// Group 1, one per tour: the tour plus the Shop products bought with it
// at tour price, and ONE request to the tour manager (task items E/F).
function TourPackageGroup({ pkg, tourLine, onRemove }) {
  const { t } = useTranslation();
  const { setPackageItem, setQty } = useCart();
  const sendTourRequest = useSendTourRequest();
  const summary = packageSummary(pkg);
  const tour = pkg.tour;
  const pax = tourLine?.qty || 1;

  const setItemQty = (item, qty) => {
    const product = getProductBySku(item.sku);
    setPackageItem(pkg.tourId, tour, product ? toPackageItem(product, qty) : { ...item, qty });
  };

  return (
    <div className="tl-cartgrp tl-cartgrp-tour">
      <div className="tl-cartgrp-head">
        <span>{BAG_ICON} {t('tourPackage.cartGroupTitle')}</span>
        <span className="tl-cartgrp-code">{t('tourPackage.cartCode', { code: pkg.code })}</span>
      </div>

      <div className="tl-cart-line">
        {tour.image && <img src={tour.image} alt={tour.title} />}
        <div className="tl-cart-line-info">
          <strong>{tour.title}</strong>
          {(tour.dateText || tour.hotel) && (
            <small className="tl-cartgrp-meta">{[tour.dateText, tour.hotel?.name].filter(Boolean).join(' · ')}</small>
          )}
          {tour.price && <span>{t('tourPackage.pricePax', { price: formatPrice(tour.price.amount, tour.price.currency), count: pax })}</span>}
          {tourLine && (
            <div className="tl-qty-stepper tl-qty-stepper-sm">
              <button type="button" onClick={() => setQty('tour', pkg.tourId, Math.max(1, pax - 1))}>−</button>
              <span>{pax}</span>
              <button type="button" onClick={() => setQty('tour', pkg.tourId, pax + 1)}>+</button>
            </div>
          )}
        </div>
        <button type="button" className="tl-cart-line-remove" onClick={onRemove} aria-label={t('shop.cartRemove')}>✕</button>
      </div>

      {summary.items.map((it) => (
        <div className="tl-cart-line" key={it.sku}>
          {it.image && <img src={it.image} alt={it.name} />}
          <div className="tl-cart-line-info">
            <strong>{it.name}</strong>
            <span>
              {formatPrice(it.bundlePrice, it.currency)}
              {it.standalonePrice > it.bundlePrice && (
                <s className="tl-cartgrp-strike">{formatPrice(it.standalonePrice, it.currency)}</s>
              )}
              <em className="tl-cartgrp-pill">{t('tourPackage.withTour')}</em>
            </span>
            <div className="tl-qty-stepper tl-qty-stepper-sm">
              <button type="button" onClick={() => setItemQty(it, it.qty - 1)}>−</button>
              <span>{it.qty}</span>
              <button type="button" onClick={() => setItemQty(it, it.qty + 1)}>+</button>
            </div>
          </div>
          <button type="button" className="tl-cart-line-remove" onClick={() => setItemQty(it, 0)} aria-label={t('shop.cartRemove')}>✕</button>
        </div>
      ))}

      <div className="tl-cart-total">
        <span>{t('tourPackage.grandTotal')}</span>
        <strong>
          {tour.price ? formatPrice(tour.price.amount * pax, tour.price.currency) : ''}
          {tour.price && summary.count > 0 ? ' + ' : ''}
          {summary.count > 0 ? formatPrice(summary.total, summary.currency) : ''}
        </strong>
      </div>
      <button type="button" className="tl-cart-checkout tl-cartgrp-btn" onClick={() => sendTourRequest(pkg)}>
        {WA_ICON}
        {t('tourPackage.cartSendRequest')}
      </button>
      <p className="tl-cartgrp-note">{t('tourPackage.cartNote')}</p>
    </div>
  );
}

// No real checkout exists — WhatsApp is the order path. Tours (with their
// package products) go to the tour manager as one request per tour;
// Shop products bought on their own go to the dedicated Shop line.
export default function CartDrawer() {
  const { t } = useTranslation();
  const lang = getLocaleFromPathname(useLocation().pathname);
  const {
    productLines, tourLines, count, removeItem, setQty, drawerOpen, closeDrawer,
    packages, ensurePackage, setPackageItem, removePackage,
  } = useCart();

  // Every cart tour gets a package record (and so a request code).
  useEffect(() => {
    if (!drawerOpen) return;
    tourLines.forEach((line) => {
      if (!packages[line.id]) ensurePackage(line.id, snapshotFromTourLine(line));
    });
  }, [drawerOpen, tourLines, packages, ensurePackage]);

  // The tour page's fixed bars (package strip, sticky bar) sit above the
  // drawer's layer — hide them while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    document.body.classList.add('tl-cart-open');
    return () => document.body.classList.remove('tl-cart-open');
  }, [drawerOpen]);

  if (!drawerOpen) return null;

  const tourGroups = Object.values(packages)
    .filter((pkg) => packageSummary(pkg).count > 0 || tourLines.some((l) => l.id === pkg.tourId))
    .map((pkg) => ({ pkg, tourLine: tourLines.find((l) => l.id === pkg.tourId) || null }));

  const productWaText = productLines
    .map((l) => `${l.title} (${l.id}) x${l.qty}\n${BASE_URL}${buildLocalizedPath(l.url, lang)}`)
    .join('\n\n');
  const productWaUrl = 'https://wa.me/' + SHOP_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(t('shop.waCartMessage', { list: productWaText }));
  const productCurrencies = new Set(productLines.map((l) => l.currency));
  const productTotal = productLines.reduce((sum, l) => sum + l.qty * (l.price || 0), 0);

  // "Tura əlavə et" — only worth suggesting when a tour group exists and
  // at least one standalone item is actually cheaper at tour price.
  const firstTourId = tourGroups[0]?.pkg.tourId;
  const canMoveToTour = firstTourId && productLines.some((l) => {
    const p = getProductBySku(l.id);
    return p && p.price < (p.standalonePrice ?? p.price);
  });
  const moveShopItemsToTour = () => {
    const pkg = packages[firstTourId];
    productLines.forEach((l) => {
      const p = getProductBySku(l.id);
      if (!p) return;
      setPackageItem(firstTourId, pkg.tour, toPackageItem(p, (pkg.items[p.sku]?.qty || 0) + l.qty));
      removeItem('product', l.id);
    });
  };

  const isEmpty = productLines.length === 0 && tourGroups.length === 0;

  return createPortal(
    <div className="tl-cart-overlay" onClick={closeDrawer}>
      <div className="tl-cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="tl-cart-drawer-head">
          <h3>{t('shop.cartTitle')} {count > 0 && `(${count})`}</h3>
          <button type="button" onClick={closeDrawer} aria-label={t('shop.cartClose')}>✕</button>
        </div>

        {isEmpty ? (
          <p className="tl-cart-empty">{t('shop.cartEmpty')}</p>
        ) : (
          <>
            {tourGroups.map(({ pkg, tourLine }) => (
              <TourPackageGroup
                key={pkg.tourId}
                pkg={pkg}
                tourLine={tourLine}
                onRemove={() => {
                  removeItem('tour', pkg.tourId);
                  removePackage(pkg.tourId);
                }}
              />
            ))}

            {productLines.length > 0 && (
              <div className="tl-cartgrp">
                <div className="tl-cartgrp-head">
                  <span>{BAG_ICON} {t('tourPackage.cartShopTitle')}</span>
                </div>
                {productLines.map((line) => (
                  <div className="tl-cart-line" key={line.id}>
                    {line.image && <img src={line.image} alt={line.title} />}
                    <div className="tl-cart-line-info">
                      <strong>{line.title}</strong>
                      {line.price != null && <span>{formatPrice(line.price, line.currency)}</span>}
                      <div className="tl-qty-stepper tl-qty-stepper-sm">
                        <button type="button" onClick={() => setQty('product', line.id, line.qty - 1)}>−</button>
                        <span>{line.qty}</span>
                        <button type="button" onClick={() => setQty('product', line.id, line.qty + 1)}>+</button>
                      </div>
                    </div>
                    <button type="button" className="tl-cart-line-remove" onClick={() => removeItem('product', line.id)} aria-label={t('shop.cartRemove')}>✕</button>
                  </div>
                ))}
                {productTotal > 0 && productCurrencies.size === 1 && (
                  <div className="tl-cart-total">
                    <span>{t('tourPackage.grandTotal')}</span>
                    <strong>{formatPrice(productTotal, productLines[0].currency)}</strong>
                  </div>
                )}
                <a href={productWaUrl} target="_blank" rel="noopener noreferrer" className="tl-cartgrp-btn tl-cartgrp-btn-outline">
                  {WA_ICON}
                  {t('tourPackage.cartShopSend')}
                </a>
                {canMoveToTour && (
                  <p className="tl-cartgrp-hint">
                    {t('tourPackage.cartMoveHint')}{' '}
                    <button type="button" onClick={moveShopItemsToTour}>{t('tourPackage.cartMoveAction')}</button>
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <Link to="/shop" className="tl-cart-continue" onClick={closeDrawer}>{t('shop.cartContinue')}</Link>
      </div>
    </div>,
    document.body
  );
}
