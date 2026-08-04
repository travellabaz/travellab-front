import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HOTELS_URL } from './HotelsSection';

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
export default function HeroSearch() {
  const [photo, setPhoto] = useState(HERO_PHOTOS[0]);

  useEffect(() => {
    setPhoto(HERO_PHOTOS[Math.floor(Math.random() * HERO_PHOTOS.length)]);
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
          <div className="tl-hero-badge">✈ Azərbaycanın rəsmi travel platforması</div>
          <h1>
            Asanlıqla tap,<br />
            <span className="acc">sürətlə bron et</span>
          </h1>
          <p>Biletlər, otellər, turlar və transferlər — hamısı bir yerdə. Labpoint ilə hər səyahətdən qazanın.</p>
        </div>
        {/* Quick-search-type switcher — pinned to the bottom-left of the
            hero, right above the search form. More get added here as they
            go live (next up: "Yanan Turlar" once that integration lands). */}
        <div className="tl-hero-mode-pills">
          <a href={HOTELS_URL} className="tl-hero-pill tl-hero-pill-accent">Otellər</a>
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
