import { useState } from 'react';

const HERO_PHOTOS = [
  { src: '/images/hero/aurora.jpg', alt: 'Şimal işıqları — dağlar üzərində gecə göyü' },
  { src: '/images/hero/balloons.jpg', alt: 'Kapadokyada isti hava şarları' },
  { src: '/images/hero/plane-wing.jpg', alt: 'Təyyarə pəncərəsindən gün batımı mənzərəsi' },
  { src: '/images/hero/mosque.jpg', alt: 'İstanbulda məscid və Boğaz — axşam mənzərəsi' },
];

// Picking the photo with useState's initializer (instead of useEffect)
// keeps the original's "changes on every visit" behaviour, since it only
// needs to run once per mount, not react to anything.
export default function HeroSearch() {
  const [photo] = useState(() => HERO_PHOTOS[Math.floor(Math.random() * HERO_PHOTOS.length)]);

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
