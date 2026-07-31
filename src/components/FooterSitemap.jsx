import { useState } from 'react';
import { Link } from 'react-router-dom';

const REGIONS = {
  Avropa: ['Paris', 'London', 'Berlin', 'Barselona', 'Roma', 'Amsterdam', 'Vyana', 'Praqa', 'Madrid', 'Venesiya', 'Florensiya', 'Budapeşt'],
  Asiya: ['Dubay', 'Banqkok', 'Tokio', 'Seul', 'Bali', 'Sinqapur', 'Kuala-Lumpur', 'Hanoy'],
  Amerika: ['Nyu-York', 'Los-Anceles', 'Toronto', 'Kankun', 'Meksiko', 'Rio-de-Janeyro'],
  Dünya: ['Maldiv adaları', 'Seyşel adaları', 'Zanzibar', 'Mavriki', 'Yeni Zelandiya', 'Avstraliya'],
  Türkiyə: ['İstanbul', 'Antalya', 'Bodrum', 'Kapadokiya', 'İzmir', 'Fethiye'],
  Azərbaycan: ['Bakı', 'Qəbələ', 'Şəki', 'Qusar', 'Naftalan', 'Lənkəran'],
};

// Real-destination footer sitemap, matching the Figma design. All links
// point at the real /tours page (no per-city filtering in the API), same
// honesty pattern as the rest of the site — this is a browse hint, not a
// claim of a dedicated page per city.
export default function FooterSitemap() {
  const [region, setRegion] = useState('Avropa');

  return (
    <div className="tl-footer-sitemap">
      <div className="tl-footer-sitemap-inner">
        <div className="tl-footer-region-tabs">
          {Object.keys(REGIONS).map((r) => (
            <button
              key={r}
              type="button"
              className={'tl-footer-region-tab' + (region === r ? ' active' : '')}
              onClick={() => setRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="tl-footer-city-grid">
          {REGIONS[region].map((city) => (
            <Link key={city} to="/tours">{city} turları</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
