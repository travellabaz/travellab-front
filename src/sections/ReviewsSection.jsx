import { useEffect, useRef, useState } from 'react';
import { REVIEWS } from '../data/reviews';
import { truncate } from '../utils/text';

const SCROLL_STEP = 280;
const AUTO_SCROLL_SPEED = 0.5; // px per animation frame (~30px/s)
const RESUME_DELAY = 2000; // ms after a manual arrow click before autoplay resumes
const MOBILE_QUERY = '(max-width: 900px)';

function ReviewCard({ review, hidden }) {
  return (
    <div className="tl-review-card" aria-hidden={hidden || undefined}>
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
  );
}

// Renders nothing until real reviews are actually added to data/reviews.js
// — no placeholder/fake testimonials shipped by default.
export default function ReviewsSection() {
  const gridRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mq.matches);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Desktop: auto-scroll the native horizontally-scrollable strip, paused
  // on hover, arrows still work. Mobile has its own pure-CSS marquee below
  // — trying to drive it with the same JS/scrollLeft loop proved unreliable
  // on real phones (touch handling and rAF throttling vary a lot there),
  // so mobile instead reuses the same always-on CSS animation approach
  // already proven to work for the partner-logos strip.
  useEffect(() => {
    if (isMobile) return undefined;
    const el = gridRef.current;
    if (!el || REVIEWS.length === 0) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frameId;
    const step = () => {
      if (!pausedRef.current) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 0) {
          el.scrollLeft = el.scrollLeft >= maxScroll - 1 ? 0 : el.scrollLeft + AUTO_SCROLL_SPEED;
        }
      }
      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);

    const pause = () => { pausedRef.current = true; };
    const resume = () => { pausedRef.current = false; };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);

    return () => {
      cancelAnimationFrame(frameId);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
    };
  }, [isMobile]);

  if (REVIEWS.length === 0) return null;

  const scrollBy = (delta) => {
    pausedRef.current = true;
    gridRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => { pausedRef.current = false; }, RESUME_DELAY);
  };

  if (isMobile) {
    return (
      <section id="reviews" className="tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">Rəylər</div>
            <h2 className="tl-title">Turistlərimizin Rəyləri ❤️</h2>
          </div>
        </div>

        <div className="tl-review-marquee">
          <div className="tl-review-track">
            {REVIEWS.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {REVIEWS.map((review) => (
              <ReviewCard key={`dup-${review.id}`} review={review} hidden />
            ))}
          </div>
        </div>
      </section>
    );
  }

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
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
        <button type="button" className="tl-tours-arrow tl-tours-arrow-next" aria-label="Növbəti rəylər" onClick={() => scrollBy(SCROLL_STEP)}>
          ›
        </button>
      </div>
    </section>
  );
}
