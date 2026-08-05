import { Link } from 'react-router-dom';
import VizaSection from '../sections/VizaSection';
import FaqSection from '../components/FaqSection';
import { VIZA_FAQ } from '../data/vizaFaq';
import { VIZA_COUNTRIES } from '../data/vizaCountries';

export default function VizaPage() {
  return (
    <main className="tpwl-main">
      <section className="tl-section tl-page-top" style={{ paddingBottom: 0 }}>
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">Ölkələr</div>
            <h2 className="tl-title">Ölkəyə görə viza</h2>
          </div>
        </div>
        <div className="tl-blog-filter">
          {VIZA_COUNTRIES.map((c) => (
            <Link key={c.slug} to={`/viza/${c.slug}`} className="tl-blog-filter-pill">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <VizaSection />

      <FaqSection tag="Suallar" title="Viza ilə bağlı tez-tez verilən suallar" items={VIZA_FAQ} />
    </main>
  );
}
