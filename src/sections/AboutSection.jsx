import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import LogoMark from '../components/LogoMark';
import SeoBodyText from '../components/SeoBodyText';

// Real site photography (same rotating set HeroSearch/blog covers/OG
// images use), not unrelated stock — the hero banner needed one full-
// bleed background photo, this is the moodiest/most "journey" one of
// the four.
const HERO_IMAGE = '/images/hero/aurora.jpg';

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

// Every one of these links to a real page/feature that already exists —
// no fabricated services (e.g. the old "Cruise" slot got dropped: there's
// no standalone cruise product on this site to point it at).
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
    key: 'Tours',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4l3 2" />
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
    key: 'Insurance',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'Shop',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    key: 'Labpoint',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="8" r="6" />
        <path d="M9 14l-2 7 5-3 5 3-2-7" />
      </svg>
    ),
  },
];

const BADGE_ICONS = {
  trust: (
    <svg {...ICON_PROPS} width={16} height={16}>
      <path d="M12 2l7 4v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  professional: (
    <svg {...ICON_PROPS} width={16} height={16}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  customer: (
    <svg {...ICON_PROPS} width={16} height={16}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
  quality: (
    <svg {...ICON_PROPS} width={16} height={16}>
      <path d="M12 17.3 6.2 21l1.5-6.6L2.5 9.9l6.7-.6L12 3l2.8 6.3 6.7.6-5.2 4.5 1.5 6.6z" />
    </svg>
  ),
};
const BADGE_KEYS = ['trust', 'professional', 'customer', 'quality'];

const STAT_KEYS = [
  { n: '4+', key: 'statYears' },
  { n: '10K+', key: 'statCustomers' },
  { n: '100+', key: 'statDestinations' },
  { n: '10+', key: 'statTeam' },
];

const PIN_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function AboutSection() {
  const { t } = useTranslation();

  return (
    <>
      <section className="tl-about-hero tl-page-top" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
        <div className="tl-about-hero-inner">
          <h1 className="tl-title">{t('about.title')}</h1>
          <p className="tl-about-hero-tagline">{t('about.heroTagline')}</p>
        </div>
      </section>

      <section className="tl-about-stats-band">
        <div className="tl-section">
          <div className="tl-about-stats-row">
            {STAT_KEYS.map((s) => (
              <div key={s.key}>
                <div className="tl-about-stat-n">{s.n}</div>
                <div className="tl-about-stat-l">{t(`about.${s.key}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="tl-section">
          <div className="tl-about-card">
            <LogoMark className="tl-about-logo-mark" />
            <div>
              <div className="tl-tag">{t('about.tag')}</div>
              <div className="tl-about-brand">{t('about.whoTitle')}</div>
              <p className="tl-about-text" style={{ marginBottom: 0 }}>{t('about.intro')}</p>
              <div className="tl-about-badges">
                {BADGE_KEYS.map((key) => (
                  <span className="tl-about-badge" key={key}>
                    {BADGE_ICONS[key]}
                    {t(`about.badge${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
                  </span>
                ))}
              </div>
            </div>
          </div>

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

          <div className="tl-about-promo-row">
            <Link to="/shop" className="tl-shop-promo-card tl-shop-promo-green">
              <span className="tl-shop-promo-kicker">{t('about.promoShopKicker')}</span>
              <span className="tl-shop-promo-category">Travellab Shop</span>
              <span className="tl-shop-promo-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </span>
            </Link>
            <Link to="/labpoint" className="tl-shop-promo-card tl-shop-promo-orange">
              <span className="tl-shop-promo-kicker">{t('about.promoLabpointKicker')}</span>
              <span className="tl-shop-promo-category">Labpoint</span>
              <span className="tl-shop-promo-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </span>
            </Link>
            <Link to="/events" className="tl-shop-promo-card tl-shop-promo-blue">
              <span className="tl-shop-promo-kicker">{t('about.promoEventsKicker')}</span>
              <span className="tl-shop-promo-category">{t('nav.events')}</span>
              <span className="tl-shop-promo-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </span>
            </Link>
          </div>

          {/* Only ATAA — the only membership already stated elsewhere on
              the site (see seo.about/viza translations). Not adding
              IATA/TÜRSAB/ISO badges without the agency actually holding
              those, per explicit confirmation. */}
          <div className="tl-about-service-title">{t('about.certTitle')}</div>
          <div className="tl-about-cert-row">
            <div className="tl-about-cert-badge">
              <strong>ATAA</strong>
              <span>{t('about.certAtaa')}</span>
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

          <SeoBodyText>
            <p>{t('about.seoP1')}</p>
            <p>{t('about.seoP2')}</p>
            <p>{t('about.seoP3')}</p>
          </SeoBodyText>
        </div>
      </section>
    </>
  );
}
