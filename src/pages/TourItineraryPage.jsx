import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import { useTours } from '../context/ToursContext';
import { pickManager, formatManagerNumber } from '../utils/managers';
import { extractMinPrice, formatPrice } from '../utils/price';
import { isTourExpired } from '../utils/tourDate';
import { parseTourCaption } from '../utils/parseTourCaption';
import { getTourCategory } from '../utils/tourCategory';
import { findDestinationGuidePost } from '../utils/tourBlogMatch';
import Breadcrumb from '../components/Breadcrumb';

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

export default function TourItineraryPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { tours, loading } = useTours();

  const tour = tours.find((x) => String(x.id) === id);
  const parsed = useMemo(() => (tour ? parseTourCaption(tour.description) : null), [tour]);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  useEffect(() => setBannerDismissed(false), [id]);

  const [lightboxImage, setLightboxImage] = useState(null);
  useEffect(() => setLightboxImage(null), [id]);

  // Prefer a manager actually named in this tour's caption; fall back to
  // the site-wide pool so the page always has a working WhatsApp contact
  // even for a caption the parser couldn't read managers out of.
  const manager = useMemo(() => {
    if (parsed?.managers?.length) {
      const m = parsed.managers[Math.floor(Math.random() * parsed.managers.length)];
      return { name: m.name, phone: m.phone };
    }
    const m = pickManager();
    return { name: m.name, phone: m.number };
  }, [parsed, id]);

  // Not every caption has a recognisable 📍/date-range destination (some
  // just never state one) — the tour title almost always names the city,
  // so it's a reliable second attempt when the caption gave us nothing.
  const guidePost = useMemo(() => {
    if (!tour) return null;
    return (
      (parsed?.destination && findDestinationGuidePost(parsed.destination, i18n.language)) ||
      findDestinationGuidePost(tour.title, i18n.language)
    );
  }, [parsed, tour, i18n.language]);

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
  const fallbackPrice = extractMinPrice(tour.description);
  const price = parsed?.total || fallbackPrice || null;
  const category = getTourCategory(tour);
  const categoryLabel = category.name !== 'Digər' ? t(`tourCategoryLabels.${category.name}`) : null;

  const waStaleHref = `https://wa.me/${manager.phone}?text=${encodeURIComponent(t('tourItinerary.staleBannerMessage', { title: tour.title }))}`;
  const waHref = `https://wa.me/${manager.phone}?text=${encodeURIComponent(t('common.tourInterestMessage', { title: tour.title }))}`;

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section">
          {expired && !bannerDismissed && (
            <div className="tl-itin-banner">
              <span className="tl-itin-banner-text">{t('tourItinerary.staleBanner')}</span>
              <a href={waStaleHref} target="_blank" rel="noopener noreferrer" className="tl-itin-banner-cta">
                {WA_ICON}
                {t('tourItinerary.staleBannerCta')}
              </a>
              <button type="button" className="tl-itin-banner-close" onClick={() => setBannerDismissed(true)} aria-label={t('common.close')}>
                ×
              </button>
            </div>
          )}

          <Breadcrumb
            items={[
              { name: t('tourDetail.home'), to: '/' },
              { name: t('tourDetail.tours'), to: '/tours' },
              { name: tour.title, to: `/tours/${tour.id}` },
              { name: t('tourItinerary.crumbLabel') },
            ]}
          />

          <div className="tl-itin">
            {tour.imageUrl && (
              <div className="tl-tourp-hero" role="img" aria-label={tour.title} style={{ backgroundImage: `url('${tour.imageUrl}')` }}>
                {expired && <span className="tl-badge tl-badge-off">{t('tourCard.expired')}</span>}
              </div>
            )}

            <div className="tl-tag">{categoryLabel || t('tourDetail.tours')}</div>
            <div className="tl-itin-eyebrow">{t('tourItinerary.crumbLabel')}</div>
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

            {parsed?.cities?.length > 0 && (
              <div className="tl-tourp-block">
                <h2 className="tl-tourp-h2">{t('tourDetail.itineraryTitle')}</h2>
                <div className="tl-itin-timeline">
                  {parsed.cities.map((c, i) => {
                    // Same reasoning as TourDetailPage.jsx's
                    // hasDistinctCityImages — a repeated identical photo on
                    // every leg reads as a bug, so this only shows a photo
                    // when the carousel actually has more than one.
                    const img = tour.images?.length > 1 ? (tour.images[i] || tour.images[0]) : null;
                    return (
                      <div className="tl-itin-timeline-item" key={i}>
                        <div className="tl-itin-timeline-date">{c.dateRange}</div>
                        <span className="tl-itin-timeline-dot" />
                        <div className="tl-itin-timeline-card">
                          {img && (
                            <button
                              type="button"
                              className="tl-itin-timeline-img"
                              style={{ backgroundImage: `url('${img}')` }}
                              aria-label={c.name}
                              onClick={() => setLightboxImage(img)}
                            />
                          )}
                          <div className="tl-itin-timeline-body">
                            <h3 className="tl-itin-timeline-city">{c.name}</h3>
                            <div className="tl-itin-timeline-nights">
                              {c.dateRange}{c.nights != null ? ` · ${t('tourDetail.nightsCount', { n: c.nights })}` : ''}
                            </div>
                            {c.hotel && (
                              <div className="tl-itin-timeline-hotel">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M4 21V7l8-4 8 4v14M9 21v-4a3 3 0 0 1 6 0v4" /></svg>
                                {c.hotel}
                              </div>
                            )}
                            {tour.itineraryDayDescriptions?.[i] && (
                              <p className="tl-itin-timeline-desc">{tour.itineraryDayDescriptions[i]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {hotels.length > 0 && (
              <div className="tl-tourp-block">
                <h2 className="tl-tourp-h2">{t('tourDetail.hotelsTitle')}</h2>
                <div className="tl-tourp-hotels">
                  {hotels.map((h, i) => (
                    <div className="tl-tourp-hotel tl-itin-hotel-row" key={i}>
                      <span className="tl-tourp-hotel-info">
                        <strong>{h.name}</strong>
                        {h.location && <span>{h.location}</span>}
                      </span>
                      <span className="tl-tourp-hotel-price">{formatPrice(h.price.amount, h.price.currency)}</span>
                    </div>
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
                      <span style={{ fontSize: 18 }}>{it.icon}</span>
                      <span>{it.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(parsed?.conditions?.length > 0 || parsed?.paymentNote) && (
              <div className="tl-tourp-block">
                <h2 className="tl-tourp-h2">{t('tourDetail.conditionsTitle')}</h2>
                {parsed?.conditions?.length > 0 && (
                  <ul className="tl-tourp-conditions">
                    {parsed.conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
                {parsed?.paymentNote && <p className="tl-itin-payment-note">{parsed.paymentNote}</p>}
              </div>
            )}

            {!parsed && <p className="tl-tourp-rawdesc">{tour.description}</p>}

            {guidePost && (
              <Link to={`/blog/${guidePost.slug}`} className="tl-itin-guide-card">
                <span className="tl-itin-guide-label">{t('tourItinerary.cityGuideLabel')}</span>
                <span className="tl-itin-guide-title">{guidePost.title}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </Link>
            )}

            <div className="tl-itin-cta-row">
              {price && (
                <div className="tl-tourp-total" style={{ margin: 0 }}>
                  <div>
                    <span className="tl-tourp-total-label">{t('tourDetail.totalPrice')}</span>
                    <strong>{formatPrice(price.amount, price.currency)}</strong>
                  </div>
                </div>
              )}
              <div className="tl-itin-cta-actions">
                {!expired && (
                  <Link to={`/tours/${tour.id}`} className="tl-btn-book" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff', padding: '13px 26px' }}>
                    {t('tourItinerary.bookCta')}
                  </Link>
                )}
                <span className="tl-itin-manager">
                  <span className="tl-tourp-manager-info">
                    <strong>{manager.name}</strong>
                    <span>{formatManagerNumber(manager.phone)}</span>
                  </span>
                  <span className="tl-tourp-manager-actions">
                    <a href={`tel:+${manager.phone}`} aria-label={t('common.call')}>{PHONE_ICON}</a>
                    <a href={waHref} target="_blank" rel="noopener noreferrer" className="wa" aria-label="WhatsApp">{WA_ICON}</a>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {lightboxImage && (
        <div className="tl-itin-lightbox" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="" />
        </div>
      )}
    </main>
  );
}
