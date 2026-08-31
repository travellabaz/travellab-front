import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import SeoBodyText from '../components/SeoBodyText';
import { STATS } from '../config/companyInfo';

const DEMO_POINTS = '2 500';
const DEMO_AZN = '2500';

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const CHECK_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.3 2.3L16 10" />
  </svg>
);

const PLAY_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);

// Reused by both the hero row and this page's own stats band — same icon
// language as AboutSection's STAT_ICONS, sized for this page's layout.
const STAT_ICONS = {
  statCustomers: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c1.2-3.4 3.8-5.2 6.5-5.2s5.3 1.8 6.5 5.2" />
      <circle cx="17" cy="8.5" r="2.4" /><path d="M15.5 15.1c2.2.2 4 1.8 5 4.9" />
    </svg>
  ),
  statDestinations: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  ),
  statPartners: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 12a9 9 0 0 1 10 0" /><path d="M4 15.5 7 12l3 3.5M20 15.5 17 12l-3 3.5" />
    </svg>
  ),
  statYears: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17.3 6.2 21l1.5-6.6L2.5 9.9l6.7-.6L12 3l2.8 6.3 6.7.6-5.2 4.5 1.5 6.6z" />
    </svg>
  ),
};

// Real accounts confirmed by the client — handles/follower counts are not
// placeholders. Avatars are a monogram (no real profile photos supplied
// yet) linking out to the real Instagram profile.
const INFLUENCERS = [
  { handle: 'leyla_land', followers: '127K', color: 'var(--tl-green)' },
  { handle: 'gunnerahim', followers: '181K', color: 'var(--tl-blue)' },
  { handle: 'snigarochka', followers: '95K', color: 'var(--tl-orange)' },
  { handle: 'igoguseinov', followers: '86K', color: 'var(--tl-navy2)' },
  { handle: 'farqaname', followers: '76K', color: 'var(--tl-green-dark)' },
  { handle: 'allyfootball', followers: '64K', color: 'var(--tl-blue-dark)' },
];

// 16:9 stand-in for a spot a real video will go into (see App.jsx's
// AddPhoneModal-style comment pattern) — a play icon + "coming soon"
// caption instead of a broken <video> tag or a stock photo standing in
// for a real person. Once the real clip lands, swap this for
// <video muted autoplay loop playsinline poster="...">.
function VideoPlaceholder({ tint }) {
  const { t } = useTranslation();
  return (
    <div className={`tl-lp-video-placeholder tl-lp-video-placeholder-${tint}`}>
      <span className="tl-lp-video-play">{PLAY_ICON}</span>
      <span className="tl-lp-video-soon">{t('labpoint.videoComingSoon')}</span>
    </div>
  );
}

function BenefitCard({ tag, tagClass, title, accent, accentClass, benefits, btnLabel, videoTint }) {
  return (
    <div className="tl-lp-benefit-card">
      <div className="tl-lp-benefit-text">
        <span className={`tl-tag ${tagClass}`}>{tag}</span>
        <h3 className="tl-lp-benefit-title">
          {title}<br /><span className={accentClass}>{accent}</span>
        </h3>
        <ul className="tl-lp-benefit-list">
          {benefits.map((b) => (
            <li key={b}><span className="tl-lp-benefit-check">{CHECK_ICON}</span>{b}</li>
          ))}
        </ul>
        <span className="tl-lp-benefit-btn">
          {btnLabel} {ARROW}
        </span>
      </div>
      <VideoPlaceholder tint={videoTint} />
    </div>
  );
}

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
                {ARROW}
              </a>
              <a
                href="https://travellab-point.az/"
                target="_blank"
                rel="noopener noreferrer"
                className="tl-lp-btn tl-lp-btn-outline"
              >
                {t('labpoint.moreInfo')}
                {ARROW}
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

        <div className="tl-lp-stats-band">
          {STATS.map((s) => (
            <div className="tl-lp-stats-item" key={s.key}>
              <span className="tl-lp-stats-icon">{STAT_ICONS[s.key]}</span>
              <div>
                <div className="tl-lp-stats-n">{s.n}</div>
                <div className="tl-lp-stats-l">{t(`about.${s.key}`)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="tl-lp-benefit-row">
          <BenefitCard
            tag={t('labpoint.usersTag')}
            tagClass=""
            title={t('labpoint.usersTitle')}
            accent={t('labpoint.usersTitleAccent')}
            accentClass="tl-lp-accent-green"
            benefits={[
              t('labpoint.usersBenefit1'),
              t('labpoint.usersBenefit2'),
              t('labpoint.usersBenefit3'),
              t('labpoint.usersBenefit4'),
            ]}
            btnLabel={t('labpoint.usersBtn')}
            videoTint="green"
          />
          <BenefitCard
            tag={t('labpoint.influencersTag')}
            tagClass="tl-tag-blue"
            title={t('labpoint.influencersTitle')}
            accent={t('labpoint.influencersTitleAccent')}
            accentClass="tl-lp-accent-blue"
            benefits={[
              t('labpoint.influencersBenefit1'),
              t('labpoint.influencersBenefit2'),
              t('labpoint.influencersBenefit3'),
              t('labpoint.influencersBenefit4'),
            ]}
            btnLabel={t('labpoint.influencersBtn')}
            videoTint="blue"
          />
        </div>

        <div className="tl-lp-explainer">
          <div className="tl-lp-explainer-text">
            <h3 className="tl-lp-explainer-title">{t('labpoint.videoTitle')}</h3>
            <p className="tl-lp-explainer-desc">{t('labpoint.videoDesc')}</p>
          </div>
          <VideoPlaceholder tint="explainer" />
        </div>

        <div className="tl-lp-influencers">
          <div className="tl-lp-influencers-head">
            <div className="tl-lp-influencers-title">{t('labpoint.influencersRowTitle')}</div>
            <a href="https://travellab-point.az/" target="_blank" rel="noopener noreferrer" className="tl-lp-influencers-more">
              {t('labpoint.influencersRowMore')} {ARROW}
            </a>
          </div>
          <div className="tl-lp-influencers-row">
            {INFLUENCERS.map((inf) => (
              <a
                key={inf.handle}
                href={`https://instagram.com/${inf.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tl-lp-influencer-item"
              >
                <span className="tl-lp-influencer-avatar" style={{ background: inf.color }}>
                  {inf.handle[0].toUpperCase()}
                </span>
                <span className="tl-lp-influencer-handle">@{inf.handle}</span>
                <span className="tl-lp-influencer-followers">{inf.followers} {t('labpoint.followersSuffix')}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="tl-lp-cta">
          <span className="tl-lp-cta-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7c-1.5 0-4-1-4-3.2S9.5 1 12 3.2C14.5 1 16 2 16 3.8S13.5 7 12 7z" />
            </svg>
          </span>
          <div className="tl-lp-cta-text">{t('labpoint.ctaTitle')}</div>
          <div className="tl-lp-cta-actions">
            <a href="https://travellab-point.az/" target="_blank" rel="noopener noreferrer" className="tl-lp-cta-btn tl-lp-cta-btn-light">
              {t('labpoint.ctaUserBtn')}
            </a>
            <a href="https://travellab-point.az/" target="_blank" rel="noopener noreferrer" className="tl-lp-cta-btn tl-lp-cta-btn-outline">
              {t('labpoint.ctaInfluencerBtn')}
            </a>
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
