import { useTranslation } from 'react-i18next';
import KorporativSection from '../sections/KorporativSection';
import SeoBodyText from '../components/SeoBodyText';

export default function KorporativPage() {
  const { t } = useTranslation();
  return (
    <main className="tpwl-main">
      <KorporativSection />

      <section>
        <div className="tl-section">
          <SeoBodyText>
            <p>{t('korporativ.seoText')}</p>
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
