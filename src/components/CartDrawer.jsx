import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import { useCart } from '../context/CartContext';
import { SHOP_WHATSAPP_NUMBER } from '../utils/shopWhatsapp';

// No real checkout exists (see the Shop task — WhatsApp is the actual
// order path), so "checkout" here is just building one message that lists
// every cart line and handing off to WhatsApp, same pattern as every other
// wa.me CTA on the site.
export default function CartDrawer() {
  const { t } = useTranslation();
  const { lines, count, total, removeItem, setQty, drawerOpen, closeDrawer } = useCart();

  if (!drawerOpen) return null;

  const waText = lines
    .map((l) => `${l.product.name} (${l.product.sku}) x${l.qty}`)
    .join('\n');
  const waUrl = 'https://wa.me/' + SHOP_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(t('shop.waCartMessage', { list: waText }));

  return createPortal(
    <div className="tl-cart-overlay" onClick={closeDrawer}>
      <div className="tl-cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="tl-cart-drawer-head">
          <h3>{t('shop.cartTitle')} {count > 0 && `(${count})`}</h3>
          <button type="button" onClick={closeDrawer} aria-label={t('shop.cartClose')}>✕</button>
        </div>

        {lines.length === 0 ? (
          <p className="tl-cart-empty">{t('shop.cartEmpty')}</p>
        ) : (
          <>
            <div className="tl-cart-lines">
              {lines.map(({ product, qty }) => (
                <div className="tl-cart-line" key={product.sku}>
                  {product.images[0] && <img src={product.images[0]} alt={product.name} />}
                  <div className="tl-cart-line-info">
                    <strong>{product.name}</strong>
                    <span>{product.price} {product.currency}</span>
                    <div className="tl-qty-stepper tl-qty-stepper-sm">
                      <button type="button" onClick={() => setQty(product.sku, qty - 1)}>−</button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => setQty(product.sku, qty + 1)}>+</button>
                    </div>
                  </div>
                  <button type="button" className="tl-cart-line-remove" onClick={() => removeItem(product.sku)} aria-label={t('shop.cartRemove')}>✕</button>
                </div>
              ))}
            </div>
            <div className="tl-cart-total">
              <span>{t('shop.cartTotal')}</span>
              <strong>{total.toFixed(2)} AZN</strong>
            </div>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="tl-cart-checkout">
              {t('shop.whatsappOrder')}
            </a>
          </>
        )}

        <Link to="/shop" className="tl-cart-continue" onClick={closeDrawer}>{t('shop.cartContinue')}</Link>
      </div>
    </div>,
    document.body
  );
}
