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

// Corporate forms only accept a company email — free/consumer providers
// are rejected with a distinct "use your company email" message.
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com',
  'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com',
  'protonmail.com', 'proton.me', 'gmx.com', 'mail.ru', 'inbox.ru', 'list.ru',
  'bk.ru', 'internet.ru', 'rambler.ru', 'yandex.ru', 'yandex.com', 'ya.ru',
  'qq.com', '163.com', '126.com', 'box.az',
]);

function isPersonalEmail(email) {
  const domain = email.trim().toLowerCase().split('@')[1];
  return !domain || PERSONAL_EMAIL_DOMAINS.has(domain);
}

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
const SERVICE_COLORS = {
  flights: { bg: '#E6F1FB', icon: '#185FA5' },
  events: { bg: '#FAEEDA', icon: '#854F0B' },
  viza: { bg: '#E1F5EE', icon: '#0F6E56' },
  team: { bg: '#FAECE7', icon: '#993C1D' },
  giftCard: { bg: '#FBEAF0', icon: '#993556' },
  shop: { bg: '#EAF3DE', icon: '#3B6D11' },
};

// One specific client-approved exception to the navy/yellow brand
// palette used everywhere else on this page — the final CTA card is
// built to a supplied reference design that uses green (icon circles,
// buttons), not a styling inconsistency.
const BENEFIT_KEYS = ['process', 'partner', 'support', 'perks'];
const BENEFIT_ICONS = {
  process: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12l19-8-8 19-2-8-9-3z" />
    </svg>
  ),
  partner: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" /><path d="M9 12l2 2 4-4" />
    </svg>
  ),
  support: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M20 19a4 4 0 0 1-4 4h-2" />
    </svg>
  ),
  perks: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.6 5.9L21 9.6l-4.6 4.2 1.2 7.2-6.2-3.4-5.6 3.4 1.2-7.2L3 9.6l6.4-.7z" />
    </svg>
  ),
};

const SERVICE_OPTION_KEYS = ['flights', 'events', 'viza', 'team', 'giftCard', 'shop', 'labpoint'];

// The actual WhatsApp glyph (Bootstrap Icons' "whatsapp" path), not a
// rough approximation — same icon widely used for real "chat with us
// on WhatsApp" buttons.
const WHATSAPP_ICON = (
  <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
  </svg>
);

const PERSON_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 4.5-6 8-6s7 2 8 6" /></svg>
);

const STEP_KEYS = ['signup', 'earn', 'use', 'more'];
const STEP_ICONS = {
  signup: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  ),
  earn: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c0-1.4 1.2-2 2.5-2s2.5.7 2.5 2c0 2.5-5 1.5-5 4 0 1.3 1.2 2 2.5 2s2.5-.6 2.5-2" />
    </svg>
  ),
  use: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12l19-8-8 19-2-8-9-3z" />
    </svg>
  ),
  more: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4z" /><path d="M8 5H5a3 3 0 0 0 3 5M16 5h3a3 3 0 0 1-3 5" /><path d="M12 13v3M10 16.5h4v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2z" />
    </svg>
  ),
};

// Illustrative example balance for the LabPoint Korporativ promo card —
// same numbers LabpointSection.jsx shows a logged-out visitor, not a real
// per-company balance (there's no corporate account to read one from here).
const DEMO_POINTS = '2 500';
const DEMO_AZN = '2500';

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

// Reuses LabpointSection's own .tl-lp-card/.tl-lp-cardvis markup and
// classes verbatim (same design language, per the client's request) —
// just this page's own tag/heading/copy/buttons on the left, and a
// non-authenticated illustrative balance on the right (no logged-in
// company account to read a real one from on this page).
function CorpLabpointPromo() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const shareUrl = 'https://travellab-point.az/';

  const share = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tl-lp-card">
      <div>
        <div className="tl-tag">{t('korporativ.lpTag')}</div>
        <h2 className="tl-lp-headline">{t('korporativ.lpTitle')}</h2>
        <p className="tl-lp-desc">{t('korporativ.lpDesc')}</p>
        <div className="tl-lp-actions">
          <a href="#korporativ-form" className="tl-lp-btn tl-lp-btn-primary">
            {t('korporativ.lpApplyBtn')} {ARROW}
          </a>
          <Link to="/labpoint" className="tl-lp-btn tl-lp-btn-outline">
            {t('korporativ.lpMoreBtn')} {ARROW}
          </Link>
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
            {DEMO_POINTS} <span>LP</span>
          </div>
          <div className="tl-lp-cv-azn">≈ {DEMO_AZN} ₼</div>
        </div>
      </div>
    </div>
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
    if (isPersonalEmail(email)) return setError(t('korporativ.errorEmailPersonal'));

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

