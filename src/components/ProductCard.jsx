import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import ColorDots from './ColorDots';
import { useWishlist } from '../context/WishlistContext';
import { productSlug, toCartItem } from '../data/shop';

// `group` — one entry from getProductGroups(): { name, colors, variants,
// defaultVariant, ... }. The card always represents defaultVariant (its
// cheapest/smallest size) — picking a different size happens on the
// product page itself, same place colours are picked.
export default function ProductCard({ group }) {
  const { t } = useTranslation();
  const { has, toggle } = useWishlist();
  const variant = group.defaultVariant;
  const wishlisted = has('product', variant.sku);
  const href = `/shop/${productSlug(variant)}`;

  return (
    <div className="tl-product-card">
      <Link to={href} className="tl-product-card-media">
        {variant.images[0] ? (
          <img src={variant.images[0]} alt={`${group.name} - Travellab Shop`} loading="lazy" />
        ) : (
          <span className="tl-product-card-noimg" aria-hidden="true" />
        )}
        {!group.inStock && <span className="tl-product-oos-badge">{t('shop.outOfStock')}</span>}
      </Link>
      <button
        type="button"
        className={'tl-product-card-wish' + (wishlisted ? ' active' : '')}
        aria-label={t('shop.wishlist')}
        aria-pressed={wishlisted}
        onClick={(e) => { e.preventDefault(); toggle(toCartItem(variant)); }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </button>
      <Link to={href} className="tl-product-card-body">
        <div className="tl-product-card-name">{group.name}</div>
        <div className="tl-product-card-price">
          {group.variants.length > 1
            ? t('shop.priceFromValue', { price: group.minPrice, currency: variant.currency })
            : `${group.minPrice} ${variant.currency}`}
        </div>
        <ColorDots colors={group.colors} max={3} />
      </Link>
    </div>
  );
}
