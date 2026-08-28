import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import LogoMark from '../components/LogoMark';
import SeoBodyText from '../components/SeoBodyText';
import PartnersSection from './PartnersSection';
import { useModals } from '../context/ModalContext';
import { pickManager } from '../utils/managers';
import { STATS } from '../config/companyInfo';

// Real site photography (same rotating set HeroSearch/blog covers/OG
// images use), not unrelated stock — the hero banner needed one full-
// bleed background photo, this is the moodiest/most "journey" one of
// the four.
const HERO_IMAGE = '/images/hero/aurora.jpg';

const ICON_PROPS = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
};

// Every one of these links to a real page/feature that already exists —
// no fabricated services. Order and exact 8 items per the final Haqqımızda
// spec (2x4 grid): Flights, Transfer, Hotels, Summer tours, Viza,
// Insurance, Shop, Medical — Labpoint intentionally isn't in this grid
// (it already has its own promo card below), matching the spec's list.
const SERVICES = [
  { key: 'Flights', icon: (
    <svg {...ICON_PROPS}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
  ) },
  { key: 'Transfer', icon: (
    <svg {...ICON_PROPS}><path d="M3 13V7h9v6" /><path d="M12 9h4l3 3v4h-7" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
  ) },
  { key: 'Hotels', icon: (
    <svg {...ICON_PROPS}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 21v-4h6v4" /><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01" /></svg>
  ) },
  { key: 'Tours', icon: (
    <svg {...ICON_PROPS}><circle cx="12" cy="12" r="5" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></svg>
  ) },
  { key: 'Viza', icon: (
    <svg {...ICON_PROPS}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></svg>
  ) },
  { key: 'Insurance', icon: (
    <svg {...ICON_PROPS}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
  ) },
  { key: 'Shop', icon: (
    <svg {...ICON_PROPS}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
  ) },
  { key: 'Medical', icon: (
    <svg {...ICON_PROPS}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
  ) },
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

// Same icon per stat key used in both the hero row (small, light) and the
// green band further down (bigger) — both read from the one STATS config
// so the numbers can only ever be changed in one place.
const STAT_ICONS = {
  statYears: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17.3 6.2 21l1.5-6.6L2.5 9.9l6.7-.6L12 3l2.8 6.3 6.7.6-5.2 4.5 1.5 6.6z" />
    </svg>
  ),
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
  statTeam: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 12a9 9 0 0 1 10 0" /><path d="M4 15.5 7 12l3 3.5M20 15.5 17 12l-3 3.5" />
    </svg>
  ),
};

const PIN_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Real office photography (Caspian Business Center, Bakı) — big shot is
// the widest one that actually shows the space, the three small ones add
// variety (team at work, reception lounge, the building itself) rather
// than three crops of the same room.
const OFFICE_BIG = { src: '/images/about/office/glass-corridor-wide.jpg', alt: 'Travellab ofisi — iş sahəsi' };
const OFFICE_SMALL = [
  { src: '/images/about/office/workspace-women.jpg', alt: 'Travellab komandası iş başında' },
  { src: '/images/about/office/lounge-green-wall.jpg', alt: 'Travellab ofisində qonaq gözləmə zonası' },
  { src: '/images/about/office/building-exterior.jpg', alt: 'Caspian Business Center — Travellab ofisi' },
];

