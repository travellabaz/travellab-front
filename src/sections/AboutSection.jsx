import { useTranslation } from 'react-i18next';
import LogoMark from '../components/LogoMark';
import SeoBodyText from '../components/SeoBodyText';

// Same rotating hero photography used across the site (HeroSearch, blog
// covers, OG images) — keeps the About page in the site's own visual
// world instead of unrelated stock photos.
const PHOTOS = [
  { src: '/images/hero/mosque.jpg', rotate: -6 },
  { src: '/images/hero/plane-wing.jpg', rotate: 4 },
  { src: '/images/hero/balloons.jpg', rotate: -3 },
  { src: '/images/hero/aurora.jpg', rotate: 5 },
];

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const SERVICES = [
  {
    key: 'Flights',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    key: 'Viza',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    key: 'Transfer',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 13V7h9v6" />
        <path d="M12 9h4l3 3v4h-7" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    key: 'Hotels',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M9 21v-4h6v4" />
        <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01" />
      </svg>
    ),
  },
  {
    key: 'Cruise',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3v8" />
        <path d="M9 5h6" />
        <path d="M5 11h14l-2 6H7l-2-6z" />
        <path d="M2 20c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" />
      </svg>
    ),
  },
  {
    key: 'Insurance',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const PIN_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const STAT_KEYS = [
  { n: '4+', key: 'statYears' },
  { n: '10K+', key: 'statCustomers' },
  { n: '100+', key: 'statDestinations' },
  { n: '10+', key: 'statTeam' },
];

// The extra stats/services/address block only appears on the standalone
// Haqqımızda page (see body.tl-subpage .tl-about-extra rule); on the
// homepage this section only shows the intro card.
export default function AboutSection() {
  const { t } = useTranslation();

  return (
    <section id="about" className="tl-section-full tl-about-bg tl-page-top">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 32px' }}>
        <div className="tl-tag">{t('about.tag')}</div>
        <h1 className="tl-title" style={{ marginBottom: 24 }}>{t('about.title')}</h1>

        <div className="tl-about-card">
          <LogoMark className="tl-about-logo-mark" />
          <div>
            <div className="tl-about-brand">Travellab</div>
            <p className="tl-about-text" style={{ marginBottom: 0 }}>{t('about.intro')}</p>
            <div className="tl-about-photos">
              {PHOTOS.map((p) => (
                <img
                  key={p.src}
                  className="tl-about-photo"
                  style={{ transform: `rotate(${p.rotate}deg)` }}
                  src={p.src}
                  alt="Travellab"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="tl-about-extra">
          <div className="tl-about-stats">
            {STAT_KEYS.map((s) => (
              <div className="tl-about-stat" key={s.key}>
                <div className="tl-about-stat-n">{s.n}</div>
                <div className="tl-about-stat-l">{t(`about.${s.key}`)}</div>
              </div>
            ))}
          </div>
          <div className="tl-about-services">
            <div className="tl-about-service-title">{t('about.servicesTitle')}</div>
            <div className="tl-about-service-grid">
              {SERVICES.map(({ key, icon }) => (
                <div className="tl-about-service-item" key={key}>
                  <span className="tl-about-service-icon">{icon}</span>
                  <div>
                    <strong>{t(`about.service${key}`)}</strong>
                    <p>{t(`about.service${key}Desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <a
            className="tl-about-address"
            href="https://www.google.com/maps/search/?api=1&query=Travellab+S%C9%99yah%C9%99t+Agentliyi%2C+40+C%C9%99f%C9%99r+Cabbarl%C4%B1+k%C3%BC%C3%A7%C9%99si%2C+Bak%C4%B1"
            target="_blank"
            rel="noopener noreferrer"
          >
            {PIN_ICON} {t('about.address')}
          </a>
          <div className="tl-about-map">
            <iframe
              title="Travellab — Google Maps"
              src="https://www.google.com/maps?q=Travellab+S%C9%99yah%C9%99t+Agentliyi,+40+C%C9%99f%C9%99r+Cabbarl%C4%B1+k%C3%BC%C3%A7%C9%99si,+Bak%C4%B1&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        <SeoBodyText>
          <p>{t('about.seoP1')}</p>
          <p>{t('about.seoP2')}</p>
          <p>{t('about.seoP3')}</p>
        </SeoBodyText>
      </div>
    </section>
  );
}
