import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';

export default function CtaSection() {
  const { t } = useTranslation();
  return (
    <div className="tl-cta-wrap">
      <div className="tl-cta">
        <div className="tl-cta-text">
          <h2>{t('cta.title')}</h2>
          <p>{t('cta.desc')}</p>
          <div className="tl-cta-tags">
            <span className="tl-cta-tag">{t('cta.tag1')}</span>
            <span className="tl-cta-tag">{t('cta.tag2')}</span>
            <span className="tl-cta-tag">{t('cta.tag3')}</span>
          </div>
        </div>
        <Link to="/tours" className="tl-cta-btn">{t('cta.btn')}</Link>
      </div>
    </div>
  );
}
