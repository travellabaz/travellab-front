import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { truncate } from '../utils/text';
import { contactManager, managerLabel } from '../utils/managers';
import { extractMinPrice, formatPrice, calcReward, formatPoints, calcBalanceDiscount } from '../utils/price';
import { isTourExpired, extractTourDateRange, formatTourDate } from '../utils/tourDate';

export default function TourCard({ tour }) {
  const { isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();
  const price = extractMinPrice(tour.description);
  const reward = price ? calcReward(price) : null;
  const balanceDiscount = price && isAuthenticated ? calcBalanceDiscount(price, Number(profile.azn) || 0) : null;
  const expired = isTourExpired(tour.description);
  const dateRange = extractTourDateRange(tour.description);

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
        {(expired || reward) && (
          <div className="tl-pkg-badges">
            {expired ? (
              <span className="tl-badge tl-badge-off">Bitib</span>
            ) : (
              <span className="tl-badge tl-badge-lp">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 1L7.35 4.15L10.8 4.5L8.2 6.77L8.95 10.15L6 8.35L3.05 10.15L3.8 6.77L1.2 4.5L4.65 4.15L6 1Z" fill="currentColor" />
                </svg>
                +{formatPoints(reward.points)} Lab Point
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
        {dateRange && (
          <div className="tl-pkg-dates">
            <div className="tl-pkg-dates-item">
              <svg className="tl-pkg-dates-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M3 10H21M8 3V6M16 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div>
                <span className="tl-pkg-dates-label">Giriş</span>
                <span className="tl-pkg-dates-value">{formatTourDate(dateRange.checkIn)}</span>
              </div>
            </div>
            <div className="tl-pkg-dates-item">
              <div>
                <span className="tl-pkg-dates-label">Çıxış</span>
                <span className="tl-pkg-dates-value">{formatTourDate(dateRange.checkOut)}</span>
              </div>
            </div>
          </div>
        )}
        {price && (
          <div className="tl-pkg-price" style={{ display: 'block' }}>
            <span className="tl-price-now">{formatPrice(price.amount, price.currency)}</span>
            {balanceDiscount && balanceDiscount.discountAzn > 0 && (
              <div className="tl-price-inst">
                <span>Lab Point ilə: -{formatPrice(balanceDiscount.discountAzn, 'AZN')} → {formatPrice(balanceDiscount.finalAzn, 'AZN')}</span>
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
            Ətraflı
          </Link>
          {!expired && (
            <button
              type="button"
              className="tl-btn-book"
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); contactManager(tour); }}
            >
              {managerLabel()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
