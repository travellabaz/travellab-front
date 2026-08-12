import { useTranslation } from 'react-i18next';
import SeoBodyText from '../components/SeoBodyText';

// HeroSearch (hero + Travelpayouts search widget) is mounted persistently
// in App.jsx and already covers the actual search UI — this page just adds
// the SEO body copy below it (see App.jsx for how its <h1> text still
// varies per route despite the component itself staying mounted).
export default function SearchPage() {
  const { t } = useTranslation();
  return (
    <main className="tpwl-main">
      <section>
        <div className="tl-section">
          <SeoBodyText>
            <p>{t('searchPage.seoP1')}</p>
            <p>{t('searchPage.seoP2')}</p>
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
