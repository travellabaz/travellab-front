import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

function WishlistSection({ title, items, remove, addItem }) {
  const { t } = useTranslation();
  return (
    <div className="tl-cart-section">
      <div className="tl-cart-section-title">{title}</div>
      <div className="tl-cart-lines">
        {items.map((item) => (
          <div className="tl-cart-line" key={`${item.kind}:${item.id}`}>
            {item.image && <img src={item.image} alt={item.title} />}
            <div className="tl-cart-line-info">
              <Link to={item.url}><strong>{item.title}</strong></Link>
              {item.price != null && <span>{item.price} {item.currency}</span>}
              <button type="button" className="tl-wishlist-add-to-cart" onClick={() => addItem(item, 1)}>
                {t('shop.addToCart')}
              </button>
            </div>
            <button type="button" className="tl-cart-line-remove" onClick={() => remove(item.kind, item.id)} aria-label={t('shop.cartRemove')}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Same right-side drawer pattern as CartDrawer — a saved item needs the
// same shape whether it's a Shop product or a tour.
export default function WishlistDrawer() {
  const { t } = useTranslation();
  const { productItems, tourItems, count, remove, drawerOpen, closeDrawer } = useWishlist();
  const { addItem } = useCart();

  if (!drawerOpen) return null;

  const isEmpty = productItems.length === 0 && tourItems.length === 0;

  return createPortal(
    <div className="tl-cart-overlay" onClick={closeDrawer}>
      <div className="tl-cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="tl-cart-drawer-head">
          <h3>{t('shop.wishlistTitle')} {count > 0 && `(${count})`}</h3>
          <button type="button" onClick={closeDrawer} aria-label={t('shop.cartClose')}>✕</button>
        </div>

        {isEmpty ? (
          <p className="tl-cart-empty">{t('shop.wishlistEmpty')}</p>
        ) : (
          <>
            {productItems.length > 0 && (
              <WishlistSection title={t('shop.cartSectionShop')} items={productItems} remove={remove} addItem={addItem} />
            )}
            {tourItems.length > 0 && (
              <WishlistSection title={t('shop.cartSectionTours')} items={tourItems} remove={remove} addItem={addItem} />
            )}
          </>
        )}

        <Link to="/shop" className="tl-cart-continue" onClick={closeDrawer}>{t('shop.cartContinue')}</Link>
      </div>
    </div>,
    document.body
  );
}
