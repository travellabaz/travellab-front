import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contactManager, managerLabel } from '../utils/managers';
import { formatPrice, calcReward, formatPoints, calcBalanceDiscount } from '../utils/price';
import { offerGradient } from '../utils/offerVisual';

export function formatOfferDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd || '';
  return `${yyyymmdd.slice(6, 8)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(0, 4)}`;
}

// managerLink()/contactManager() only read title/permalink — a live-search
// offer isn't a "tour" post, so it's shaped into that same minimal contract
// here rather than changing utils/managers.js.
export function offerContactShape(offer) {
  return {
    title: [offer.hotelName || offer.tourTitle, offer.nights ? `${offer.nights} gecə` : '', offer.meal]
      .filter(Boolean)
      .join(' — '),
    permalink: '',
  };
}

// Mirrors TourCard.jsx's structure/classes so live Kompas offers look and
// behave like the existing Instagram-tour cards (same LabPoint badge,
// balance-discount line, whole-card click-through). `photos` is the shared
// pool of real destination photos fetched once per search (see
// TourSearchPage.jsx) — every card picks a random one from it and sticks
// with it; if the pool is empty (still loading, or Pexels/no key), a
// gradient (utils/offerVisual.js) fills in instead, since Kompas itself has
// no hotel-photo API.
export default function OfferCard({ offer, photos }) {
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    if (photos && photos.length > 0 && !photoUrl) {
      setPhotoUrl(photos[Math.floor(Math.random() * photos.length)]);
    }
  }, [photos]);

  const price = offer.price != null ? { amount: offer.price, currency: offer.currency } : null;
  const reward = price ? calcReward(price) : null;
  const balanceDiscount = price && isAuthenticated ? calcBalanceDiscount(price, Number(profile.azn) || 0) : null;

  const openDetail = () => navigate('/tours/search/offer', { state: { offer: { ...offer, photoUrl } } });

  const imgStyle = photoUrl
    ? { backgroundImage: `url('${photoUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: offerGradient(offer.hotelName) };

  return (
    <div className="tl-pkg-card" onClick={openDetail}>
      <div className="tl-pkg-img" style={imgStyle}>
        {reward && (
          <div className="tl-pkg-badges">
            <span className="tl-badge tl-badge-lp">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 1L7.35 4.15L10.8 4.5L8.2 6.77L8.95 10.15L6 8.35L3.05 10.15L3.8 6.77L1.2 4.5L4.65 4.15L6 1Z" fill="currentColor" />
              </svg>
              +{formatPoints(reward.points)} Lab Point
            </span>
          </div>
        )}
        {!photoUrl && (
          <div className="tl-offer-img-content">
            {offer.star ? <div className="tl-offer-img-star">{'★'.repeat(offer.star)}</div> : null}
            <div className="tl-offer-img-place">{offer.resortTown || offer.tourTitle}</div>
          </div>
        )}
      </div>
      <div className="tl-pkg-body">
        <h3 className="tl-pkg-name">{offer.hotelName}</h3>
        <div className="tl-pkg-meta" style={{ display: 'block', color: 'var(--tl-gray-600)', lineHeight: 1.5, marginBottom: 14, minHeight: 33 }}>
          {[offer.tourTitle, offer.nights ? `${offer.nights} gecə` : '', offer.meal].filter(Boolean).join(' · ')}
        </div>
        {(offer.checkIn || offer.checkOut) && (
          <div className="tl-pkg-dates">
            {offer.checkIn && (
              <div className="tl-pkg-dates-item">
                <svg className="tl-pkg-dates-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 10H21M8 3V6M16 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>
                  <span className="tl-pkg-dates-label">Giriş</span>
                  <span className="tl-pkg-dates-value">{formatOfferDate(offer.checkIn)}</span>
                </div>
              </div>
            )}
            {offer.checkOut && (
              <div className="tl-pkg-dates-item">
                <div>
                  <span className="tl-pkg-dates-label">Çıxış</span>
                  <span className="tl-pkg-dates-value">{formatOfferDate(offer.checkOut)}</span>
                </div>
              </div>
            )}
          </div>
        )}
        {price && (
          <div className="tl-pkg-price" style={{ display: 'block' }}>
            <span className="tl-price-now">{formatPrice(price.amount, price.currency)}</span>
            {balanceDiscount && balanceDiscount.discountAzn > 0 && (
              <div className="tl-price-inst">
                <span>
                  Lab Point ilə: -{formatPrice(balanceDiscount.discountAzn, 'AZN')} → {formatPrice(balanceDiscount.finalAzn, 'AZN')}
                </span>
                <svg className="tl-price-inst-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.5 10.5L8 6L4.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        )}
        <div className="tl-pkg-actions">
          <button
            type="button"
            className="tl-btn-book"
            style={{ border: 'none', cursor: 'pointer', background: 'var(--tl-gray-100)', color: 'var(--tl-navy)' }}
            onClick={(e) => { e.stopPropagation(); openDetail(); }}
          >
            Ətraflı
          </button>
          <button
            type="button"
            className="tl-btn-book"
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); contactManager(offerContactShape(offer)); }}
          >
            {managerLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}
