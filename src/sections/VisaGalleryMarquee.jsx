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

function VisaLightbox({ item, onClose }) {
  const touchStartY = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const { t } = useTranslation();

  return createPortal(
    <div
      className="tl-visa-lightbox-overlay"
      onClick={onClose}
      onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
      onTouchEnd={(e) => {
        if (touchStartY.current == null) return;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        if (dy > 80) onClose();
        touchStartY.current = null;
      }}
    >
      <button type="button" className="tl-visa-lightbox-close" onClick={onClose} aria-label={t('visaGallery.close')}>
        ✕
      </button>
      {item.type === 'video' ? (
        <video
          className="tl-visa-lightbox-media"
          src={item.media_url}
          controls
          autoPlay
          playsInline
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
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
  const [lightboxItem, setLightboxItem] = useState(null);
  const sectionRef = useRef(null);

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
                  <VisaCard key={item.id} item={item} onOpen={setLightboxItem} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <MarqueeRow items={rows[0]} direction="ltr" onOpen={setLightboxItem} />
              <MarqueeRow items={rows[1]} direction="rtl" onOpen={setLightboxItem} />
            </>
          )}
        </>
      )}

      {lightboxItem && <VisaLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />}
    </section>
  );
}