// Real event/PR photography the marketing team sent directly — hardcoded,
// not pulled from any API or the blog feed. First 4 are the on-page
// preview grid; the rest only show up in the "Daha çox tədbir" lightbox.
const EVENTS = [
  { src: '/images/about/events/travellab-qarabagda.jpg', caption: 'Travellab Qarabağda' },
  { src: '/images/about/events/mice-leisure-turkiye-2025.jpg', caption: 'MICE & Leisure B2B Görüşləri — Türkiyə 2025' },
  { src: '/images/about/events/ataa-2026-perspectives-1.jpg', caption: 'ATAA — 2026 perspektivləri toplantısı' },
  { src: '/images/about/events/unique-fair-travel-arabian-2025.jpg', caption: 'Unique Fair Travel Arabian Edition 2025' },
  { src: '/images/about/events/luxury-travel-mart.jpg', caption: 'Luxury Travel Mart' },
  { src: '/images/about/events/ras-al-khaimah.jpg', caption: 'Ras Al Khaimakh səfəri' },
  { src: '/images/about/events/medical-b2b-workshop-alean.jpg', caption: 'Medical B2B Workshop — Alean' },
  { src: '/images/about/events/wta-china-azerbaijan-dialogue.jpg', caption: 'China-Azerbaijan Tourism Dialogue' },
  { src: '/images/about/events/strateji-marketinq-forumu-2026.jpg', caption: 'Strateji Marketinq Forumu 2026' },
  { src: '/images/about/events/tehsilde-deyerli-sen-forum.jpg', caption: 'Təhsildə Dəyərli Sən 5 Forum' },
  { src: '/images/about/events/air-arabia-breakfast.jpg', caption: 'Air Arabia biznes səhər yeməyi' },
  { src: '/images/about/events/radio-93fm.jpg', caption: '93 FM Radio' },
  { src: '/images/about/events/world-karyera-certificate.jpg', caption: 'WORLD Karyera Forumu' },
  { src: '/images/about/events/travellab-group-award.jpg', caption: 'Mükafat mərasimi' },
  { src: '/images/about/events/official-partner-announcement.jpg', caption: 'Rəsmi tərəfdaşlıq elanı' },
  { src: '/images/about/events/b2b-meeting-room.jpg', caption: 'B2B görüşləri' },
  { src: '/images/about/events/team-dinner.jpg', caption: 'Komanda görüşü' },
  { src: '/images/about/events/ataa-2026-perspectives-2.jpg', caption: 'ATAA — 2026 perspektivləri toplantısı' },
  { src: '/images/about/events/ataa-2026-perspectives-3.jpg', caption: 'ATAA — 2026 perspektivləri toplantısı' },
];
const EVENTS_PREVIEW = EVENTS.slice(0, 4);

