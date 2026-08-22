import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { useTours } from '../context/ToursContext';
import TourCard from '../components/TourCard';
import { extractMinPrice, calcBalanceDiscount, formatPrice } from '../utils/price';

// Gated behind login: the whole point of this page is "tour price minus
// your LabPoint balance" (see TourCard's balanceDiscount), which only
// means anything once that balance exists. Logged-out visitors — including
// the prerendered/crawler version of this page — get a registration
// prompt instead of an empty/generic tour list.
export default function EndirimlerPage() {
  const { t } = useTranslation();
  const { isAuthenticated, profile } = useAuth();
  const { openAuth } = useModals();
  const { tours, loading, empty } = useTours();

  if (!isAuthenticated) {
    return (
      <main className="tpwl-main">
        <section className="tl-page-top">
          <div className="tl-section">
            <div className="tl-section-header">
              <div>
                <div className="tl-tag">{t('endirimler.tag')}</div>
                <h1 className="tl-title">{t('endirimler.title')}</h1>
              </div>
            </div>
            <div style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto', padding: '32px 0 48px' }}>
              <p style={{ fontSize: 15, color: 'var(--tl-gray-600)', lineHeight: 1.6, marginBottom: 24 }}>
                {t('endirimler.loginRequiredDesc')}
              </p>
              <button type="button" className="tl-viza-submit" style={{ width: 'auto', padding: '0 32px' }} onClick={() => openAuth('register')}>
                {t('endirimler.loginRequiredCta')}
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const balanceAzn = Number(profile.azn) || 0;
  const discountedTours = tours.filter((tour) => {
    const price = extractMinPrice(tour.description);
    return price && calcBalanceDiscount(price, balanceAzn).discountAzn > 0;
  });

  return (
    <main className="tpwl-main">
      <section id="endirimler" className="tl-page-top">
        <div className="tl-section">
          <div className="tl-section-header">
            <div>
              <div className="tl-tag">{t('endirimler.tag')}</div>
              <h1 className="tl-title">{t('endirimler.title')}</h1>
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', marginBottom: 24 }}>
            {t('endirimler.subtitle', { balance: formatPrice(balanceAzn, 'AZN') })}
          </p>

          {loading && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              {t('toursSection.loading')}
            </div>
          )}
          {!loading && empty && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              {t('toursSection.empty')}
            </div>
          )}
          {!loading && !empty && discountedTours.length === 0 && (
            <p className="tl-blog-empty">{t('endirimler.emptyDesc')}</p>
          )}
          {!loading && discountedTours.length > 0 && (
            <div className="tl-pkg-grid">
              {discountedTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
