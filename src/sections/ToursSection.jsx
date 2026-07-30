import { useRef } from 'react';
import { useTours } from '../context/ToursContext';
import { useModals } from '../context/ModalContext';
import { truncate } from '../utils/text';
import { contactManager, managerLabel } from '../utils/managers';

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
                <div className="tl-pkg-card" key={tour.id ?? idx}>
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
                  />
                  <div className="tl-pkg-body">
                    <h3 className="tl-pkg-name">{truncate(tour.title, 60)}</h3>
                    <div className="tl-pkg-meta" style={{ display: 'block', color: 'var(--tl-gray-600)', lineHeight: 1.5, marginBottom: 14 }}>
                      {truncate(tour.description, 110)}
                    </div>
                    <div className="tl-pkg-actions">
                      <button
                        type="button"
                        className="tl-btn-book"
                        style={{ border: 'none', cursor: 'pointer', background: 'var(--tl-gray-100)', color: 'var(--tl-navy)' }}
                        onClick={() => openTour(idx)}
                      >
                        Ətraflı
                      </button>
                      <button type="button" className="tl-btn-book" style={{ border: 'none', cursor: 'pointer' }} onClick={() => contactManager(tour)}>
                        {managerLabel()}
                      </button>
                    </div>
                  </div>
                </div>
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
