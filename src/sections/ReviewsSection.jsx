import { useRef } from 'react';
import { REVIEWS } from '../data/reviews';
import { truncate } from '../utils/text';

const SCROLL_STEP = 280;

// Renders nothing until real reviews are actually added to data/reviews.js
// — no placeholder/fake testimonials shipped by default.
export default function ReviewsSection() {
  const gridRef = useRef(null);

  if (REVIEWS.length === 0) return null;

  const scrollBy = (delta) => {
    gridRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section id="reviews" className="tl-section">
      <div className="tl-section-header">
        <div>
          <div className="tl-tag">Rəylər</div>
          <h2 className="tl-title">Turistlərimizin Rəyləri ❤️</h2>
        </div>
      </div>

      <div className="tl-tours-scroller">
        <button type="button" className="tl-tours-arrow tl-tours-arrow-prev" aria-label="Əvvəlki rəylər" onClick={() => scrollBy(-SCROLL_STEP)}>
          ‹
        </button>
        <div className="tl-review-grid" ref={gridRef}>
          {REVIEWS.map((review) => (
            <div className="tl-review-card" key={review.id}>
              <div className="tl-review-head">
                <div className="tl-review-avatar" aria-hidden="true">
                  {review.reviewerName.trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="tl-review-name">{review.reviewerName}</div>
                  <div className="tl-review-stars" aria-label="5 ulduz">★★★★★</div>
                </div>
              </div>
              <p className="tl-review-text">{truncate(review.text, 220)}</p>
            </div>
          ))}
        </div>
        <button type="button" className="tl-tours-arrow tl-tours-arrow-next" aria-label="Növbəti rəylər" onClick={() => scrollBy(SCROLL_STEP)}>
          ›
        </button>
      </div>
    </section>
  );
}
