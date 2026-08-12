import { useTranslation } from 'react-i18next';
import PartnersLogos from './PartnersLogos';

export default function PartnersSection() {
  const { t } = useTranslation();
  return (
    <section>
      <div className="tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">{t('partners.tag')}</div>
            <h2 className="tl-title">{t('partners.title')}</h2>
          </div>
        </div>
        <div className="tl-partners-row">
          {/* Duplicated for a seamless CSS loop — the copy is decorative,
              the real one right before it is what screen readers get. */}
          <div className="tl-partners-track">
            <PartnersLogos />
            <PartnersLogos aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
