import { Link, useParams } from 'react-router-dom';
import TourSearchPage from './TourSearchPage';
import { getTourSearchCountryBySlug } from '../data/tourSearchCountries';

export default function TourSearchCountryPage() {
  const { country: slug } = useParams();
  const country = getTourSearchCountryBySlug(slug);

  if (!country) {
    return (
      <main className="tpwl-main">
        <section className="tl-page-top">
          <div className="tl-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <h1 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 10 }}>
              Bu istiqamət tapılmadı
            </h1>
            <Link to="/tours/search" className="tl-btn-book" style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff' }}>
              Bütün istiqamətlərə bax
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <TourSearchPage initialCountryName={country.nameRu} countryLabel={country.nameAz} />;
}
