import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import Link from '../components/LocalizedLink';
import VizaSection from '../sections/VizaSection';
import VisaGalleryMarquee from '../sections/VisaGalleryMarquee';
import FaqSection from '../components/FaqSection';
import { VIZA_FAQ } from '../data/vizaFaq';
import { VIZA_COUNTRIES, vizaCountrySlug } from '../data/vizaCountries';
import { getLocaleFromPathname } from '../utils/locale';

export default function VizaPage() {
  const { t } = useTranslation();
  const lang = getLocaleFromPathname(useLocation().pathname);
  return (
    <main className="tpwl-main">
      <section className="tl-section tl-page-top" style={{ paddingBottom: 0 }}>
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">{t('viza.pageTag')}</div>
            <h1 className="tl-title">{t('viza.pageTitle')}</h1>
          </div>
        </div>
        <div className="tl-blog-filter">
          {VIZA_COUNTRIES.map((c) => (
            <Link key={c.slug} to={`/viza/${vizaCountrySlug(c, lang)}`} className="tl-blog-filter-pill">
              {t(`countries.${c.name}`)}
            </Link>
          ))}
        </div>
      </section>

      <VizaSection />

      <VisaGalleryMarquee />

      <FaqSection tag={t('toursFaq.tag')} title={t('vizaFaq.title')} items={t('vizaFaq.items', { returnObjects: true })} />
    </main>
  );
}
