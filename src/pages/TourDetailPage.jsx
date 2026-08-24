import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import { useTours } from '../context/ToursContext';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { isMobile, managerLabel, managerLink, pickManager, formatManagerNumber } from '../utils/managers';
import { extractMinPrice, formatPrice, calcReward, formatPoints, calcBalanceDiscount } from '../utils/price';
import { isTourExpired } from '../utils/tourDate';
import { toTourCartItem } from '../utils/tourCartItem';
import { useCart } from '../context/CartContext';
import Breadcrumb from '../components/Breadcrumb';

export default function TourDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { tours, loading } = useTours();
  const { isAuthenticated, profile } = useAuth();
  const { openManagerContact } = useModals();
  const { addItem } = useCart();
  const [manager, setManager] = useState(pickManager);

  const tour = tours.find((t) => String(t.id) === id);

  useEffect(() => {
    if (tour) setManager(pickManager());
  }, [tour]);

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
            <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', marginBottom: 20 }}>
              {t('tourDetail.notFoundDesc')}
            </p>
            <Link to="/tours" className="tl-btn-book" style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff' }}>
              {t('tourDetail.backToAll')}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const link = managerLink(tour, manager, t);
  const price = extractMinPrice(tour.description);
  const reward = price ? calcReward(price) : null;
  const balanceDiscount = price && isAuthenticated ? calcBalanceDiscount(price, Number(profile.azn) || 0) : null;
  const expired = isTourExpired(tour.description);

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

          <div className="tl-tour-detail">
            <div
              className="tl-tour-detail-img"
              role="img"
              aria-label={tour.title}
              style={{ backgroundImage: tour.imageUrl ? `url('${tour.imageUrl}')` : 'none' }}
            >
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

            <div className="tl-tour-detail-body">
              <h1 className="tl-tour-detail-title">{tour.title}</h1>
              <p className="tl-tour-detail-desc">{tour.description}</p>

              {price && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--tl-green)' }}>
                    {formatPrice(price.amount, price.currency)}
                  </span>
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

              {!expired && (
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
