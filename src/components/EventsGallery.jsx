import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { EVENTS, EVENTS_PREVIEW } from '../data/events';

// Extracted from AboutSection (which had this pattern first) once
// KorporativSection needed the same "4-photo preview grid + Daha çox
// lightbox" gallery — same real event photos, same behavior, one place.
function EventsLightbox({ onClose }) {
  const { t } = useTranslation();
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="tl-events-lightbox-overlay" onClick={onClose}>
      <div className="tl-events-lightbox" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tl-events-lightbox-close" onClick={onClose} aria-label={t('about.eventsClose')}>✕</button>
        <div className="tl-events-lightbox-grid">
          {EVENTS.map((ev) => (
            <figure key={ev.src} className="tl-events-lightbox-item">
              <img src={ev.src} alt={ev.caption} loading="lazy" />
              <figcaption>{ev.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function EventsGallery() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="tl-about-events-grid">
        {EVENTS_PREVIEW.map((ev) => (
          <div className="tl-about-event-item" key={ev.src}>
            <img src={ev.src} alt={ev.caption} loading="lazy" />
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <button type="button" className="tl-about-events-more" onClick={() => setOpen(true)}>
          {t('about.eventsMoreBtn')}
        </button>
      </div>
      {open && <EventsLightbox onClose={() => setOpen(false)} />}
    </>
  );
}
