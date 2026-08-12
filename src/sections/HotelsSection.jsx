import { useTranslation } from 'react-i18next';

export const HOTELS_URL = 'https://backend.travellab-point.az/site-backend/v1/go/hotels';

// NOTE: RateHawk's White Label site sends X-Frame-Options / CSP
// frame-ancestors headers that block being embedded in an iframe from
// another origin. That can't be worked around from this page, so we link
// out to the White Label site directly instead of iframing it.
// asH1: true when this is the whole content of its own dedicated page
// (HotelsPage.jsx) rather than a teaser embedded on HomePage.jsx — a real
// page needs exactly one <h1>, but HomePage already has its own from
// HeroSearch, so the embedded copy here has to stay an <h2>.
export default function HotelsSection({ asH1 = false }) {
  const { t } = useTranslation();
  const Heading = asH1 ? 'h1' : 'h2';
  return (
    <section id="hotels" className="tl-page-top">
      <div className="tl-section">
        <div className="tl-section-header" style={{ marginBottom: 20 }}>
          <div>
            <div className="tl-tag">{t('hotels.tag')}</div>
            <Heading className="tl-title">{t('hotels.title')}</Heading>
          </div>
          <a href={HOTELS_URL} className="tl-viewall">{t('hotels.openFullScreen')}</a>
        </div>

        <div className="tl-hotel-card">
          <div>
            <div className="tl-lp-logo" style={{ fontSize: 28 }}>{t('hotels.brand')}</div>
            <p className="tl-hotel-desc">{t('hotels.desc')}</p>
            <div className="tl-hotel-feat-row">
              <div className="tl-hotel-feat">{t('hotels.feat1')}</div>
              <div className="tl-hotel-feat">{t('hotels.feat2')}</div>
              <div className="tl-hotel-feat">{t('hotels.feat3')}</div>
            </div>
            <a href={HOTELS_URL} className="tl-outlink tl-outlink-blue">{t('hotels.searchBtn')}</a>
          </div>
          <div className="tl-hotel-visual">
            <div className="tl-hotel-visual-emoji">🏨</div>
            <div className="tl-hotel-visual-title">{t('hotels.visualTitle')}</div>
            <div className="tl-hotel-visual-sub">{t('hotels.visualSub')}</div>
            <div className="tl-hotel-stats">
              <div className="tl-hotel-stat">
                <div className="tl-hotel-stat-n">220+</div>
                <div className="tl-hotel-stat-l">{t('hotels.statCountry')}</div>
              </div>
              <div className="tl-hotel-stat">
                <div className="tl-hotel-stat-n">2.6M+</div>
                <div className="tl-hotel-stat-l">{t('hotels.statHotel')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
