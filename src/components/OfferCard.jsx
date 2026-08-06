import { contactManager, managerLabel } from '../utils/managers';
import { formatPrice } from '../utils/price';

function formatDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd || '';
  return `${yyyymmdd.slice(6, 8)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(0, 4)}`;
}

export default function OfferCard({ offer }) {
  const stars = offer.star ? '★'.repeat(offer.star) : '';

  // managerLink() only reads title/permalink — a live-search offer isn't a
  // "tour" post, so it's shaped into that same minimal contract here rather
  // than changing utils/managers.js.
  const contactTour = {
    title: [offer.hotelName || offer.tourTitle, offer.nights ? `${offer.nights} gecə` : '', offer.meal]
      .filter(Boolean)
      .join(' — '),
    permalink: '',
  };

  return (
    <div className="tl-offer-card">
      {stars && <div className="tl-offer-card-star">{stars}</div>}
      <h3 className="tl-offer-card-hotel">{offer.hotelName}</h3>
      <div className="tl-offer-card-meta">
        {[offer.resortTown, offer.tourTitle].filter(Boolean).join(' · ')}
      </div>
      <div className="tl-offer-card-meta">
        {[offer.nights ? `${offer.nights} gecə` : '', offer.meal, formatDate(offer.checkIn)].filter(Boolean).join(' · ')}
      </div>
      {offer.price != null && (
        <div className="tl-offer-card-price">{formatPrice(offer.price, offer.currency)}</div>
      )}
      <button
        type="button"
        className="tl-btn-book"
        style={{ border: 'none', cursor: 'pointer', width: '100%' }}
        onClick={() => contactManager(contactTour)}
      >
        {managerLabel()}
      </button>
    </div>
  );
}
