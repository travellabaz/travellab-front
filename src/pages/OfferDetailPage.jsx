import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { isMobile, managerLabel, managerLink, pickManager, formatManagerNumber } from '../utils/managers';
import { formatPrice, calcReward, formatPoints, calcBalanceDiscount } from '../utils/price';
import { offerGradient } from '../utils/offerVisual';
import { formatOfferDate, offerContactShape } from '../components/OfferCard';
import Breadcrumb from '../components/Breadcrumb';

// Kompas search results are ephemeral (a fresh live query per search, not
// stored with a fetchable ID) — so unlike TourDetailPage.jsx (which looks
// up a stable id in ToursContext), the offer is handed over via router
// state from OfferCard's click, not re-fetched. A direct link/refresh here
// has nothing to show — same as any "flash" search result page.
export default function OfferDetailPage() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const offer = state?.offer;
  const { isAuthenticated, profile } = useAuth();
  const { openManagerContact } = useModals();
  const [manager, setManager] = useState(pickManager);

  useEffect(() => {
    if (offer) setManager(pickManager());
  }, [offer]);

  if (!offer) {
    return (
      <main className="tpwl-main">
        <section className="tl-page-top">
          <div className="tl-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <h1 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 10 }}>
              {t('offerDetail.notFoundTitle')}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', marginBottom: 20 }}>
              {t('offerDetail.notFoundDesc')}
            </p>
            <Link to="/tours/search" className="tl-btn-book" style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff' }}>
              {t('offerDetail.backToSearch')}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const link = managerLink(offerContactShape(offer, t), manager, t);
  const price = offer.price != null ? { amount: offer.price, currency: offer.currency } : null;
  const reward = price ? calcReward(price) : null;
  const balanceDiscount = price && isAuthenticated ? calcBalanceDiscount(price, Number(profile.azn) || 0) : null;

  const description = [
    offer.tourTitle,
    offer.room,
    offer.meal,
    offer.nights ? t('offerDetail.nights', { n: offer.nights }) : '',
    offer.checkIn ? t('offerDetail.checkIn', { date: formatOfferDate(offer.checkIn) }) : '',
    offer.checkOut ? t('offerDetail.checkOut', { date: formatOfferDate(offer.checkOut) }) : '',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section">
          <Breadcrumb
            items={[
              { name: t('tourDetail.home'), to: '/' },
              { name: t('tourSearch.tourSearchCrumb'), to: '/tours/search' },
              { name: offer.hotelName },
            ]}
          />

          <div className="tl-tour-detail">
            <div
              className="tl-tour-detail-img"
              style={
                offer.photoUrl
                  ? { backgroundImage: `url('${offer.photoUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: offerGradient(offer.hotelName) }
              }
            >
              {reward && (
                <div className="tl-pkg-badges">
                  <span className="tl-badge tl-badge-lp">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 1L7.35 4.15L10.8 4.5L8.2 6.77L8.95 10.15L6 8.35L3.05 10.15L3.8 6.77L1.2 4.5L4.65 4.15L6 1Z" fill="currentColor" />
                    </svg>
                    +{formatPoints(reward.points)} {t('tourCard.labPoint')}
                  </span>
                </div>
              )}
              {!offer.photoUrl && (
                <div className="tl-offer-img-content">
                  {offer.star ? <div className="tl-offer-img-star">{'★'.repeat(offer.star)}</div> : null}
                  <div className="tl-offer-img-place">{offer.resortTown || offer.tourTitle}</div>
                </div>
              )}
            </div>

            <div className="tl-tour-detail-body">
              <h1 className="tl-tour-detail-title">{offer.hotelName}</h1>
              <p className="tl-tour-detail-desc">{description}</p>

              {price && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--tl-green)' }}>
                    {formatPrice(price.amount, price.currency)}
                  </span>
                  {balanceDiscount && balanceDiscount.discountAzn > 0 && (
                    <div className="tl-price-inst">
                      <span>
                        {t('tourCard.labPointDiscount', { discount: formatPrice(balanceDiscount.discountAzn, 'AZN'), final: formatPrice(balanceDiscount.finalAzn, 'AZN') })}
                      </span>
                      <svg className="tl-price-inst-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.5 10.5L8 6L4.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {isMobile() ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tl-btn-book"
                    style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff', padding: '13px 26px' }}
                  >
                    {managerLabel(t)} →
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => openManagerContact(manager)}
                    className="tl-btn-book"
                    style={{ border: 'none', cursor: 'pointer', background: 'var(--tl-green)', color: '#fff', padding: '13px 26px' }}
                  >
                    {managerLabel(t)} →
                  </button>
                )}
                {offer.hotelUrl && (
                  <a
                    href={offer.hotelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tl-btn-book"
                    style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-gray-100)', color: 'var(--tl-navy)', padding: '13px 26px' }}
                  >
                    {t('offerDetail.seeHotel')}
                  </a>
                )}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--tl-gray-400)' }}>
                {t('common.manager')}: {manager.name} — {formatManagerNumber(manager.number)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
