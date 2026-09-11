import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import { useCart } from '../context/CartContext';
import { getProductBySku, productSlug, toCartItem } from '../data/shop';
import { toTourCartItem } from '../utils/tourCartItem';
import { formatPrice } from '../utils/price';

// Real Shop SKUs picked for relevance to a trip (neck pillow, power bank,
// passport cover, a small hygiene set) — not a generic "related products"
// pull, and not fabricated items; anything out of stock is skipped.
const SUGGESTED_SKUS = ['TB-002', 'TB-001', 'TB-006', 'TB-004'];

// Shared by the bottom picker (main column) and the sticky side panel —
// same selection state, two views of it. Panel shows once anything is
// selected and can be dismissed (X) without losing the picks; adding
// another item re-opens it.
export function useTravelProductsCart() {
  const [qtyBySku, setQtyBySku] = useState({});
  const [dismissed, setDismissed] = useState(false);

  const products = useMemo(
    () => SUGGESTED_SKUS.map((sku) => getProductBySku(sku)).filter((p) => p && p.inStock),
    []
  );

  const inc = (sku) => {
    setQtyBySku((q) => ({ ...q, [sku]: (q[sku] || 0) + 1 }));
    setDismissed(false);
  };
  const dec = (sku) =>
    setQtyBySku((q) => {
      const next = { ...q };
      const n = (next[sku] || 0) - 1;
      if (n <= 0) delete next[sku];
      else next[sku] = n;
      return next;
    });

  const selected = products.filter((p) => qtyBySku[p.sku] > 0);
  const productsTotal = selected.reduce((sum, p) => sum + p.price * qtyBySku[p.sku], 0);
  const productsCurrency = selected[0]?.currency || 'AZN';

  return { products, qtyBySku, inc, dec, selected, productsTotal, productsCurrency, dismissed, setDismissed };
}

export function TravelProductsPicker({ cart }) {
  const { t } = useTranslation();
  const { products, qtyBySku, inc, dec } = cart;

  if (products.length === 0) return null;

  return (
    <div className="tl-tourp-block" id="travel-products-picker">
      <h2 className="tl-tourp-h2">{t('tourDetail.crossSellTitle')}</h2>
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
                <span className="tl-tourp-crosssell-price">{formatPrice(p.price, p.currency)}</span>
                {qty > 0 ? (
                  <span className="tl-tourp-crosssell-stepper">
                    <button type="button" onClick={() => dec(p.sku)} aria-label={t('shop.qtyDecrease')}>−</button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => inc(p.sku)} aria-label={t('shop.qtyIncrease')}>+</button>
                  </span>
                ) : (
                  <button type="button" className="tl-tourp-crosssell-add" onClick={() => inc(p.sku)} aria-label={t('shop.addToCart')}>
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

export default function TravelProductsSidePanel({ cart, tour, tourPrice }) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const { selected, qtyBySku, inc, dec, productsTotal, productsCurrency, dismissed, setDismissed } = cart;
  const open = selected.length > 0 && !dismissed;

  // Mobile only — the panel is a fixed bottom sheet there, so lock body
  // scroll while it's open (same pattern as EventsGallery's lightbox).
  // Desktop keeps it as a plain sticky sidebar, page scroll stays normal.
  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    if (!window.matchMedia('(max-width: 900px)').matches) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const addBundle = () => {
    addItem(toTourCartItem(tour));
    selected.forEach((p) => addItem(toCartItem(p), qtyBySku[p.sku]));
  };

  const scrollToPicker = () => {
    document.getElementById('travel-products-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      {/* Backdrop — only rendered/visible on mobile, where the panel
          becomes a fixed bottom sheet (see the ≤900px rule in
          global.css); harmless on desktop since it's display:none there. */}
      <div className="tl-tourp-side-backdrop" onClick={() => setDismissed(true)} />
      <aside className="tl-tourp-side">
      <div className="tl-tourp-panel">
        <span className="tl-tourp-panel-handle" aria-hidden="true" />
        <div className="tl-tourp-panel-head">
          <span className="tl-tourp-panel-head-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </span>
          <span>
            <strong>{t('tourDetail.crossSellPanelTitle')}</strong>
            <span className="tl-tourp-panel-sub">{t('tourDetail.crossSellPanelSubtitle')}</span>
          </span>
          <button type="button" className="tl-tourp-panel-close" onClick={() => setDismissed(true)} aria-label={t('common.close')}>
            ×
          </button>
        </div>

        <div className="tl-tourp-panel-items">
          {selected.map((p) => (
            <div className="tl-tourp-panel-item" key={p.sku}>
              <span className="tl-tourp-panel-item-img">
                <img src={p.images[0]} alt="" />
              </span>
              <span className="tl-tourp-panel-item-info">
                <strong>{p.name}</strong>
                <span>{formatPrice(p.price, p.currency)}</span>
              </span>
              <button type="button" className="tl-tourp-panel-item-remove" onClick={() => { for (let i = 0; i < qtyBySku[p.sku]; i++) dec(p.sku); }} aria-label={t('shop.qtyDecrease')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
              </button>
              <span className="tl-tourp-panel-item-stepper">
                <button type="button" onClick={() => dec(p.sku)} aria-label={t('shop.qtyDecrease')}>−</button>
                <span>{qtyBySku[p.sku]}</span>
                <button type="button" onClick={() => inc(p.sku)} aria-label={t('shop.qtyIncrease')}>+</button>
              </span>
            </div>
          ))}
        </div>

        <button type="button" className="tl-tourp-panel-upsell" onClick={scrollToPicker}>
          <span className="tl-tourp-panel-upsell-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" /><path d="M12 2v13M8 6l4-4 4 4" /></svg>
          </span>
          <span>
            <strong>{t('tourDetail.crossSellUpsellTitle')}</strong>
            <span>{t('tourDetail.crossSellUpsellDesc')}</span>
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>

        <div className="tl-tourp-panel-totals">
          <div className="tl-tourp-crosssell-summary-row">
            <span>{t('tourDetail.productsTotal')}</span>
            <strong>{formatPrice(productsTotal, productsCurrency)}</strong>
          </div>
          {tourPrice && (
            <div className="tl-tourp-crosssell-summary-row">
              <span>{t('tourDetail.tourPriceLabel')}</span>
              <strong>{formatPrice(tourPrice.amount, tourPrice.currency)}</strong>
            </div>
          )}
          {tourPrice && (
            <div className="tl-tourp-crosssell-summary-row tl-tourp-crosssell-summary-grand">
              <span>{t('tourDetail.grandTotal')}</span>
              <strong>
                {formatPrice(tourPrice.amount, tourPrice.currency)} + {formatPrice(productsTotal, productsCurrency)}
              </strong>
            </div>
          )}
        </div>

        <button type="button" className="tl-tourp-crosssell-cta" onClick={addBundle}>
          {t('tourDetail.addBundleCta')}
        </button>
      </div>
      </aside>
    </>
  );
}
