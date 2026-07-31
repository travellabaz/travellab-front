import { useRef } from 'react';
import { useTours } from '../context/ToursContext';
import { useModals } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';
import { truncate } from '../utils/text';
import { contactManager, managerLabel } from '../utils/managers';
import { extractMinPrice, formatPrice, calcReward, formatPoints, calcBalanceDiscount } from '../utils/price';

// 260px card + 20px gap = one "step" per click, matching the CSS.
const SCROLL_STEP = 280;

export default function ToursSection() {
  const { tours, loading, empty } = useTours();
  const { openTour } = useModals();
  const { isAuthenticated, profile } = useAuth();
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
              {tours.map((tour, idx) => {
                const price = extractMinPrice(tour.description);
                const reward = price ? calcReward(price) : null;
                const balanceDiscount = price && isAuthenticated ? calcBalanceDiscount(price, Number(profile.azn) || 0) : null;
                return (
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
                  >
                    <div className="tl-pkg-fav" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 13.7C7.8 13.7 7.6 13.63 7.44 13.51C5.87 12.29 4.44 11.06 3.34 9.72C2.1 8.22 1.5 6.82 1.5 5.36C1.5 3.32 3.1 1.75 5.13 1.75C6.29 1.75 7.39 2.29 8 3.15C8.61 2.29 9.71 1.75 10.87 1.75C12.9 1.75 14.5 3.32 14.5 5.36C14.5 6.82 13.9 8.22 12.66 9.72C11.56 11.06 10.13 12.29 8.56 13.51C8.4 13.63 8.2 13.7 8 13.7Z" stroke="#344054" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {reward && (
                      <div className="tl-pkg-ribbon">%</div>
                    )}
                  </div>
                  <div className="tl-pkg-body">
                    <h3 className="tl-pkg-name">{truncate(tour.title, 60)}</h3>
                    <div className="tl-pkg-meta" style={{ display: 'block', color: 'var(--tl-gray-600)', lineHeight: 1.5, marginBottom: 14 }}>
                      {truncate(tour.description, 110)}
                    </div>
                    {reward && (
                      <div style={{ marginBottom: 10 }}>
                        <span className="tl-badge tl-badge-lp">+{formatPoints(reward.points)} Lab Point</span>
                      </div>
                    )}
                    {price && (
                      <div className="tl-pkg-price" style={{ display: 'block' }}>
                        <span className="tl-price-now">{formatPrice(price.amount, price.currency)}-dan</span>
                        {balanceDiscount && balanceDiscount.discountAzn > 0 && (
                          <div className="tl-price-inst">
                            <span>Lab Point ilə: -{formatPrice(balanceDiscount.discountAzn, 'AZN')} → {formatPrice(balanceDiscount.finalAzn, 'AZN')}</span>
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
                );
              })}
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
