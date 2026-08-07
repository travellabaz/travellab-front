import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HOTELS_URL } from './HotelsSection';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';

const PILLS_SCROLL_SPEED = 0.6; // px per animation frame
const PILLS_END_PAUSE_MS = 900; // pause once fully revealed, before scrolling back

const HERO_PHOTOS = [
  { src: '/images/hero/aurora.jpg', alt: 'Şimal işıqları — dağlar üzərində gecə göyü' },
  { src: '/images/hero/balloons.jpg', alt: 'Kapadokyada isti hava şarları' },
  { src: '/images/hero/plane-wing.jpg', alt: 'Təyyarə pəncərəsindən gün batımı mənzərəsi' },
  { src: '/images/hero/mosque.jpg', alt: 'İstanbulda məscid və Boğaz — axşam mənzərəsi' },
];

// This page is prerendered at build time (see prerender.mjs) and then
// hydrated — a useState initializer runs during that one build-time
// render and gets baked into the static HTML, so every visitor would
// see whichever photo Math.random() happened to pick at build time.
// Picking it client-side in an effect (after hydration) instead keeps
// the original "changes on every visit" behaviour for real visitors;
// prerendered/JS-less crawlers just get the first photo as a fallback.
// title: JSX for the <h1> — defaults to the homepage's own copy. HeroSearch
// stays a single persistent instance across routes (see App.jsx for why),
// so per-route H1 text has to come in as a prop rather than the component
// being remounted with different content.
export default function HeroSearch({
  title = (
    <>
      Səyahət Agentliyi Travellab —<br />
      <span className="acc">Aviabilet, Otel və Tur Bir Yerdə</span>
    </>
  ),
}) {
  const [photo, setPhoto] = useState(HERO_PHOTOS[0]);
  const { isAuthenticated } = useAuth();
  const { openAuth } = useModals();
  const pillsRef = useRef(null);

  useEffect(() => {
    setPhoto(HERO_PHOTOS[Math.floor(Math.random() * HERO_PHOTOS.length)]);
  }, []);

  // Mobile-only nudge: the pills row overflows there (see the
  // max-width: 900px rules in global.css). One-shot, not a loop: scrolls
  // all the way to the end to reveal every pill, pauses, then scrolls
  // all the way back to 0 — not to some in-between "peek" position, since
  // anything short of 0 risks partially scrolling Otellər (the first
  // pill) out of view. Resting at 0 already shows as much of the last
  // pill as naturally fits in the remaining width once Otellər and its
  // neighbors are fully in view — nothing if there's no room, however
  // much fits otherwise — without needing a hardcoded peek amount.
  // Stops for good the moment someone actually touches or scrolls it
  // themselves, since it's real navigation, not decoration.
  useEffect(() => {
    const el = pillsRef.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frameId;
    let stopped = false;
    let phase = 'forward'; // 'forward' -> 'pause' -> 'backward' -> 'done'
    let pauseUntil = 0;
    // Tracked ourselves rather than read back from el.scrollLeft — on iOS
    // Safari a scrollTo() write doesn't necessarily show up on the very
    // next read, which would throw this loop's phase logic off.
    let position = el.scrollLeft;

    const step = (timestamp) => {
      if (stopped) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 2) {
        if (phase === 'forward') {
          position = Math.min(maxScroll, position + PILLS_SCROLL_SPEED);
          el.scrollTo({ left: position, behavior: 'auto' });
          if (position >= maxScroll - 0.5) {
            phase = 'pause';
            pauseUntil = timestamp + PILLS_END_PAUSE_MS;
          }
        } else if (phase === 'pause') {
          if (timestamp >= pauseUntil) phase = 'backward';
        } else if (phase === 'backward') {
          position = Math.max(0, position - PILLS_SCROLL_SPEED);
          el.scrollTo({ left: position, behavior: 'auto' });
          if (position <= 0.5) phase = 'done';
        }
      }
      if (phase !== 'done') frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);

    const stop = () => { stopped = true; cancelAnimationFrame(frameId); };
    el.addEventListener('touchstart', stop, { passive: true });
    el.addEventListener('mousedown', stop);
    el.addEventListener('wheel', stop, { passive: true });

    return () => {
      stopped = true;
      cancelAnimationFrame(frameId);
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('mousedown', stop);
      el.removeEventListener('wheel', stop);
    };
  }, []);

  return (
    <>
      <section className="tl-hero">
        <div
          className="tl-hero-photo"
          role="img"
          aria-label={photo.alt}
          style={{ backgroundImage: `url('${photo.src}')` }}
        />
        <div className="tl-hero-bg" />
        <div className="tl-hero-grid" />
        <div className="tl-float tl-float-1">
          🎫 GYD → IST <strong style={{ color: '#1DB47A' }}>$89-dan</strong>
        </div>
        <div className="tl-float tl-float-2">Hər tur alışında +10% Labpoint</div>
        <div className="tl-hero-content">
          <div className="tl-hero-badge">✈ Azərbaycanın etibarlı səyahət agentliyi</div>
          <h1>{title}</h1>
          <p>Biletlər, otellər, turlar və transferlər — hamısı bir yerdə. Labpoint ilə hər səyahətdən qazanın.</p>
        </div>
        {/* Quick-search-type switcher — pinned to the bottom-left of the
            hero, right above the search form. More get added here as they
            go live (next up: "Yanan Turlar" once that integration lands). */}
        <div className="tl-hero-mode-pills" ref={pillsRef}>
          <a href={HOTELS_URL} className="tl-hero-pill tl-hero-pill-accent">Otellər</a>
          {/* Signup bait: only shown to visitors who aren't logged in yet —
              disappears the moment they are, since the point is to nudge
              them toward registering, not to advertise a real discounts
              page. */}
          {!isAuthenticated && (
            <button type="button" className="tl-hero-pill tl-hero-pill-deal" onClick={() => openAuth('register')}>
              Endirimlər 🔥
            </button>
          )}
          <Link to="/tours" className="tl-hero-pill">Turlar</Link>
          <Link to="/tours?category=Qrup%20Turlar%C4%B1" className="tl-hero-pill">Qrup Turlar</Link>
        </div>
      </section>

      {/* ── FLIGHT SEARCH FORM (sticky) ──
          Filled by the Travelpayouts embed script wired into index.html —
          it renders its own UI into these two divs by id. */}
      <header className="tpwl-search-header" id="search">
        <div className="tpwl-search__wrapper">
          <div className="tpwl__content">
            <div id="tpwl-search" />
          </div>
        </div>
      </header>

      <div className="tpwl-tickets__wrapper">
        <div className="tpwl__content">
          <div id="tpwl-tickets" />
        </div>
      </div>
    </>
  );
}