function EventsLightbox({ onClose }) {
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
    <div className="tl-events-lightbox-overlay" onClick={onClose}>
      <div className="tl-events-lightbox" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tl-events-lightbox-close" onClick={onClose} aria-label={t('about.eventsClose')}>✕</button>
        <div className="tl-events-lightbox-grid">
          {EVENTS.map((ev) => (
            <figure key={ev.src} className="tl-events-lightbox-item">
              <img src={ev.src} alt={ev.caption} loading="lazy" />
              <figcaption>{ev.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AboutSection() {
  const { t } = useTranslation();
  const { openManagerContact } = useModals();
  const [eventsOpen, setEventsOpen] = useState(false);

  return (
    <>
      <section className="tl-about-hero tl-page-top" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
        <div className="tl-about-hero-inner">
          <h1 className="tl-title">{t('about.title')}</h1>
          <p className="tl-about-hero-tagline">{t('about.heroTagline')}</p>
          <div className="tl-about-hero-stats">
            {STATS.map((s) => (
              <div className="tl-about-hero-stat" key={s.key}>
                <span className="tl-about-hero-stat-icon">{STAT_ICONS[s.key]}</span>
                <div>
                  <div className="tl-about-hero-stat-n">{s.n}</div>
                  <div className="tl-about-hero-stat-l">{t(`about.${s.key}`)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="tl-section">
          <div className="tl-about-who-row">
            <div className="tl-about-who-text">
              <div className="tl-tag">{t('about.tag')}</div>
              <h2 className="tl-about-brand">{t('about.whoTitle')}</h2>
              <p className="tl-about-text">{t('about.intro')}</p>
              <div className="tl-about-badges">
                {BADGE_KEYS.map((key) => (
                  <span className="tl-about-badge" key={key}>
                    {BADGE_ICONS[key]}
                    {t(`about.badge${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
                  </span>
                ))}
              </div>
            </div>
            <div className="tl-about-office-photos">
              <img className="tl-about-office-big" src={OFFICE_BIG.src} alt={OFFICE_BIG.alt} loading="lazy" />
              <div className="tl-about-office-small-row">
                {OFFICE_SMALL.map((p) => (
                  <img key={p.src} src={p.src} alt={p.alt} loading="lazy" />
                ))}
              </div>
            </div>
          </div>

          <div className="tl-about-stats-band">
            {STATS.map((s) => (
              <div className="tl-about-stats-band-item" key={s.key}>
                <span className="tl-about-stats-band-icon">{STAT_ICONS[s.key]}</span>
                <div>
                  <div className="tl-about-stat-n">{s.n}</div>
                  <div className="tl-about-stat-l">{t(`about.${s.key}`)}</div>
                </div>
              </div>
            ))}
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

          <div className="tl-about-service-title">{t('about.eventsTitle')}</div>
          <div className="tl-about-events-grid">
            {EVENTS_PREVIEW.map((ev) => (
              <div className="tl-about-event-item" key={ev.src}>
                <img src={ev.src} alt={ev.caption} loading="lazy" />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <button type="button" className="tl-about-events-more" onClick={() => setEventsOpen(true)}>
              {t('about.eventsMoreBtn')}
            </button>
          </div>
          {eventsOpen && <EventsLightbox onClose={() => setEventsOpen(false)} />}

          <div className="tl-tag">{t('about.ecosystemTag')}</div>
          <h2 className="tl-about-eco-title">{t('about.ecosystemTitle')}</h2>
          <div className="tl-about-eco-row">
            <Link to="/labpoint" className="tl-about-eco-card tl-about-eco-orange">
              <div className="tl-about-eco-body">
                <span className="tl-shop-promo-kicker">{t('about.promoLabpointKicker')}</span>
                <span className="tl-about-eco-card-title">Labpoint</span>
                <p className="tl-about-eco-card-desc">{t('about.ecoLabpointDesc')}</p>
                <span className="tl-about-eco-btn">
                  {t('about.ecoLabpointBtn')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </span>
              </div>
              {/* Our own real card visual (same look as LabpointSection's
                  .tl-lp-cardvis), not a stock photo. */}
              <div className="tl-about-lp-card" aria-hidden="true">
                <div className="tl-about-lp-card-brand">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 2h6M10 2v6.2L5.4 17a2 2 0 0 0 1.8 3h9.6a2 2 0 0 0 1.8-3L14 8.2V2" />
                    <path d="M7.5 14h9" />
                  </svg>
                  LabPoint<sup>™</sup>
                </div>
                <div className="tl-about-lp-card-bal">2 500 <span>LP</span></div>
              </div>
            </Link>

            <Link
              to="/events"
              className="tl-about-eco-card tl-about-eco-photo"
              style={{ backgroundImage: `url(${EVENTS[0].src})` }}
            >
              <div className="tl-about-eco-body">
                <span className="tl-shop-promo-kicker">{t('about.promoEventsKicker')}</span>
                <span className="tl-about-eco-card-title">{t('nav.events')}</span>
                <p className="tl-about-eco-card-desc">{t('about.ecoEventsDesc')}</p>
                <span className="tl-about-eco-btn">
                  {t('about.ecoEventsBtn')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </span>
              </div>
            </Link>

            <Link to="/blog?category=Tibbi%20Turizm" className="tl-about-eco-card tl-about-eco-navy">
              <div className="tl-about-eco-body">
                <span className="tl-shop-promo-kicker">{t('about.promoMedicalKicker')}</span>
                <span className="tl-about-eco-card-title">{t('about.serviceMedical')}</span>
                <p className="tl-about-eco-card-desc">{t('about.ecoMedicalDesc')}</p>
                <span className="tl-about-eco-btn">
                  {t('about.ecoMedicalBtn')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </span>
              </div>
              <span className="tl-about-eco-medical-icon" aria-hidden="true">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </span>
            </Link>
          </div>

        </div>
      </section>

      <PartnersSection />

      <section>
        <div className="tl-section">
          <div className="tl-about-cta">
            <span className="tl-about-cta-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </span>
            <div className="tl-about-cta-text">
              <div className="tl-about-cta-title">{t('about.ctaTitle')}</div>
              <p className="tl-about-cta-sub">{t('about.ctaSubtitle')}</p>
            </div>
            <button type="button" className="tl-about-cta-btn" onClick={() => openManagerContact(pickManager())}>
              {t('about.ctaButton')}
            </button>
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
