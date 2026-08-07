import { Link, useParams } from 'react-router-dom';
import VizaSection from '../sections/VizaSection';
import FaqSection from '../components/FaqSection';
import Breadcrumb from '../components/Breadcrumb';
import SeoBodyText from '../components/SeoBodyText';
import { getVizaCountryFaq } from '../data/vizaFaq';
import { getVizaCountryBySlug } from '../data/vizaCountries';

export default function VizaCountryPage() {
  const { country: slug } = useParams();
  const country = getVizaCountryBySlug(slug);

  if (!country) {
    return (
      <main className="tpwl-main">
        <section className="tl-page-top">
          <div className="tl-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <h1 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 10 }}>
              Bu ölkə tapılmadı
            </h1>
            <Link to="/viza" className="tl-btn-book" style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff' }}>
              Bütün ölkələrə bax
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section" style={{ paddingBottom: 0 }}>
          <Breadcrumb
            items={[
              { name: 'Ana səhifə', to: '/' },
              { name: 'Viza', to: '/viza' },
              { name: `${country.name} vizası` },
            ]}
          />
        </div>
      </section>
      <VizaSection initialCountry={country.name} />
      <FaqSection
        tag="Suallar"
        title={`${country.name} Vizası Haqqında Nə Bilmək Lazımdır?`}
        items={getVizaCountryFaq(country.name)}
      />
      <section>
        <div className="tl-section">
          <SeoBodyText key={country.name}>
            {getVizaCountryFaq(country.name).map(({ q, a }) => (
              <p key={q}>
                <strong>{q}</strong>
                <br />
                {a}
              </p>
            ))}
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
