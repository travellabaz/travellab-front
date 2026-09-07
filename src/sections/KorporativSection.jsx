import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import EventsGallery from '../components/EventsGallery';
import PartnersSection from './PartnersSection';
import { STATS } from '../config/companyInfo';
import { MANAGERS } from '../utils/managers';

// Corporate leads go to one specific person, not the round-robin pool the
// rest of the site uses (see utils/managers.js) — same reasoning as
// GiftCardPage's dedicated manager.
const CORP_MANAGER = MANAGERS.find((m) => m.name === 'Xəyalə') || MANAGERS[0];

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const PLAY_ICON = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);

// Same STAT_ICONS language as About/Labpoint — reused verbatim so the
// stats band looks identical everywhere it appears.
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

const SERVICE_ICONS = {
  flights: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12l19-8-8 19-2-8-9-3z" />
    </svg>
  ),
  events: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  viza: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M8 17h8" />
    </svg>
  ),
  team: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M2 20c.8-3.4 3-5 6-5s5.2 1.6 6 5M14 20c.6-2.6 2.1-4.2 4.2-4.8" />
    </svg>
  ),
  giftCard: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="2" /><path d="M3 13h18M12 8v13" /><path d="M12 8c-2-4-7-3-7 0s5 2 7 0zM12 8c2-4 7-3 7 0s-5 2-7 0z" />
    </svg>
  ),
  shop: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6L5 3H2" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
    </svg>
  ),
};
const SERVICE_KEYS = ['flights', 'events', 'viza', 'team', 'giftCard', 'shop'];

const STEP_KEYS = ['signup', 'earn', 'use', 'more'];

// CMS-editable, not hardcoded: exact thresholds (spend levels) and exact
// perks (discount %, VIP lounge terms) haven't been confirmed by finance
// yet — each tier is just a title + a short bullet list of plain
// translation strings, so the numbers can be corrected later by editing
// src/i18n/locales/*.json (same GitHub-web-editor workflow as everything
// else on this site) without touching this component.
const TIER_KEYS = ['bronze', 'silver', 'gold'];

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
      <video className="tl-lp-video-lightbox-player" src={src} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />
    </div>,
    document.body
  );
}

function CorpVideoCard() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="tl-corp-video-card" onClick={() => setOpen(true)}>
        <video src="/videos/korporativ/hero.mp4" poster="/images/korporativ/hero-poster.jpg" muted autoPlay loop playsInline />
        <span className="tl-corp-video-play">{PLAY_ICON}</span>
        <span className="tl-corp-video-caption">
          <strong>travellab</strong>
          <span>{t('korporativ.videoCaption')}</span>
        </span>
      </button>
      {open && <VideoLightbox src="/videos/korporativ/hero.mp4" onClose={() => setOpen(false)} />}
    </>
  );
}

// Same lead-capture -> WhatsApp pattern as VizaSection: nothing is sent
// anywhere until the visitor presses Send inside WhatsApp itself, so this
// tracks whether window.open actually succeeded rather than claiming
// success unconditionally.
function CorpContactForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', message: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [waOpened, setWaOpened] = useState(null);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const { name, company, phone, email, message } = form;
    if (!name.trim()) return setError(t('korporativ.errorName'));
    if (!company.trim()) return setError(t('korporativ.errorCompany'));
    if (phone.replace(/\D/g, '').length < 9) return setError(t('korporativ.errorPhone'));
    if (!email.trim() || !email.includes('@')) return setError(t('korporativ.errorEmail'));

    const msg =
      t('korporativ.waMessage', { name: name.trim(), company: company.trim(), phone: phone.trim(), email: email.trim() }) +
      (message.trim() ? t('korporativ.waMessageNote', { note: message.trim() }) : '');
    const win = window.open('https://wa.me/' + CORP_MANAGER.number + '?text=' + encodeURIComponent(msg), '_blank');
    setWaOpened(!!win);
    setDone(true);
  };

  if (done) {
    return (
      <div className="tl-corp-form-card">
        <h3 className="tl-corp-form-title">{t('korporativ.formDoneTitle')}</h3>
        <p className="tl-corp-form-desc">{waOpened === false ? t('korporativ.formDoneBlocked') : t('korporativ.formDoneDesc')}</p>
      </div>
    );
  }

  return (
    <form className="tl-corp-form-card" onSubmit={submit}>
      <h3 className="tl-corp-form-title">{t('korporativ.formTitle')}</h3>
      <p className="tl-corp-form-desc">{t('korporativ.formDesc')}</p>
      <div className="tl-corp-form-fields">
        <input type="text" placeholder={t('korporativ.formName')} value={form.name} onChange={setField('name')} />
        <input type="text" placeholder={t('korporativ.formCompany')} value={form.company} onChange={setField('company')} />
        <input type="tel" placeholder={t('korporativ.formPhone')} value={form.phone} onChange={setField('phone')} />
        <input type="email" placeholder={t('korporativ.formEmail')} value={form.email} onChange={setField('email')} />
        <textarea placeholder={t('korporativ.formMessage')} rows={3} value={form.message} onChange={setField('message')} />
      </div>
      {error && <p className="tl-corp-form-error">{error}</p>}
      <button type="submit" className="tl-outlink tl-outlink-green tl-corp-form-submit">
        {t('korporativ.formSubmit')} {ARROW}
      </button>
    </form>
  );
}

