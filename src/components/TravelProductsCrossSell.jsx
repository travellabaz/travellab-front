import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductBySku, getSuggestedCrossSellProducts, productSlug } from '../data/shop';
import { formatPrice } from '../utils/price';
import { pickManager } from '../utils/managers';
import { buildTourRequest, packageSummary, toPackageItem, tourRequestWaUrl } from '../utils/tourPackage';
import { postTourRequest } from '../api/tourRequests';

// "Hamısını göstər" rotates through the brand palette per tour (hashed
// from tourId, stable for a given tour rather than changing on every
// re-render) instead of always being the same color everywhere on the
// site. orange-dark, not orange — plain --tl-orange is too light for
// white button text to stay readable.
const SHOWALL_COLORS = ['green', 'blue', 'orange', 'navy'];
function hashToIndex(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

const SHEET_SWIPE_CLOSE_PX = 80;
const SHEET_FLICK_VELOCITY = 0.5; // px/ms — a fast downward flick closes even under 80px

const BAG_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const CHEVRON_UP = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
);
const CHEVRON_DOWN = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);
export const WA_ICON = (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
  </svg>
);

// Opens the one combined tour + products request (task item E) — shared
// by the package sheet, the desktop panel, TourStickyBar and the cart's
// "Tur paketi" group. A package is a stored snapshot, so this works the
// same off the tour page (cart) as on it.
export function useSendTourRequest() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { tourLines } = useCart();
  return useCallback((pkg) => {
    if (!pkg) return;
    const pax = tourLines.find((l) => l.id === pkg.tourId)?.qty || 1;
    const user = profile ? { name: [profile.name, profile.surname].filter(Boolean).join(' '), phone: profile.phone || null } : null;
    const request = buildTourRequest(pkg, { pax, user });
    // Shop team's Telegram notification — only when the package actually
    // has Shop products. Not awaited: window.open must stay in this same
    // click, and the WhatsApp must open even if the backend is down.
    if (request.items.length) postTourRequest(request);
    const phone = pkg.tour.manager?.phone || pickManager().number;
    window.open(tourRequestWaUrl(request, phone, t), '_blank');
  }, [t, profile, tourLines]);
}

