import { useState } from 'react';
import { contactManager } from '../utils/managers';

const CATEGORIES = ['Romantik', 'Macəra', 'Ailəvi', 'Qış'];

const IDEAS = [
  { seed: 'tl-idea-cappadocia', cat: 'Romantik', loc: 'Türkiyə', name: 'Kapadokiyada isti hava şarı səhəri', desc: 'Gündoğanda yüzlərlə şarın göydə süzdüyü unudulmaz mənzərə.' },
  { seed: 'tl-idea-santorini', cat: 'Romantik', loc: 'Yunanıstan', name: 'Santorinidə gün batımı', desc: 'Ağ divarlı kəndlər, mavi günbəzlər və Egey dənizinin ən gözəl üfüqü.' },
  { seed: 'tl-idea-swiss', cat: 'Macəra', loc: 'İsveçrə', name: 'Alp dağlarında piyada marşrutu', desc: 'Buzlaqlar və yaşıl vadilər arasında bir neçə günlük trekking marşrutu.' },
  { seed: 'tl-idea-dubai', cat: 'Ailəvi', loc: 'BƏƏ', name: 'Dubayda ailəvi əyləncə həftəsi', desc: 'Park, akvarium və səhra safarisi — hər yaş üçün proqram.' },
  { seed: 'tl-idea-lapland', cat: 'Qış', loc: 'Finlandiya', name: 'Laplandiyada Şimal Şəfəqi', desc: 'Şüşə iqluda gecələmə və pole şansı yüksək Aurora ovu.' },
  { seed: 'tl-idea-georgia', cat: 'Macəra', loc: 'Gürcüstan', name: 'Qafqazın gizli vadiləri', desc: 'Tbilisidən Svanetiyə — dağ kəndləri və yerli mətbəx turu.' },
  { seed: 'tl-idea-maldives', cat: 'Romantik', loc: 'Maldiv adaları', name: 'Su üstü villada bal ayı', desc: 'Fərdi hovuzlu villalar və okean mənzərəli sakit istirahət.' },
  { seed: 'tl-idea-austria', cat: 'Qış', loc: 'Avstriya', name: 'Alp kurortlarında xizək', desc: 'Yeni başlayanlardan peşəkarlara qədər hər səviyyəyə uyğun pistlər.' },
];

// Static, curated inspiration cards — no fake pricing/inventory. The CTA
// hands off to a real human (same manager pool the Tours cards use), same
// pattern as ToursSection's "contact manager" flow.
export default function IdeasSection() {
  const [activeCat, setActiveCat] = useState('Hamısı');

  const filtered = activeCat === 'Hamısı' ? IDEAS : IDEAS.filter((i) => i.cat === activeCat);

  return (
    <section className="tl-ideas-bg">
      <div className="tl-ideas-inner tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">İlham alın</div>
            <h2 className="tl-title tl-title-white">Səyahət ideyalarımız</h2>
          </div>
        </div>
        <div className="tl-idea-cats">
          {['Hamısı', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              className={'tl-icat' + (activeCat === cat ? ' active' : '')}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="tl-idea-grid">
          {filtered.map((idea) => (
            <div className="tl-idea-card" key={idea.seed} onClick={() => contactManager({ title: idea.name })}>
              <div
                className="tl-idea-img"
                role="img"
                aria-label={idea.name}
                style={{
                  backgroundImage: `url('https://picsum.photos/seed/${idea.seed}/400/300')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  fontSize: 0,
                }}
              />
              <div className="tl-idea-body">
                <div className="tl-idea-loc">{idea.loc}</div>
                <div className="tl-idea-name">{idea.name}</div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, margin: 0 }}>{idea.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