export default function KorporativSection() {
  const { t } = useTranslation();

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Korporativ səyahət xidmətləri',
    provider: { '@type': 'TravelAgency', name: 'Travellab' },
    areaServed: 'AZ',
    audience: { '@type': 'BusinessAudience' },
  };

  return (
    <section id="korporativ" className="tl-page-top">
      <div className="tl-section">
        {/* Hero */}
        <div className="tl-corp-hero">
          <div className="tl-corp-hero-text">
            <div className="tl-tag">{t('korporativ.heroTag')}</div>
            <h1 className="tl-title tl-corp-hero-title">
              {t('korporativ.heroTitle1')}<br /><span className="tl-corp-accent">{t('korporativ.heroTitle2')}</span>
            </h1>
            <p className="tl-corp-hero-desc">{t('korporativ.heroDesc')}</p>
            <a href="#korporativ-form" className="tl-outlink tl-outlink-green">
              {t('korporativ.heroCta')} {ARROW}
            </a>
          </div>
          <div className="tl-corp-hero-visual" aria-hidden="true">
            <span className="tl-corp-hero-visual-caption">{t('korporativ.heroVisualCaption')}</span>
          </div>
        </div>

        {/* Video + form */}
        <div className="tl-corp-video-form-row" id="korporativ-form">
          <div className="tl-corp-video-col">
            <h2 className="tl-corp-subtitle">{t('korporativ.videoTitle')}</h2>
            <p className="tl-corp-subtitle-desc">{t('korporativ.videoDesc')}</p>
            <CorpVideoCard />
          </div>
          <CorpContactForm />
        </div>

        {/* Stats band */}
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

        {/* Services grid */}
        <div className="tl-section-header" style={{ marginTop: 40 }}>
          <div>
            <div className="tl-tag">{t('korporativ.servicesTag')}</div>
            <h2 className="tl-title">{t('korporativ.servicesTitle')}</h2>
            <p className="tl-corp-subtitle-desc">{t('korporativ.servicesDesc')}</p>
          </div>
        </div>
        <div className="tl-corp-services-grid">
          {SERVICE_KEYS.map((key) => (
            <div className="tl-corp-service-card" key={key}>
              <span className="tl-corp-service-icon">{SERVICE_ICONS[key]}</span>
              <strong>{t(`korporativ.service${key.charAt(0).toUpperCase()}${key.slice(1)}Title`)}</strong>
              <p>{t(`korporativ.service${key.charAt(0).toUpperCase()}${key.slice(1)}Desc`)}</p>
            </div>
          ))}
        </div>

        {/* LabPoint Korporativ */}
        <div className="tl-section-header" style={{ marginTop: 40 }}>
          <div>
            <div className="tl-tag">{t('korporativ.lpTag')}</div>
            <h2 className="tl-title">{t('korporativ.lpTitle')}</h2>
            <p className="tl-corp-subtitle-desc">
              {t('korporativ.lpDesc')} <Link to="/labpoint" className="tl-viewall">{t('korporativ.lpLink')} {ARROW}</Link>
            </p>
          </div>
        </div>
        <div className="tl-corp-tiers-grid">
          {TIER_KEYS.map((key) => (
            <div className={`tl-corp-tier-card tl-corp-tier-${key}`} key={key}>
              <span className="tl-corp-tier-badge">{t(`korporativ.tier${key.charAt(0).toUpperCase()}${key.slice(1)}Badge`)}</span>
              <strong>{t(`korporativ.tier${key.charAt(0).toUpperCase()}${key.slice(1)}Title`)}</strong>
              <ul>
                <li>{t(`korporativ.tier${key.charAt(0).toUpperCase()}${key.slice(1)}Perk1`)}</li>
                <li>{t(`korporativ.tier${key.charAt(0).toUpperCase()}${key.slice(1)}Perk2`)}</li>
                <li>{t(`korporativ.tier${key.charAt(0).toUpperCase()}${key.slice(1)}Perk3`)}</li>
              </ul>
            </div>
          ))}
        </div>

        {/* Necə işləyir */}
        <div className="tl-section-header" style={{ marginTop: 40 }}>
          <div>
            <div className="tl-tag">{t('korporativ.stepsTag')}</div>
            <h2 className="tl-title">{t('korporativ.stepsTitle')}</h2>
          </div>
        </div>
        <div className="tl-corp-steps-grid">
          {STEP_KEYS.map((key, i) => (
            <div className="tl-corp-step-card" key={key}>
              <span className="tl-corp-step-n">{i + 1}</span>
              <strong>{t(`korporativ.step${key.charAt(0).toUpperCase()}${key.slice(1)}Title`)}</strong>
              <p>{t(`korporativ.step${key.charAt(0).toUpperCase()}${key.slice(1)}Desc`)}</p>
            </div>
          ))}
        </div>

        {/* Tədbirlərimizdən */}
        <div className="tl-section-header" style={{ marginTop: 40 }}>
          <div>
            <div className="tl-tag">{t('korporativ.eventsTag')}</div>
            <h2 className="tl-title">{t('korporativ.eventsTitle')}</h2>
          </div>
        </div>
        <EventsGallery />
      </div>

      <PartnersSection />

      {/* Final CTA + form */}
      <div className="tl-section">
        <div className="tl-corp-final-cta">
          <div>
            <h2>{t('korporativ.finalCtaTitle')}</h2>
            <p>{t('korporativ.finalCtaDesc')}</p>
          </div>
        </div>
        <CorpContactForm />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
    </section>
  );
}
