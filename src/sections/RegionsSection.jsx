import { Link } from 'react-router-dom';

const REGIONS = [
  { seed: 'tl-region-namerica', name: 'Şimali Amerika', sub: 'ABŞ, Kanada' },
  { seed: 'tl-region-europe', name: 'Avropa', sub: 'İtaliya, Fransa, İspaniya' },
  { seed: 'tl-region-balkans', name: 'Balkanlar', sub: 'Xorvatiya, Serbiya' },
  { seed: 'tl-region-baltics', name: 'Baltikyanı', sub: 'Latviya, Litva, Estoniya' },
  { seed: 'tl-region-asia', name: 'Asiya', sub: 'Tayland, Yaponiya, BƏƏ' },
  { seed: 'tl-region-oceania', name: 'Okeaniya', sub: 'Avstraliya, Yeni Zelandiya' },
];

// Static region tiles — link into the real Tours page (no fake per-region
// filtering, since the Tours API doesn't expose that).
export default function RegionsSection() {
  return (
    <section>
      <div className="tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">Dünya üzrə</div>
            <h2 className="tl-title">Bölgələrə görə</h2>
          </div>
        </div>
        <div className="tl-regions-grid">
          {REGIONS.map((region) => (
            <Link to="/tours" className="tl-region" key={region.seed}>
              <div
                className="tl-region-photo"
                style={{ backgroundImage: `url('https://picsum.photos/seed/${region.seed}/300/200')` }}
              >
                <div className="tl-region-label">
                  {region.name}
                  <small>{region.sub}</small>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