// Selection state for one tour's package — lives in CartContext (so it's
// persisted per tour and visible in the cart), this just adapts it for
// the tour page. tourSnapshot = what the package records about the tour
// (see utils/tourPackage.js), kept in sync as the visitor changes hotel.
//
// tourId as a memo key (not just []) — re-rolls the suggested products
// when the visitor navigates client-side from one tour to another, not
// only on a hard reload.
export function useTravelProductsCart(tourId, tourSnapshot) {
  const { packages, setPackageItem, syncPackageTour, tourLines } = useCart();
  const pkg = packages[String(tourId)] || null;

  const suggested = useMemo(() => getSuggestedCrossSellProducts(), [tourId]);
  // Products already in the package (e.g. picked before a reload, when a
  // different random 4 were suggested) always get a card too, first.
  const products = useMemo(() => {
    const inPkg = Object.keys(pkg?.items || {})
      .filter((sku) => !suggested.some((p) => p.sku === sku))
      .map(getProductBySku)
      .filter(Boolean);
    return [...inPkg, ...suggested];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggested, pkg ? Object.keys(pkg.items).join(',') : '']);
  const showAllColor = useMemo(() => SHOWALL_COLORS[hashToIndex(String(tourId), SHOWALL_COLORS.length)], [tourId]);

  const snapshotKey = JSON.stringify(tourSnapshot);
  useEffect(() => {
    if (tourSnapshot) syncPackageTour(tourId, tourSnapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, snapshotKey, syncPackageTour]);

  const qtyBySku = useMemo(() => {
    const out = {};
    Object.values(pkg?.items || {}).forEach((it) => { out[it.sku] = it.qty; });
    return out;
  }, [pkg]);

  const setQty = (product, qty) => setPackageItem(tourId, tourSnapshot, toPackageItem(product, Math.max(0, qty)));
  const inc = (product) => setQty(product, (qtyBySku[product.sku] || 0) + 1);
  const dec = (product) => setQty(product, (qtyBySku[product.sku] || 0) - 1);
  const productFor = (sku) => products.find((p) => p.sku === sku) || getProductBySku(sku);

  const pax = tourLines.find((l) => l.id === String(tourId))?.qty || 1;

  return { pkg, products, qtyBySku, inc, dec, productFor, summary: packageSummary(pkg), pax, showAllColor };
}

// (A) — "+" turns into a light-green [ − n + ] in the same spot; no popup.
export function TravelProductsPicker({ cart }) {
  const { t } = useTranslation();
  const { products, qtyBySku, inc, dec, showAllColor } = cart;

  if (products.length === 0) return null;

  return (
    <div className="tl-tourp-block" id="travel-products-picker">
      <div className="tl-tourp-crosssell-head">
        <h2 className="tl-tourp-h2">{t('tourDetail.crossSellTitle')}</h2>
        <Link to="/shop" className={`tl-tourp-showall tl-tourp-showall-${showAllColor}`}>{t('tourDetail.showAllProducts')}</Link>
      </div>
      <p className="tl-tourp-crosssell-sub">{t('tourDetail.crossSellSubtitle')}</p>

      <div className="tl-tourp-crosssell-scroll">
        {products.map((p) => {
          const qty = qtyBySku[p.sku] || 0;
          return (
            <div className="tl-tourp-crosssell-card" key={p.sku}>
              <Link to={`/shop/${productSlug(p)}`} className="tl-tourp-crosssell-img">
                <img src={p.images[0]} alt={p.name} loading="lazy" />
              </Link>
              <div className="tl-tourp-crosssell-name">{p.name}</div>
              <div className="tl-tourp-crosssell-row">
                <span className="tl-tourp-crosssell-prices">
                  <span className="tl-tourp-crosssell-price">{formatPrice(p.price, p.currency)}</span>
                  {p.standalonePrice > p.price && (
                    <span className="tl-tourp-crosssell-strike">{formatPrice(p.standalonePrice, p.currency)}</span>
                  )}
                </span>
                {qty > 0 ? (
                  <span className="tl-tourp-crosssell-stepper">
                    <button type="button" onClick={() => dec(p)} aria-label={t('shop.qtyDecrease')}>−</button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => inc(p)} aria-label={t('shop.qtyIncrease')}>+</button>
                  </span>
                ) : (
                  <button type="button" className="tl-tourp-crosssell-add" onClick={() => inc(p)} aria-label={t('tourPackage.addToPackage')}>
                    +
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// (C) body — tour row, products, totals, the single request button. Same
// content in the mobile bottom sheet and the desktop sidebar card.
function TourPackageBody({ cart, onRequest, onAddMore, onBack }) {
  const { t } = useTranslation();
  const { pkg, inc, dec, productFor, summary, pax } = cart;
  const tour = pkg.tour;

  return (
    <>
      <div className="tl-tourpkg-scroll">
        <div className="tl-tourpkg-tour">
          {tour.image && <img src={tour.image} alt="" className="tl-tourpkg-tour-img" />}
          <div className="tl-tourpkg-tour-info">
            <span className="tl-tourpkg-tour-tag">{t('tourPackage.tourTag')}</span>
            <strong>{tour.title}</strong>
            {(tour.dateText || tour.hotel) && (
              <span className="tl-tourpkg-tour-meta">{[tour.dateText, tour.hotel?.name].filter(Boolean).join(' · ')}</span>
            )}
            {tour.price && (
              <span className="tl-tourpkg-tour-price">
                {t('tourPackage.pricePax', { price: formatPrice(tour.price.amount, tour.price.currency), count: pax })}
              </span>
            )}
          </div>
        </div>

        <div className="tl-tourpkg-items-title">{t('tourPackage.itemsTitle')}</div>
        {summary.items.map((it) => {
          const product = productFor(it.sku);
          return (
            <div className="tl-tourpkg-item" key={it.sku}>
              <span className="tl-tourpkg-item-img">{it.image && <img src={it.image} alt="" />}</span>
              <span className="tl-tourpkg-item-info">
                <strong>{it.name}</strong>
                <span>
                  <span className="tl-tourpkg-price">{formatPrice(it.bundlePrice, it.currency)}</span>
                  {it.standalonePrice > it.bundlePrice && (
                    <span className="tl-tourpkg-strike">{formatPrice(it.standalonePrice, it.currency)}</span>
                  )}
                </span>
              </span>
              {product && (
                <span className="tl-tourpkg-stepper">
                  <button type="button" onClick={() => dec(product)} aria-label={t('shop.qtyDecrease')}>−</button>
                  <span>{it.qty}</span>
                  <button type="button" onClick={() => inc(product)} aria-label={t('shop.qtyIncrease')}>+</button>
                </span>
              )}
            </div>
          );
        })}

        <button type="button" className="tl-tourpkg-addmore" onClick={onAddMore}>
          + {t('tourPackage.addMore')}
        </button>
      </div>

      <div className="tl-tourpkg-totals">
        {tour.price && (
          <div className="tl-tourpkg-row">
            <span>{t('tourPackage.totalTour', { count: pax })}</span>
            <span>{formatPrice(tour.price.amount, tour.price.currency)}</span>
          </div>
        )}
        <div className="tl-tourpkg-row">
          <span>{t('tourPackage.totalItems', { count: summary.count })}</span>
          <span>{formatPrice(summary.total, summary.currency)}</span>
        </div>
        {summary.savings > 0 && (
          <div className="tl-tourpkg-row tl-tourpkg-row-save">
            <span>{t('tourPackage.savings')}</span>
            <span>−{formatPrice(summary.savings, summary.currency)}</span>
          </div>
        )}
        <div className="tl-tourpkg-row tl-tourpkg-row-grand">
          <span>{t('tourPackage.grandTotal')}</span>
          <span>
            {tour.price ? `${formatPrice(tour.price.amount, tour.price.currency)} + ` : ''}
            {formatPrice(summary.total, summary.currency)}
          </span>
        </div>
      </div>

      <button type="button" className="tl-tourpkg-cta" onClick={onRequest}>
        {WA_ICON}
        {t('tourPackage.sendRequest')}
      </button>
      <p className="tl-tourpkg-note">{t('tourPackage.requestNote')}</p>
      {onBack && (
        <button type="button" className="tl-tourpkg-back" onClick={onBack}>{t('tourPackage.backToTour')}</button>
      )}
    </>
  );
}

function scrollToPicker() {
  document.getElementById('travel-products-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// (B) strip + (C) bottom sheet — mobile only (both display:none ≥901px,
// where the desktop sidebar card below shows the same body instead).
export function TourPackageMobile({ cart }) {
  const { t } = useTranslation();
  const sendRequest = useSendTourRequest();
  const { pkg, summary } = cart;
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragRef = useRef(null);
  const scrollRef = useRef(null);
  const afterCloseRef = useRef(null);

  const hasItems = summary.count > 0;

  // Body padding so the strip never covers the end of the page.
  useEffect(() => {
    if (!hasItems) return undefined;
    document.body.classList.add('tl-has-tourpkg-strip');
    return () => document.body.classList.remove('tl-has-tourpkg-strip');
  }, [hasItems]);

  // One history entry while open, so the phone's back button collapses
  // the sheet instead of leaving the page (same pattern as StoryViewer).
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    const onPopState = () => {
      setOpen(false);
      const after = afterCloseRef.current;
      afterCloseRef.current = null;
      // After the browser's own scroll restoration for this history step.
      if (after) setTimeout(after, 50);
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('popstate', onPopState);
    };
  }, [open]);

  // Sheet emptied (last product removed with "−") — just collapse.
  useEffect(() => {
    if (open && !hasItems) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasItems]);

  const openSheet = () => {
    window.history.pushState({ tlTourPkgSheet: true }, '');
    setDragY(0);
    setOpen(true);
  };

  // Every close path goes through history.back() while our entry is on
  // top, so the entry never lingers; popstate above does the actual close.
  const close = (after) => {
    afterCloseRef.current = typeof after === 'function' ? after : null;
    if (window.history.state?.tlTourPkgSheet) window.history.back();
    else {
      setOpen(false);
      if (afterCloseRef.current) { afterCloseRef.current(); afterCloseRef.current = null; }
    }
  };

  // Drag down to close: from anywhere on the sheet unless its list is
  // scrolled (then the gesture belongs to the list).
  const onTouchStart = (e) => {
    if (scrollRef.current && scrollRef.current.contains(e.target) && scrollRef.current.scrollTop > 0) return;
    dragRef.current = { y: e.touches[0].clientY, t: Date.now() };
  };
  const onTouchMove = (e) => {
    if (!dragRef.current) return;
    setDragY(Math.max(0, e.touches[0].clientY - dragRef.current.y));
  };
  const onTouchEnd = () => {
    if (!dragRef.current) return;
    const velocity = dragY / Math.max(1, Date.now() - dragRef.current.t);
    dragRef.current = null;
    if (dragY > SHEET_SWIPE_CLOSE_PX || (dragY > 10 && velocity > SHEET_FLICK_VELOCITY)) close();
    else setDragY(0);
  };

  if (!pkg || !hasItems) return null;

  return (
    <>
      {!open && (
        <button type="button" className="tl-tourpkg-strip" onClick={openSheet}>
          <span className="tl-tourpkg-strip-ico">
            {BAG_ICON}
            <span className="tl-tourpkg-strip-badge">{summary.count}</span>
          </span>
          <span className="tl-tourpkg-strip-text">
            <strong>{t('tourPackage.title')}</strong>
            <span>{t('tourPackage.stripSummary', { count: summary.count, total: formatPrice(summary.total, summary.currency) })}</span>
          </span>
          <span className="tl-tourpkg-strip-view">{t('tourPackage.view')} {CHEVRON_UP}</span>
        </button>
      )}

      {open && createPortal(
        <>
          <div className="tl-tourpkg-overlay" onClick={() => close()} />
          <div
            className="tl-tourpkg-sheet"
            role="dialog"
            aria-label={t('tourPackage.title')}
            style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <span className="tl-tourpkg-handle" aria-hidden="true" />
            <div className="tl-tourpkg-head">
              <span className="tl-tourpkg-head-ico">{BAG_ICON}</span>
              <span className="tl-tourpkg-head-text">
                <strong>{t('tourPackage.title')}</strong>
                <span>{t('tourPackage.subtitle')}</span>
              </span>
              <button type="button" className="tl-tourpkg-collapse" onClick={() => close()} aria-label={t('common.close')}>
                {CHEVRON_DOWN}
              </button>
            </div>
            <div className="tl-tourpkg-body" ref={scrollRef}>
              <TourPackageBody
                cart={cart}
                onRequest={() => sendRequest(pkg)}
                onAddMore={() => close(scrollToPicker)}
                onBack={() => close()}
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// Desktop sidebar card — the same package body inline, no sheet/overlay
// (the old desktop panel's slot). Hidden on mobile.
export default function TravelProductsSidePanel({ cart }) {
  const { t } = useTranslation();
  const sendRequest = useSendTourRequest();
  const { pkg, summary } = cart;

  if (!pkg || summary.count === 0) return null;

  return (
    <aside className="tl-tourp-side tl-tourp-desktop-only">
      <div className="tl-tourp-panel">
        <div className="tl-tourpkg-head">
          <span className="tl-tourpkg-head-ico">{BAG_ICON}</span>
          <span className="tl-tourpkg-head-text">
            <strong>{t('tourPackage.title')}</strong>
            <span>{t('tourPackage.subtitle')}</span>
          </span>
        </div>
        <TourPackageBody cart={cart} onRequest={() => sendRequest(pkg)} onAddMore={scrollToPicker} />
      </div>
    </aside>
  );
}
