import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { productSlug } from '../data/shop';

// Same right-side drawer pattern as CartDrawer (and its CSS classes,
// reused as-is — a list of saved products needs the same shape).
export default function WishlistDrawer() {
  const { t } = useTranslation();
  const { products, count, remove, drawerOpen, closeDrawer } = useWishlist();
  const { addItem } = useCart();

  if (!drawerOpen) return null;

  return createPortal(
    <div className="tl-cart-overlay" onClick={closeDrawer}>
      <div className="tl-cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="tl-cart-drawer-head">
          <h3>{t('shop.wishlistTitle')} {count > 0 && `(${count})`}</h3>
          <button type="button" onClick={closeDrawer} aria-label={t('shop.cartClose')}>✕</button>
        </div>

        {products.length === 0 ? (
          <p className="tl-cart-empty">{t('shop.wishlistEmpty')}</p>
        ) : (
          <div className="tl-cart-lines">
            {products.map((product) => (
              <div className="tl-cart-line" key={product.sku}>
                {product.images[0] && <img src={product.images[0]} alt={product.name} />}
                <div className="tl-cart-line-info">
                  <Link to={`/shop/${productSlug(product)}`} onClick={closeDrawer}><strong>{product.name}</strong></Link>
                  <span>{product.price} {product.currency}</span>
                  <button type="button" className="tl-wishlist-add-to-cart" onClick={() => addItem(product.sku, 1)}>
                    {t('shop.addToCart')}
                  </button>
                </div>
                <button type="button" className="tl-cart-line-remove" onClick={() => remove(product.sku)} aria-label={t('shop.cartRemove')}>✕</button>
              </div>
            ))}
          </div>
        )}

        <Link to="/shop" className="tl-cart-continue" onClick={closeDrawer}>{t('shop.cartContinue')}</Link>
      </div>
    </div>,
    document.body
  );
}
