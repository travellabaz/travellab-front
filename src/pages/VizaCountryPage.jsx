import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import Link from '../components/LocalizedLink';
import VizaSection from '../sections/VizaSection';
import FaqSection from '../components/FaqSection';
import Breadcrumb from '../components/Breadcrumb';
import SeoBodyText from '../components/SeoBodyText';
import { getVizaCountryBySlug } from '../data/vizaCountries';

export default function VizaCountryPage() {
  const { t } = useTranslation();
  const { country: slug } = useParams();
  const country = getVizaCountryBySlug(slug);

  if (!country) {
    return (
      <main className="tpwl-main">
        <section className="tl-page-top">
          <div className="tl-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <h1 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 10 }}>
              {t('viza.countryNotFound')}
            </h1>
            <Link to="/viza" className="tl-btn-book" style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff' }}>
              {t('viza.seeAllCountries')}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const countryName = t(`countries.${country.name}`);
  const faq = [
    { q: t('vizaFaq.countryQ1', { country: countryName }), a: t('vizaFaq.countryA1', { country: countryName }) },
    { q: t('vizaFaq.countryQ2', { country: countryName }), a: t('vizaFaq.countryA2', { country: countryName }) },
    { q: t('vizaFaq.countryQ3', { country: countryName }), a: t('vizaFaq.countryA3', { country: countryName }) },
  ];

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section" style={{ paddingBottom: 0 }}>
          <Breadcrumb
            items={[
              { name: t('breadcrumb.home'), to: '/' },
              { name: t('nav.viza'), to: '/viza' },
              { name: t('viza.countryPageBreadcrumb', { country: countryName }) },
            ]}
          />
        </div>
      </section>
      <VizaSection initialCountry={country.name} />
      <FaqSection
        tag={t('toursFaq.tag')}
        title={t('viza.countryPageFaqTitle', { country: countryName })}
        items={faq}
      />
      <section>
        <div className="tl-section">
          <SeoBodyText key={country.name}>
            {faq.map(({ q, a }) => (
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
