import { useTranslation } from 'react-i18next';
import Link, { useLocalizedNavigate } from './LocalizedLink';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { useWishlist } from '../context/WishlistContext';
import { truncate } from '../utils/text';
import { contactManager, managerLabel } from '../utils/managers';
import { extractMinPrice, formatPrice, calcReward, formatPoints, calcBalanceDiscount } from '../utils/price';
import { isTourExpired } from '../utils/tourDate';
import { toTourCartItem } from '../utils/tourCartItem';

export default function TourCard({ tour }) {
  const { t } = useTranslation();
  const { isAuthenticated, profile } = useAuth();
  const { openManagerContact } = useModals();
  const { has, toggle } = useWishlist();
  const navigate = useLocalizedNavigate();
  const price = extractMinPrice(tour.description);
  const reward = price ? calcReward(price) : null;
  const balanceDiscount = price && isAuthenticated ? calcBalanceDiscount(price, Number(profile.azn) || 0) : null;
  const expired = isTourExpired(tour.description);
  const wishlisted = has('tour', String(tour.id));

  return (
    <div
      className={`tl-pkg-card${expired ? ' tl-pkg-card-expired' : ''}`}
      onClick={() => navigate(`/tours/${tour.id}`)}
    >
      <div
        className="tl-pkg-img"
        role="img"
        aria-label={truncate(tour.title, 60)}
        style={{
          fontSize: 0,
          ...(tour.imageUrl
            ? { backgroundImage: `url('${tour.imageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {}),
        }}
      >
        <button
          type="button"
          className={'tl-product-card-wish' + (wishlisted ? ' active' : '')}
          aria-label={t('shop.wishlist')}
          aria-pressed={wishlisted}
          onClick={(e) => { e.stopPropagation(); toggle(toTourCartItem(tour)); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>
        {(expired || reward) && (
          <div className="tl-pkg-badges">
            {expired ? (
              <span className="tl-badge tl-badge-off">{t('tourCard.expired')}</span>
            ) : (
              <span className="tl-badge tl-badge-lp">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 1L7.35 4.15L10.8 4.5L8.2 6.77L8.95 10.15L6 8.35L3.05 10.15L3.8 6.77L1.2 4.5L4.65 4.15L6 1Z" fill="currentColor" />
                </svg>
                +{formatPoints(reward.points)} {t('tourCard.labPoint')}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="tl-pkg-body">
        <h3 className="tl-pkg-name">{truncate(tour.title, 60)}</h3>
        <div className="tl-pkg-meta" style={{ display: 'block', color: 'var(--tl-gray-600)', lineHeight: 1.5, marginBottom: 14 }}>
          {truncate(tour.description, 110)}
        </div>
        {price && (
          <div className="tl-pkg-price" style={{ display: 'block' }}>
            <span className="tl-price-now">{formatPrice(price.amount, price.currency)}</span>
            {balanceDiscount && balanceDiscount.discountAzn > 0 && (
              <div className="tl-price-inst">
                <span>{t('tourCard.labPointDiscount', { discount: formatPrice(balanceDiscount.discountAzn, 'AZN'), final: formatPrice(balanceDiscount.finalAzn, 'AZN') })}</span>
                <svg className="tl-price-inst-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.5 10.5L8 6L4.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        )}
        <div className="tl-pkg-actions">
          <Link
            to={`/tours/${tour.id}`}
            className="tl-btn-book"
            style={{ border: 'none', cursor: 'pointer', background: 'var(--tl-gray-100)', color: 'var(--tl-navy)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            {t('tourCard.more')}
          </Link>
          {!expired && (
            <button
              type="button"
              className="tl-btn-book"
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); contactManager(tour, t, openManagerContact); }}
            >
              {managerLabel(t)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
