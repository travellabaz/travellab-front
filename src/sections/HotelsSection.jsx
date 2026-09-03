import { useTranslation } from 'react-i18next';

export const HOTELS_URL = 'https://backend.travellab-point.az/site-backend/v1/go/hotels';

const FEAT_ICONS = {
  globe: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  ),
  bolt: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  percent: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18 18 6" /><circle cx="7.5" cy="7.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" />
    </svg>
  ),
};

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
            <div className="tl-tag">{t('hotels.tag')} <span className="tl-tag-dash">—</span></div>
            <Heading className="tl-title">
              {t('hotels.brand')} —<br /><span className="tl-hotel-title-accent">{t('hotels.titleAccent')}</span>
            </Heading>
          </div>
          <a href={HOTELS_URL} className="tl-viewall">{t('hotels.openFullScreen')}</a>
        </div>

        <div className="tl-hotel-card">
          <div>
            <p className="tl-hotel-desc">{t('hotels.desc')}</p>

            <div className="tl-hotel-feat-row">
              <div className="tl-hotel-feat-item">
                <span className="tl-hotel-feat-icon">{FEAT_ICONS.globe}</span>
                <div>
                  <div className="tl-hotel-feat-n">2.6M+</div>
                  <div className="tl-hotel-feat-l">{t('hotels.statHotelSelection')}</div>
                </div>
              </div>
              <div className="tl-hotel-feat-item">
                <span className="tl-hotel-feat-icon">{FEAT_ICONS.bolt}</span>
                <div>
                  <div className="tl-hotel-feat-n">{t('hotels.feat2N')}</div>
                  <div className="tl-hotel-feat-l">{t('hotels.feat2L')}</div>
                </div>
              </div>
              <div className="tl-hotel-feat-item">
                <span className="tl-hotel-feat-icon">{FEAT_ICONS.lock}</span>
                <div>
                  <div className="tl-hotel-feat-n">{t('hotels.feat3N')}</div>
                  <div className="tl-hotel-feat-l">{t('hotels.feat3L')}</div>
                </div>
              </div>
            </div>

            <div className="tl-hotel-cta-row">
              <a href={HOTELS_URL} className="tl-outlink tl-outlink-green">{t('hotels.searchBtn')}</a>
            </div>
          </div>

          {/* Placeholder photo from the site's existing hero rotation —
              swap for a real hotel/resort shot once one is sent. */}
          <div className="tl-hotel-collage">
            <img className="tl-hotel-collage-photo" src="/images/hero/plane-wing.jpg" alt="" />

            <div className="tl-hotel-badge-reach">
              <span className="tl-hotel-badge-reach-icon" aria-hidden="true">{FEAT_ICONS.globe}</span>
              <div>
                <div className="tl-hotel-badge-reach-l">{t('hotels.reachLabel')}</div>
                <div className="tl-hotel-badge-reach-n">220+</div>
                <div className="tl-hotel-badge-reach-l2">{t('hotels.statCountry')}</div>
              </div>
            </div>

            <div className="tl-hotel-badge-brand">
              <div className="tl-hotel-badge-brand-title">{t('hotels.visualTitle')}</div>
              <div className="tl-hotel-badge-brand-n">2.6M+</div>
              <div className="tl-hotel-badge-brand-l">{t('hotels.statHotelSelection')}</div>
            </div>

            <div className="tl-hotel-badge-price">
              <div className="tl-hotel-badge-price-head">
                <span>{t('hotels.bestPricesTitle')}</span>
                <span className="tl-hotel-badge-price-icon">%</span>
              </div>
              <p>{t('hotels.bestPricesDesc')}</p>
            </div>
          </div>
        </div>

        <div className="tl-hotel-features-grid">
          <div className="tl-hotel-features-card">
            <span className="tl-hotel-features-icon">{FEAT_ICONS.globe}</span>
            <div className="tl-hotel-features-title">{t('hotels.featCard1Title')}</div>
          </div>
          <div className="tl-hotel-features-card">
            <span className="tl-hotel-features-icon">{FEAT_ICONS.bolt}</span>
            <div className="tl-hotel-features-title">{t('hotels.featCard2Title')}</div>
          </div>
          <div className="tl-hotel-features-card">
            <span className="tl-hotel-features-icon">{FEAT_ICONS.lock}</span>
            <div className="tl-hotel-features-title">{t('hotels.featCard3Title')}</div>
          </div>
          <div className="tl-hotel-features-card">
            <span className="tl-hotel-features-icon">{FEAT_ICONS.percent}</span>
            <div className="tl-hotel-features-title">{t('hotels.featCard4Title')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
