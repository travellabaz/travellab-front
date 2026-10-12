import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import LocalizedLink from './LocalizedLink';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { SOCIAL_LINKS } from '../utils/socialLinks';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

// Travellab's official WhatsApp Channel — follow link, not a 1:1 chat
// (distinct from the manager-pool deep links elsewhere on the site).
const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vaifnm1ATRSxATpCqq3N';

const SWIPE_CLOSE_THRESHOLD = 80; // px of downward drag on the mobile sheet's handle before it closes

// Same path data as Footer.jsx's own social icons, kept visually
// consistent with the footer rather than inventing a second icon set.
const SOCIAL_ICON_PATHS = {
  facebook: <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.17 2.1 15.95 2 14.66 2 11.98 2 10 3.66 10 6.7v2.8H7v4h3V22h4v-8.5z" />,
  linkedin: <path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM3.4 8.75h3.1V21H3.4V8.75zm6.2 0h2.97v1.68h.04c.41-.78 1.43-1.6 2.94-1.6 3.14 0 3.72 2.07 3.72 4.76V21h-3.1v-5.44c0-1.3-.02-2.97-1.81-2.97-1.82 0-2.1 1.42-2.1 2.88V21H9.6V8.75z" />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </>
  ),
  tiktok: <path d="M16.6 5.82c-.6-.66-.96-1.5-1-2.42h-3.14v13.3c0 1.4-1.13 2.53-2.53 2.53a2.53 2.53 0 0 1-.98-4.87 2.53 2.53 0 0 1 1.68-.13V11.1a5.7 5.7 0 0 0-.7-.05A5.73 5.73 0 1 0 15.6 16.7V9.02a8.16 8.16 0 0 0 4.75 1.52V7.4a4.85 4.85 0 0 1-3.75-1.58z" />,
};

const GIFT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="9" width="16" height="4" />
    <rect x="5" y="13" width="14" height="7" />
    <path d="M12 9v11" />
    <path d="M12 9C9.5 9 8 7.8 8 6.3 8 5 9 4 10.2 4 11.5 4 12 6 12 9ZM12 9c2.5 0 4-1.2 4-2.7C16 5 15 4 13.8 4 12.5 4 12 6 12 9Z" />
  </svg>
);

// Guards against showing the raw placeholder a test/incomplete account's
// mail field can hold (e.g. "xxx") — same gap would show for any real
// customer whose email is blank or was never actually validated.
function isValidEmail(mail) {
  return !!mail && mail.includes('@');
}

