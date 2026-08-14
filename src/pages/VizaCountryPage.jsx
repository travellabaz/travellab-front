import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import Link from '../components/LocalizedLink';
import VizaSection from '../sections/VizaSection';
import FaqSection from '../components/FaqSection';
import Breadcrumb from '../components/Breadcrumb';
import SeoBodyText from '../components/SeoBodyText';
import { getVizaCountryBySlug } from '../data/vizaCountries';
import { toAccusative, toGenitive } from '../utils/ruGrammar';

export default function VizaCountryPage() {
  const { t, i18n } = useTranslation();
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
  // Russian declines "in/for <country>" phrases (accusative for "виза в
  // Грецию", genitive for "документы для Греции") — countryName itself
  // stays nominative since it's also used bare elsewhere; see
  // utils/ruGrammar.js for why AZ/EN pass through unchanged.
  const countryNameAcc = toAccusative(countryName, i18n.language);
  const countryNameGen = toGenitive(countryName, i18n.language);
  const faq = [
    { q: t('vizaFaq.countryQ1', { country: countryNameAcc }), a: t('vizaFaq.countryA1', { country: countryNameGen }) },
    { q: t('vizaFaq.countryQ2', { country: countryNameAcc }), a: t('vizaFaq.countryA2', { country: countryNameGen }) },
    { q: t('vizaFaq.countryQ3', { country: countryNameAcc }), a: t('vizaFaq.countryA3', { country: countryNameAcc }) },
  ];

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section" style={{ paddingBottom: 0 }}>
          <Breadcrumb
            items={[
              { name: t('breadcrumb.home'), to: '/' },
              { name: t('nav.viza'), to: '/viza' },
              { name: t('viza.countryPageBreadcrumb', { country: countryNameAcc }) },
            ]}
          />
        </div>
      </section>
      <VizaSection initialCountry={country.name} />
      <FaqSection
        tag={t('toursFaq.tag')}
        title={t('viza.countryPageFaqTitle', { country: countryNameAcc })}
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