// Replaces the old dark-banner + separate form card at the bottom of the
// page — single wide card over a real site photo (same plane-wing/clouds
// shot HotelsSection.jsx uses), with its own form (adds a "which service"
// dropdown the hero form doesn't have) and a standalone WhatsApp card.
// Own form state, not a reuse of CorpContactForm above — different field
// set (adds `service`, drops the free-text message box) and layout.
function CorpFinalSection() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ company: '', name: '', phone: '', email: '', service: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [waOpened, setWaOpened] = useState(null);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const { company, name, phone, email, service } = form;
    if (!name.trim()) return setError(t('korporativ.errorName'));
    if (!company.trim()) return setError(t('korporativ.errorCompany'));
    if (phone.replace(/\D/g, '').length < 9) return setError(t('korporativ.errorPhone'));
    if (!email.trim() || !email.includes('@')) return setError(t('korporativ.errorEmail'));
    if (isPersonalEmail(email)) return setError(t('korporativ.errorEmailPersonal'));

    const msg =
      t('korporativ.waMessage', { name: name.trim(), company: company.trim(), phone: phone.trim(), email: email.trim() }) +
      (service ? t('korporativ.waMessageService', { service: t(`korporativ.serviceOption${service.charAt(0).toUpperCase()}${service.slice(1)}`) }) : '');
    const win = window.open('https://wa.me/' + CORP_MANAGER.number + '?text=' + encodeURIComponent(msg), '_blank');
    setWaOpened(!!win);
    setDone(true);
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/' + CORP_MANAGER.number + '?text=' + encodeURIComponent(t('korporativ.waCardMessage')), '_blank');
  };

  return (
    <div className="tl-corp-final-cta">
      <div className="tl-corp-final-text">
        <div className="tl-corp-final-eyebrow">{t('korporativ.ctaEyebrow')}</div>
        <h2 className="tl-corp-final-heading">
          {t('korporativ.ctaHeading1')}<br /><span>{t('korporativ.ctaHeading2')}</span>
        </h2>
        <p className="tl-corp-final-desc">{t('korporativ.ctaSubtext')}</p>
        <div className="tl-corp-final-benefits">
          {BENEFIT_KEYS.map((key) => (
            <div className="tl-corp-final-benefit" key={key}>
              <span className="tl-corp-final-benefit-icon">{BENEFIT_ICONS[key]}</span>
              <span>{t(`korporativ.benefit${key.charAt(0).toUpperCase()}${key.slice(1)}`)}</span>
            </div>
          ))}
        </div>
      </div>

      {done ? (
        <div className="tl-corp-final-form-card">
          <h3 className="tl-corp-form-title">{t('korporativ.formDoneTitle')}</h3>
          <p className="tl-corp-form-desc">{waOpened === false ? t('korporativ.formDoneBlocked') : t('korporativ.formDoneDesc')}</p>
        </div>
      ) : (
        <form className="tl-corp-final-form-card" onSubmit={submit}>
          <h3 className="tl-corp-form-title">{t('korporativ.formTitle')}</h3>
          <div className="tl-corp-final-form-grid">
            <input type="text" placeholder={t('korporativ.formCompany2')} value={form.company} onChange={setField('company')} />
            <input type="text" placeholder={t('korporativ.formName2')} value={form.name} onChange={setField('name')} />
            <input type="tel" placeholder={t('korporativ.formPhone2')} value={form.phone} onChange={setField('phone')} />
            <input type="email" placeholder={t('korporativ.formEmail2')} value={form.email} onChange={setField('email')} />
          </div>
          <select className="tl-corp-final-select" value={form.service} onChange={setField('service')}>
            <option value="">{t('korporativ.serviceSelectPlaceholder')}</option>
            {SERVICE_OPTION_KEYS.map((key) => (
              <option key={key} value={key}>{t(`korporativ.serviceOption${key.charAt(0).toUpperCase()}${key.slice(1)}`)}</option>
            ))}
          </select>
          {error && <p className="tl-corp-form-error">{error}</p>}
          <button type="submit" className="tl-outlink tl-outlink-green tl-corp-form-submit">
            {t('korporativ.formSubmit')} {ARROW}
          </button>
        </form>
      )}

      <div className="tl-corp-final-wa-card">
        <span className="tl-corp-final-wa-icon">{WHATSAPP_ICON}</span>
        <p>{t('korporativ.waCardText')}</p>
        <button type="button" className="tl-outlink tl-outlink-green tl-corp-final-wa-btn" onClick={openWhatsApp}>
          {t('korporativ.waCardBtn')} {ARROW}
        </button>
        <div className="tl-corp-final-wa-micro">
          <span className="tl-corp-final-wa-avatars">
            <span>{PERSON_ICON}</span>
            <span>{PERSON_ICON}</span>
          </span>
          <div>
            <strong>{t('korporativ.waCardMicro1')}</strong>
            <span>{t('korporativ.waCardMicro2')}</span>
          </div>
        </div>
      </div>
    </div>
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
          <div className="tl-corp-hero-visual">
            <img src="/images/korporativ/hero-poster.jpg" alt={t('korporativ.heroVisualAlt')} />
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
              <span className="tl-corp-service-icon" style={{ background: SERVICE_COLORS[key].bg, color: SERVICE_COLORS[key].icon }}>
                {SERVICE_ICONS[key]}
              </span>
              <strong>{t(`korporativ.service${key.charAt(0).toUpperCase()}${key.slice(1)}Title`)}</strong>
              <p>{t(`korporativ.service${key.charAt(0).toUpperCase()}${key.slice(1)}Desc`)}</p>
            </div>
          ))}
        </div>

        {/* LabPoint Korporativ — same promo-card design language as the
            /labpoint hero (LabpointSection.jsx's .tl-lp-card/.tl-lp-cardvis),
            not the earlier 3-tier Bronze/Silver/Gold layout. The balance
            shown is a fixed illustrative example (DEMO_POINTS/DEMO_AZN),
            not a real company balance — there's no per-company account to
            read a real one from here. */}
        <div style={{ marginTop: 40 }}>
          <CorpLabpointPromo />
        </div>

        {/* Necə işləyir — hidden on mobile (.tl-corp-steps-section), too much
            scroll for 4 stacked cards on a phone; desktop keeps it. */}
        <div className="tl-corp-steps-section">
          <div className="tl-section-header" style={{ marginTop: 40 }}>
            <div>
              <div className="tl-tag">{t('korporativ.stepsTag')}</div>
              <h2 className="tl-title">{t('korporativ.stepsTitle')}</h2>
            </div>
          </div>
          <div className="tl-corp-steps-grid">
            {STEP_KEYS.map((key, i) => (
              <div className="tl-corp-step-card" key={key}>
                <span className="tl-corp-step-icon-wrap">
                  <span className="tl-corp-step-icon">{STEP_ICONS[key]}</span>
                </span>
                <div className="tl-corp-step-title-row">
                  <span className="tl-corp-step-n">{i + 1}</span>
                  <strong>{t(`korporativ.step${key.charAt(0).toUpperCase()}${key.slice(1)}Title`)}</strong>
                </div>
                <p>{t(`korporativ.step${key.charAt(0).toUpperCase()}${key.slice(1)}Desc`)}</p>
              </div>
            ))}
          </div>
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

      {/* Final CTA */}
      <div className="tl-section">
        <CorpFinalSection />
      </div>

      <PartnersSection />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
    </section>
  );
}
