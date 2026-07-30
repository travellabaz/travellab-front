import { useState } from 'react';

const HERO_SEEDS = ['tl-asia', 'tl-europe', 'tl-namerica', 'tl-oceania', 'tl-baltics', 'tl-balkans'];

// Picking the seed with useState's initializer (instead of useEffect)
// keeps the original's "changes on every visit" behaviour, since it only
// needs to run once per mount, not react to anything.
export default function HeroSearch() {
  const [seed] = useState(() => HERO_SEEDS[Math.floor(Math.random() * HERO_SEEDS.length)]);

  return (
    <>
      <section className="tl-hero">
        <div
          className="tl-hero-photo"
          role="img"
          aria-label="Dağ gölü və dumanlı mənzərə — səyahət ovqatı"
          style={{ backgroundImage: `url('https://picsum.photos/seed/${seed}/1800/700')` }}
        />
        <div className="tl-hero-bg" />
        <div className="tl-hero-grid" />
        <div className="tl-float tl-float-1">
          🎫 GYD → IST <strong style={{ color: '#1DB47A' }}>$89-dan</strong>
        </div>
        <div className="tl-float tl-float-2">⭐ Hər sifarişdə +50 Labpoint</div>
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
