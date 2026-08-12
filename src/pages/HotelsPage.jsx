import { useTranslation } from 'react-i18next';
import HotelsSection from '../sections/HotelsSection';
import SeoBodyText from '../components/SeoBodyText';

export default function HotelsPage() {
  const { t } = useTranslation();
  return (
    <main className="tpwl-main">
      <HotelsSection asH1 />

      <section>
        <div className="tl-section">
          <SeoBodyText>
            <p>{t('hotels.seoP1')}</p>
            <p>{t('hotels.seoP2')}</p>
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
