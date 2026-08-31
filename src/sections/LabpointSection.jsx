import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

// Real accounts confirmed by the client, sent one by one (names, exact
// handles, post/reel links). Photos: only Fərqanə's arrived as an actual
// file we could save (public/images/labpoint/influencers/) — the rest
// were pasted inline with no file behind them, so those show a monogram
// instead of a fabricated/mismatched photo. No follower counts shown —
// not confirmed for every person here, so omitted rather than guessed.
const INFLUENCERS = [
  { name: 'Leyla Hüseynova', handle: 'leila_land', color: 'var(--tl-green)' },
  { name: 'Günel Rəhimova', handle: 'gunnerahim', color: 'var(--tl-blue)' },
  { name: 'Nigar Quliyeva', handle: 'snigarochkaa', color: 'var(--tl-orange)' },
  { name: 'İqamətdin Hüseynov', handle: 'igoguseinov', color: 'var(--tl-navy2)' },
  { name: 'Aytən Quluzadə', handle: 'aytaniblog', color: 'var(--tl-green-dark)' },
  { name: 'Ələkbər Quliyev', handle: 'allyfootball', color: 'var(--tl-blue-dark)' },
  { name: 'Fərqanə Məmmədova', handle: 'farqaname', photo: '/images/labpoint/influencers/farqaname.jpg' },
  { name: 'Fidan Seyidli', handle: 'seyidlimakeup', color: 'var(--tl-teal)' },
  { name: 'Fatma Kazımova', handle: 'heyfatya', color: 'var(--tl-hero-orange)' },
];

function VideoLightbox({ src, onClose }) {
  const { t } = useTranslation();
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="tl-lp-video-lightbox-overlay" onClick={onClose}>
      <button type="button" className="tl-lp-video-lightbox-close" onClick={onClose} aria-label={t('about.eventsClose')}>✕</button>
      <video
        className="tl-lp-video-lightbox-player"
        src={src}
        controls
        autoPlay
        playsInline
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}

// Real portrait (9:16) clips the client sent — a silent autoplaying loop
// as the card preview, full video with sound in a lightbox on click. Same
// pattern as GiftCardPage's teaser/full-video split.
function VideoTeaser({ src, poster }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="tl-lp-video-teaser" onClick={() => setOpen(true)}>
        <video src={src} poster={poster} muted autoPlay loop playsInline />
        <span className="tl-lp-video-play">{PLAY_ICON}</span>
      </button>
      {open && <VideoLightbox src={src} onClose={() => setOpen(false)} />}
    </>
  );
}

function BenefitCard({ tag, tagClass, title, accent, accentClass, benefits, btnLabel, videoSrc, videoPoster }) {
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
      <VideoTeaser src={videoSrc} poster={videoPoster} />
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

        {/* Stats band through the CTA banner are the full-page redesign —
            shown only on the dedicated /labpoint page (asH1), not on the
            compact hero embedded on the homepage. */}
        {asH1 && (
        <>
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
            videoSrc="/videos/labpoint/users-teaser.mp4"
            videoPoster="/images/labpoint/users-cover.jpg"
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
            videoSrc="/videos/labpoint/influencers-teaser.mp4"
            videoPoster="/images/labpoint/influencers-cover.jpg"
          />
        </div>

        <div className="tl-lp-explainer">
          <div className="tl-lp-explainer-text">
            <h3 className="tl-lp-explainer-title">{t('labpoint.videoTitle')}</h3>
            <p className="tl-lp-explainer-desc">{t('labpoint.videoDesc')}</p>
          </div>
          <div className="tl-lp-explainer-video">
            <iframe
              src="https://www.youtube.com/embed/BLHWw1KFFRg"
              title={t('labpoint.videoTitle')}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
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
                {inf.photo ? (
                  <img className="tl-lp-influencer-avatar tl-lp-influencer-avatar-photo" src={inf.photo} alt={inf.name} />
                ) : (
                  <span className="tl-lp-influencer-avatar" style={{ background: inf.color }}>
                    {inf.handle[0].toUpperCase()}
                  </span>
                )}
                <span className="tl-lp-influencer-name">{inf.name}</span>
                <span className="tl-lp-influencer-handle">@{inf.handle}</span>
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
            <a href="https://travellab-point.az/influencer" target="_blank" rel="noopener noreferrer" className="tl-lp-cta-btn tl-lp-cta-btn-outline">
              {t('labpoint.ctaInfluencerBtn')}
            </a>
          </div>
        </div>
        </>
        )}

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
