import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import SeoBodyText from '../components/SeoBodyText';

const DEMO_POINTS = '2 500';
const DEMO_AZN = '2500';

// asH1: true when this is the whole content of its own dedicated page
// (LabpointPage.jsx) — same pattern as HotelsSection/EventsSection, since
// this section is also embedded on HomePage, which already has its own H1.
export default function LabpointSection({ asH1 = false }) {
  const { t } = useTranslation();
  const { isAuthenticated, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const Heading = asH1 ? 'h1' : 'h2';

  const points = isAuthenticated ? Number(profile.points || 0).toLocaleString('en-US').replace(/,/g, ' ') : DEMO_POINTS;
  const azn = isAuthenticated ? profile.azn : DEMO_AZN;
  const shareUrl = (isAuthenticated && profile.referralLink) || 'https://travellab-point.az/';

  const share = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="labpoint" className="tl-page-top">
      <div className="tl-section">
        <div className="tl-lp-card">
          <div>
            <div className="tl-lp-logo">{t('labpoint.brand')}</div>
            <Heading className="tl-lp-headline">{t('labpoint.title')}</Heading>
            <p className="tl-lp-desc">{t('labpoint.desc')}</p>
            <div className="tl-lp-actions">
              <a
                href="https://travellab-point.az/"
                target="_blank"
                rel="noopener noreferrer"
                className="tl-lp-btn tl-lp-btn-primary"
              >
                {t('labpoint.createCard')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </a>
              <a
                href="https://travellab-point.az/"
                target="_blank"
                rel="noopener noreferrer"
                className="tl-lp-btn tl-lp-btn-outline"
              >
                {t('labpoint.moreInfo')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </div>

          <div className="tl-lp-visual">
            <div className="tl-lp-glow tl-lp-glow-blue" />
            <div className="tl-lp-glow tl-lp-glow-green" />
            <div className="tl-lp-cardvis">
              <div className="tl-lp-cv-head">
                <div className="tl-lp-cv-brand">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 2h6M10 2v6.2L5.4 17a2 2 0 0 0 1.8 3h9.6a2 2 0 0 0 1.8-3L14 8.2V2" />
                    <path d="M7.5 14h9" />
                  </svg>
                  LabPoint<sup>™</sup>
                </div>
                <button type="button" className="tl-lp-cv-share" onClick={share}>
                  {copied ? t('labpoint.copied') : t('labpoint.share')}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M8 7h9v9" />
                  </svg>
                </button>
              </div>
              <div className="tl-lp-cv-bal-l">{t('labpoint.balance')}</div>
              <div className="tl-lp-cv-bal">
                {points} <span>LP</span>
              </div>
              <div className="tl-lp-cv-azn">≈ {azn} ₼</div>
            </div>
          </div>
        </div>

        {asH1 && (
          <SeoBodyText>
            <p>{t('labpoint.seoP1')}</p>
            <p>{t('labpoint.seoP2')}</p>
          </SeoBodyText>
        )}
      </div>
    </section>
  );
}
