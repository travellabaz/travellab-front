import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

// Bump this as new visas get approved — kept in exactly one place so the
// headline number is easy to find later (see visaGallery.subtitle in each
// locale file, interpolated as {{count}}).
const APPROVED_COUNT = '5000+';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function PlayBadge() {
  return (
    <span className="tl-visa-play-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
    </span>
  );
}

function VisaCard({ item, onOpen }) {
  return (
    <div className="tl-visa-card-wrap">
      <button type="button" className="tl-visa-card" onClick={() => onOpen(item)}>
        <img src={item.media_url} alt={item.country} loading="lazy" />
        {item.type === 'video' && <PlayBadge />}
      </button>
      <span className="tl-visa-card-label" style={{ background: item.country_color }}>
        {item.country}
      </span>
    </div>
  );
}

function MarqueeRow({ items, direction, onOpen }) {
  const [paused, setPaused] = useState(false);
  // Duplicated once so the track can loop from -50% back to 0% with no
  // visible seam — the "seamless" requirement from the brief.
  const doubled = useMemo(() => [...items, ...items], [items]);

  return (
    <div
      className="tl-visa-row-viewport"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className={`tl-visa-track dir-${direction}${paused ? ' paused' : ''}`}>
        {doubled.map((item, i) => (
          <VisaCard key={`${item.id}-${i}`} item={item} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function NavArrow({ direction, onClick }) {
  return (
    <button
      type="button"
      className={`tl-visa-lightbox-nav tl-visa-lightbox-nav-${direction}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={direction === 'prev' ? 'Previous' : 'Next'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {direction === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

function VisaLightbox({ items, index, onIndexChange, onClose }) {
  const touchStart = useRef(null);
  const item = items[index];

  const goNext = () => onIndexChange((index + 1) % items.length);
  const goPrev = () => onIndexChange((index - 1 + items.length) % items.length);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, index, items.length]);

  const { t } = useTranslation();

  return createPortal(
    <div
      className="tl-visa-lightbox-overlay"
      onClick={onClose}
      onTouchStart={(e) => {
        const t0 = e.touches[0];
        touchStart.current = { x: t0.clientX, y: t0.clientY };
      }}
      onTouchEnd={(e) => {
        if (!touchStart.current) return;
        const t1 = e.changedTouches[0];
        const dx = t1.clientX - touchStart.current.x;
        const dy = t1.clientY - touchStart.current.y;
        if (Math.abs(dy) > Math.abs(dx)) {
          if (dy > 80) onClose();
        } else if (Math.abs(dx) > 60) {
          if (dx < 0) goNext();
          else goPrev();
        }
        touchStart.current = null;
      }}
    >
      <button type="button" className="tl-visa-lightbox-close" onClick={onClose} aria-label={t('visaGallery.close')}>
        ✕
      </button>

      <NavArrow direction="prev" onClick={goPrev} />
      <NavArrow direction="next" onClick={goNext} />

      {item.type === 'video' ? (
        <video
          key={item.id}
          className="tl-visa-lightbox-media"
          src={item.media_url}
          controls
          autoPlay
          playsInline
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          key={item.id}
          className="tl-visa-lightbox-media"
          src={item.media_url}
          alt={item.country}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>,
    document.body
  );
}

export default function VisaGalleryMarquee() {
  const { t } = useTranslation();
  const [items, setItems] = useState(null); // null = not fetched yet
  const [inView, setInView] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const sectionRef = useRef(null);

  const openLightbox = (item) => {
    const idx = items.findIndex((i) => i.id === item.id);
    setLightboxIndex(idx === -1 ? 0 : idx);
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || items !== null) return;
    let cancelled = false;
    fetch('/content/visa_gallery.json')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.visa_gallery || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [inView, items]);

  const rows = useMemo(() => {
    if (!items || items.length === 0) return null;
    const shuffled = shuffle(items);
    const mid = Math.ceil(shuffled.length / 2);
    return [shuffled.slice(0, mid), shuffled.slice(mid)];
  }, [items]);

  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  return (
    <section ref={sectionRef} className="tl-visa-gallery-section">
      {rows && (
        <>
          <div className="tl-section tl-visa-gallery-header">
            <h2 className="tl-title">{t('visaGallery.title')}</h2>
            <p className="tl-visa-gallery-subtitle">{t('visaGallery.subtitle', { count: APPROVED_COUNT })}</p>
          </div>

          {prefersReducedMotion ? (
            <div className="tl-section">
              <div className="tl-visa-static-grid">
                {items.map((item) => (
                  <VisaCard key={item.id} item={item} onOpen={openLightbox} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <MarqueeRow items={rows[0]} direction="ltr" onOpen={openLightbox} />
              <MarqueeRow items={rows[1]} direction="rtl" onOpen={openLightbox} />
            </>
          )}
        </>
      )}

      {lightboxIndex !== null && (
        <VisaLightbox
          items={items}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}
