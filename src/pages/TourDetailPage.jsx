import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import { useTours } from '../context/ToursContext';
import { useModals } from '../context/ModalContext';
import { useCart } from '../context/CartContext';
import { isMobile } from '../utils/managers';
import { extractMinPrice, formatPrice } from '../utils/price';
import { isTourExpired } from '../utils/tourDate';
import { toTourCartItem } from '../utils/tourCartItem';
import { parseTourCaption } from '../utils/parseTourCaption';
import InstallmentCalculator from '../components/InstallmentCalculator';
import TravelProductsSidePanel, { TravelProductsPicker, useTravelProductsCart } from '../components/TravelProductsCrossSell';
import Breadcrumb from '../components/Breadcrumb';

const S = (p) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {p}
  </svg>
);
const INCLUDED_ICONS = {
  '✈️': S(<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8L8 11l-3 3H3l-1 1 3 2 2 3 1-1v-2l3-3 3.9 3.7a.5.5 0 0 0 .8-.5Z" />),
  '🧳': S(<><rect x="5" y="8" width="14" height="12" rx="2" /><path d="M9 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3M9 12v4M15 12v4" /></>),
  '🏩': S(<><path d="M3 21h18M4 21V7l8-4 8 4v14M9 21v-4a3 3 0 0 1 6 0v4" /></>),
  '🏨': S(<><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h.01M13 7h.01M9 11h.01M13 11h.01M9 15h.01M13 15h.01" /></>),
  '🥧': S(<><path d="M3 11h18M4 11a8 8 0 0 1 16 0M8 21l1-6M16 21l-1-6M6 21h12" /></>),
  '🥐': S(<><path d="M3 11h18M4 11a8 8 0 0 1 16 0M8 21l1-6M16 21l-1-6M6 21h12" /></>),
  '🚗': S(<><path d="M5 17h14M6 17l-1-5 2-5h10l2 5-1 5M6 12h12" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></>),
  '🚉': S(<><rect x="6" y="3" width="12" height="14" rx="2" /><path d="M6 11h12M9 17l-2 4M15 17l2 4M9 7h.01M15 7h.01" /></>),
  '🚆': S(<><rect x="6" y="3" width="12" height="14" rx="2" /><path d="M6 11h12M9 17l-2 4M15 17l2 4M9 7h.01M15 7h.01" /></>),
  '🎟️': S(<><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" /><path d="M9 6v12" strokeDasharray="2 2" /></>),
  '📃': S(<><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></>),
};

const PHONE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);
const WA_ICON = (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
  </svg>
);

export default function TourDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { tours, loading } = useTours();
  const { openAuth } = useModals();
  const { addItem } = useCart();

  const tour = tours.find((x) => String(x.id) === id);
  const parsed = useMemo(() => (tour ? parseTourCaption(tour.description) : null), [tour]);

  const [hotelIdx, setHotelIdx] = useState(0);
  useEffect(() => setHotelIdx(0), [id]);

  const crossSellCart = useTravelProductsCart();

  // Show one manager, not the whole list — picked once per tour view.
  const manager = useMemo(() => {
    const list = parsed?.managers || [];
    return list.length ? list[Math.floor(Math.random() * list.length)] : null;
  }, [parsed, id]);

  if (loading) {
    return (
      <main className="tpwl-main">
        <section className="tl-page-top">
          <div className="tl-section" style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
            {t('common.loading')}
          </div>
        </section>
      </main>
    );
  }

  if (!tour) {
    return (
      <main className="tpwl-main">
        <section className="tl-page-top">
          <div className="tl-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <h1 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 10 }}>
              {t('tourDetail.notFoundTitle')}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', marginBottom: 20 }}>{t('tourDetail.notFoundDesc')}</p>
            <Link to="/tours" className="tl-btn-book" style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff' }}>
              {t('tourDetail.backToAll')}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const expired = isTourExpired(tour.description);
  const hotels = parsed?.hotels || [];
  const selectedHotel = hotels[hotelIdx] || null;
  const fallbackPrice = extractMinPrice(tour.description);
  const currentPrice = selectedHotel
    ? selectedHotel.price
    : parsed?.total || fallbackPrice || null;
  const cashback = currentPrice ? Math.max(1, Math.round(currentPrice.amount * 0.01)) : null;

  // WhatsApp message carries the tour, the selected hotel + its price, and
  // the post link so the manager sees exactly what the visitor picked.
  const waText = [
    t('common.tourInterestMessage', { title: tour.title }),
    selectedHotel
      ? t('tourDetail.waHotel', { name: selectedHotel.name, price: formatPrice(selectedHotel.price.amount, selectedHotel.price.currency) })
      : currentPrice
        ? t('tourDetail.waPrice', { price: formatPrice(currentPrice.amount, currentPrice.currency) })
        : '',
    tour.permalink || '',
  ]
    .filter(Boolean)
    .join('\n');
  const waHref = (phone) => `https://wa.me/${phone}?text=${encodeURIComponent(waText)}`;

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section">
          <Breadcrumb
            items={[
              { name: t('tourDetail.home'), to: '/' },
              { name: t('tourDetail.tours'), to: '/tours' },
              { name: tour.title },
            ]}
          />

          <div className="tl-tourp">
            <div className="tl-tourp-layout">
            <div className="tl-tourp-main">
              {tour.imageUrl && (
                <div className="tl-tourp-hero" role="img" aria-label={tour.title} style={{ backgroundImage: `url('${tour.imageUrl}')` }}>
                  {expired && <span className="tl-badge tl-badge-off">{t('tourCard.expired')}</span>}
                </div>
              )}

              <div className="tl-tag">{t('tourDetail.tours')}</div>
              <h1 className="tl-tourp-title">{tour.title}</h1>

              {(parsed?.dateText || parsed?.destination || parsed?.duration || parsed?.venue) && (
                <div className="tl-tourp-meta">
                  {parsed.dateText && (
                    <span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      {parsed.dateText}
                    </span>
                  )}
                  {(parsed.destination || parsed.venue) && (
                    <span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                      {parsed.venue || parsed.destination}
                    </span>
                  )}
                  {parsed.duration && (
                    <span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                      {parsed.duration}
                    </span>
                  )}
                </div>
              )}

              {hotels.length > 0 && (
                <div className="tl-tourp-block">
                  <h2 className="tl-tourp-h2">{t('tourDetail.hotelsTitle')}</h2>
                  <div className="tl-tourp-hotels">
                    {hotels.map((h, i) => (
                      <button
                        type="button"
                        key={i}
                        className={`tl-tourp-hotel${i === hotelIdx ? ' active' : ''}`}
                        onClick={() => setHotelIdx(i)}
                        aria-pressed={i === hotelIdx}
                      >
                        <span className="tl-tourp-hotel-info">
                          <strong>{h.name}</strong>
                          {h.location && <span>{h.location}</span>}
                        </span>
                        <span className="tl-tourp-hotel-price">{formatPrice(h.price.amount, h.price.currency)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {parsed?.included?.length > 0 && (
                <div className="tl-tourp-block">
                  <h2 className="tl-tourp-h2">{t('tourDetail.includedTitle')}</h2>
                  <div className="tl-tourp-incl">
                    {parsed.included.map((it, i) => (
                      <div className="tl-tourp-incl-item" key={i}>
                        <span className="tl-tourp-incl-ico">{INCLUDED_ICONS[it.icon] || <span style={{ fontSize: 18 }}>{it.icon}</span>}</span>
                        <span>{it.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentPrice && (
                <div className="tl-tourp-total">
                  <div>
                    <span className="tl-tourp-total-label">{t('tourDetail.totalPrice')}</span>
                    <strong>{formatPrice(currentPrice.amount, currentPrice.currency)}</strong>
                  </div>
                  {cashback != null && (
                    <button type="button" className="tl-tourp-cashback" onClick={() => openAuth('register')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M15 9.5A3.5 3.5 0 0 0 9 12a3.5 3.5 0 0 0 6 2.5" /></svg>
                      +{cashback} {currentPrice.currency} {t('tourDetail.cashback')}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                    </button>
                  )}
                </div>
              )}

              {currentPrice && (
                <div className="tl-tourp-block">
                  <InstallmentCalculator basePrice={currentPrice.amount} currency={currentPrice.currency} />
                </div>
              )}

              {parsed?.conditions?.length > 0 && (
                <div className="tl-tourp-block">
                  <h2 className="tl-tourp-h2">{t('tourDetail.conditionsTitle')}</h2>
                  <ul className="tl-tourp-conditions">
                    {parsed.conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              <TravelProductsPicker cart={crossSellCart} />

              {manager && (
                <div className="tl-tourp-block">
                  <h2 className="tl-tourp-h2">{t('tourDetail.managersTitle')}</h2>
                  <div className="tl-tourp-managers">
                    <div className="tl-tourp-manager">
                      <span className="tl-tourp-manager-info">
                        <strong>{manager.name}</strong>
                        <span>+{manager.phone.replace(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2}).*/, '$1 $2 $3 $4 $5')}</span>
                      </span>
                      <span className="tl-tourp-manager-actions">
                        <a href={`tel:+${manager.phone}`} aria-label={t('common.call')}>{PHONE_ICON}</a>
                        <a
                          href={waHref(manager.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="wa"
                          aria-label="WhatsApp"
                        >
                          {WA_ICON}
                        </a>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!parsed && <p className="tl-tourp-rawdesc">{tour.description}</p>}

              {!expired && (
                <div className="tl-tourp-cta">
                  <a
                    href={manager ? (isMobile() ? waHref(manager.phone) : `tel:+${manager.phone}`) : '#'}
                    target={isMobile() ? '_blank' : undefined}
                    rel={isMobile() ? 'noopener noreferrer' : undefined}
                    className="tl-btn-book"
                    style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff', padding: '13px 26px' }}
                  >
                    {isMobile() ? t('common.waWrite') : t('common.call')}
                  </a>
                  <button
                    type="button"
                    onClick={() => addItem(toTourCartItem(tour))}
                    className="tl-btn-book"
                    style={{ border: '1px solid var(--tl-gray-200)', cursor: 'pointer', background: '#fff', color: 'var(--tl-navy)', padding: '13px 26px' }}
                  >
                    {t('shop.addToCart')}
                  </button>
                </div>
              )}
            </div>

            <TravelProductsSidePanel cart={crossSellCart} tour={tour} tourPrice={currentPrice} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
