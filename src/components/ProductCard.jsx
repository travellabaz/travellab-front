import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import ColorDots from './ColorDots';
import { useWishlist } from '../context/WishlistContext';
import { productSlug } from '../data/shop';

export default function ProductCard({ product }) {
  const { t } = useTranslation();
  const { has, toggle } = useWishlist();
  const wishlisted = has(product.sku);
  const href = `/shop/${productSlug(product)}`;

  return (
    <div className="tl-product-card">
      <Link to={href} className="tl-product-card-media">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" />
        ) : (
          <span className="tl-product-card-noimg" aria-hidden="true" />
        )}
        {!product.inStock && <span className="tl-product-oos-badge">{t('shop.outOfStock')}</span>}
      </Link>
      <button
        type="button"
        className={'tl-product-card-wish' + (wishlisted ? ' active' : '')}
        aria-label={t('shop.wishlist')}
        aria-pressed={wishlisted}
        onClick={(e) => { e.preventDefault(); toggle(product.sku); }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </button>
      <Link to={href} className="tl-product-card-body">
        <div className="tl-product-card-name">{product.name}</div>
        <div className="tl-product-card-price">{product.price} {product.currency}</div>
        <ColorDots colors={product.colors} max={3} />
      </Link>
    </div>
  );
}
