import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTours } from '../context/ToursContext';
import TourCard from '../components/TourCard';
import Link from '../components/LocalizedLink';

// 260px card + 20px gap = one "step" per click, matching the CSS.
const SCROLL_STEP = 280;

export default function ToursSection() {
  const { t } = useTranslation();
  const { tours, loading, empty } = useTours();
  const gridRef = useRef(null);

  const scrollBy = (delta) => {
    gridRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section id="tours" className="tl-page-top">
      <div className="tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">{t('toursSection.tag')}</div>
            <h2 className="tl-title">{t('toursSection.title')}</h2>
          </div>
        </div>

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

        {!loading && !empty && (
          <div className="tl-tours-scroller">
            <button type="button" className="tl-tours-arrow tl-tours-arrow-prev" aria-label={t('toursSection.prev')} onClick={() => scrollBy(-SCROLL_STEP)}>
              ‹
            </button>
            <div id="tl-tours-grid" className="tl-pkg-grid" ref={gridRef}>
              {tours.map((tour, idx) => (
                <TourCard key={tour.id ?? idx} tour={tour} />
              ))}
            </div>
            <button type="button" className="tl-tours-arrow tl-tours-arrow-next" aria-label={t('toursSection.next')} onClick={() => scrollBy(SCROLL_STEP)}>
              ›
            </button>
          </div>
        )}

        <div className="tl-tours-viewall-row" style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/tours" className="tl-viewall" style={{ fontWeight: 700 }}>{t('toursSection.viewAll')}</Link>
        </div>
      </div>
    </section>
  );
}