export default function NavProfile() {
  const { t } = useTranslation();
  const { profile, logout } = useAuth();
  const { openDrawer } = useCart();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef(null);
  const dragStartYRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // The page behind can't scroll while the menu (or its mobile
  // bottom-sheet form) is open — see useBodyScrollLock's own comment for
  // why plain overflow:hidden isn't enough on iOS Safari (confirmed live:
  // without this, the sheet visibly jumped around as the underlying page
  // scrolled and iOS's address bar collapsed/expanded under it).
  useBodyScrollLock(open);

  // Esc closes.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!profile) return null;

  const copyReferral = () => {
    navigator.clipboard.writeText(profile.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Swipe-down-to-close on the mobile sheet's handle/header only — the
  // scrollable item list below stays untouched.
  const handleSheetTouchStart = (e) => { dragStartYRef.current = e.touches[0].clientY; };
  const handleSheetTouchMove = (e) => {
    if (dragStartYRef.current == null) return;
    if (e.touches[0].clientY - dragStartYRef.current > SWIPE_CLOSE_THRESHOLD) {
      dragStartYRef.current = null;
      setOpen(false);
    }
  };
  const handleSheetTouchEnd = () => { dragStartYRef.current = null; };

  return (
    <div style={{ position: 'relative' }} ref={rootRef}>
      <button type="button" className="nav-profile-btn" onClick={() => setOpen((o) => !o)}>
        <div className="nav-avatar">{profile.initials}</div>
        {/* Hidden on mobile (see .nav-profile-name's media rule) — the
            bottom tab bar already has its own dedicated "Hesab" entry,
            so the full name here was pure duplication eating header
            width; avatar + LP badge alone stay as the compact identity. */}
        <span className="nav-profile-name">{profile.name || t('navProfile.profile')}</span>
        <span className="nav-lp-badge">{profile.points} LP</span>
      </button>
      {/* Portaled to <body> so it truly covers the whole page regardless
          of where this component sits in the DOM — same reasoning as
          StoryViewer.jsx's own portals elsewhere in this app. */}
      {open && createPortal(
        <div className="nav-dd-overlay" onClick={() => setOpen(false)} />,
        document.body
      )}
      <div className={'nav-dd' + (open ? ' open' : '')}>
        <div
          className="nav-dd-dragzone"
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
        >
          <div className="nav-dd-handle" />
        </div>
        <div className="nav-dd-hdr">
          <div className="nav-dd-name">{profile.name} {profile.surname}</div>
          <div className="nav-dd-ph">{profile.phone ? '+' + profile.phone : ''}</div>
          {isValidEmail(profile.mail) && (
            <div className="nav-dd-ph" style={{ marginTop: 2 }}>{profile.mail}</div>
          )}
          <div className="nav-dd-lp">
            <div>
              <div className="nav-dd-lpl">Labpoint</div>
              <div className="nav-dd-lpv">{profile.points} LP</div>
            </div>
            <div className="nav-dd-azn">{profile.azn} ₼</div>
          </div>
        </div>
        {profile.referralLink && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--tl-gray-200)', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(29,41,57,0.5)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
              {GIFT_ICON} {t('navProfile.referralLink')}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                readOnly
                value={profile.referralLink}
                style={{
                  flex: 1,
                  height: 32,
                  background: 'var(--tl-gray-100)',
                  border: '1px solid var(--tl-gray-200)',
                  borderRadius: 8,
                  padding: '0 10px',
                  color: 'var(--tl-navy)',
                  fontSize: 11,
                  fontFamily: "'Geist Sans', sans-serif",
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={copyReferral}
                style={{
                  height: 32,
                  padding: '0 12px',
                  background: '#F5A623',
                  border: 'none',
                  borderRadius: 8,
                  color: '#0D1520',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'Geist Sans', sans-serif",
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? '✓' : t('navProfile.copy')}
              </button>
            </div>
          </div>
        )}
        <div className="nav-dd-sep" />

        <LocalizedLink className="nav-dd-item" to="/hesab/sifarislerim" onClick={() => setOpen(false)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 2h6l1 3h4v16H4V5h4l1-3Z" />
            <path d="M9 11h6M9 15h4" />
          </svg>
          {t('navProfile.orders')}
        </LocalizedLink>

        <button type="button" className="nav-dd-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }} onClick={() => { setOpen(false); openDrawer(); }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1.3" />
            <circle cx="18" cy="20" r="1.3" />
            <path d="M2 3h2l2.6 12.4A2 2 0 0 0 8.6 17h9.2a2 2 0 0 0 2-1.6L21.5 7H5.3" />
          </svg>
          {t('navProfile.cart')}
        </button>

        <a className="nav-dd-item" href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20l1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
            <path d="M8.5 10.5c0 3 2.5 5.5 5.5 5.5" strokeLinecap="round" />
          </svg>
          {t('navProfile.waChannel')}
        </a>

        <div className="nav-dd-social">
          {SOCIAL_LINKS.map((s) => (
            <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {SOCIAL_ICON_PATHS[s.key]}
              </svg>
            </a>
          ))}
        </div>

        <a className="nav-dd-item" href="mailto:info@travellab.az">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          {t('navProfile.support')}
        </a>

        <LocalizedLink className="nav-dd-item" to="/about" onClick={() => setOpen(false)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8v.01" strokeLinecap="round" />
          </svg>
          {t('navProfile.about')}
        </LocalizedLink>

        <div className="nav-dd-sep" />
        <a
          className="nav-dd-item nav-dd-out"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          {t('navProfile.logout')}
        </a>
      </div>
    </div>
  );
}
