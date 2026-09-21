import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import { useCart } from '../context/CartContext';
import { getSuggestedCrossSellProducts, productSlug, toBundleCartItem } from '../data/shop';
import { toTourCartItem } from '../utils/tourCartItem';
import { formatPrice } from '../utils/price';

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

// Shared by the bottom picker (main column) and the sticky side panel —
// same selection state, two views of it. Panel shows once anything is
// selected and can be dismissed (X) without losing the picks; adding
// another item re-opens it.
//
// tourId as a memo key (not just []) — re-rolls the suggested products
// when the visitor navigates client-side from one tour to another, not
// only on a hard reload, matching how `manager` is re-derived per tour
// elsewhere on this page.
export function useTravelProductsCart(tourId) {
  const [qtyBySku, setQtyBySku] = useState({});
  const [dismissed, setDismissed] = useState(false);

  const products = useMemo(() => getSuggestedCrossSellProducts(), [tourId]);
  const showAllColor = useMemo(() => SHOWALL_COLORS[hashToIndex(String(tourId), SHOWALL_COLORS.length)], [tourId]);

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

  return { products, qtyBySku, inc, dec, selected, productsTotal, productsCurrency, dismissed, setDismissed, showAllColor };
}

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
    selected.forEach((p) => addItem(toBundleCartItem(p), qtyBySku[p.sku]));
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
