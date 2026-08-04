import { useRef } from 'react';
import { useTours } from '../context/ToursContext';
import { useModals } from '../context/ModalContext';
import TourCard from '../components/TourCard';

// 260px card + 20px gap = one "step" per click, matching the CSS.
const SCROLL_STEP = 280;

export default function ToursSection() {
  const { tours, loading, empty } = useTours();
  const { openTour } = useModals();
  const gridRef = useRef(null);

  const scrollBy = (delta) => {
    gridRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section id="tours" className="tl-page-top">
      <div className="tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">Xüsusi Təkliflər</div>
            <h2 className="tl-title">Turlarımız</h2>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
            Turlar yüklənir...
          </div>
        )}
        {!loading && empty && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
            Hazırda göstəriləcək tur yoxdur.
          </div>
        )}

        {!loading && !empty && (
          <div className="tl-tours-scroller">
            <button type="button" className="tl-tours-arrow tl-tours-arrow-prev" aria-label="Əvvəlki turlar" onClick={() => scrollBy(-SCROLL_STEP)}>
              ‹
            </button>
            <div id="tl-tours-grid" className="tl-pkg-grid" ref={gridRef}>
              {tours.map((tour, idx) => (
                <TourCard key={tour.id ?? idx} tour={tour} onOpen={() => openTour(idx)} />
              ))}
            </div>
            <button type="button" className="tl-tours-arrow tl-tours-arrow-next" aria-label="Növbəti turlar" onClick={() => scrollBy(SCROLL_STEP)}>
              ›
            </button>
          </div>
        )}

        <div className="tl-tours-viewall-row" style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/tours" className="tl-viewall" style={{ fontWeight: 700 }}>Bütün turları gör →</a>
        </div>
      </div>
    </section>
  );
}
