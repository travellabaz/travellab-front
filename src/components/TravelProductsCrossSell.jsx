import { useMemo, useState } from 'react';
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

export default function TravelProductsCrossSell({ tour, tourPrice }) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [qtyBySku, setQtyBySku] = useState({});

  const products = useMemo(
    () => SUGGESTED_SKUS.map((sku) => getProductBySku(sku)).filter((p) => p && p.inStock),
    []
  );

  const inc = (sku) => setQtyBySku((q) => ({ ...q, [sku]: (q[sku] || 0) + 1 }));
  const dec = (sku) =>
    setQtyBySku((q) => {
      const next = { ...q };
      const n = (next[sku] || 0) - 1;
      if (n <= 0) delete next[sku];
      else next[sku] = n;
      return next;
    });

  if (products.length === 0) return null;

  const selected = products.filter((p) => qtyBySku[p.sku] > 0);
  const productsTotal = selected.reduce((sum, p) => sum + p.price * qtyBySku[p.sku], 0);
  const productsCurrency = selected[0]?.currency || 'AZN';

  const addBundle = () => {
    addItem(toTourCartItem(tour));
    selected.forEach((p) => addItem(toCartItem(p), qtyBySku[p.sku]));
  };

  return (
    <div className="tl-tourp-block">
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

      {selected.length > 0 && (
        <div className="tl-tourp-crosssell-summary">
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
          <button type="button" className="tl-tourp-crosssell-cta" onClick={addBundle}>
            {t('tourDetail.addBundleCta')}
          </button>
        </div>
      )}
    </div>
  );
}
