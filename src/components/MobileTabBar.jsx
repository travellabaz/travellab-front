import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { useCart } from '../context/CartContext';
import { getLocaleFromPathname, buildLocalizedPath } from '../utils/locale';
import { SOCIAL_LINKS } from '../utils/socialLinks';
import useScrollDirection from '../hooks/useScrollDirection';

// Same WhatsApp Channel link as NavProfile.jsx (desktop dropdown).
const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vaifnm1ATRSxATpCqq3N';

// Same path data as Footer.jsx's own social icons — see NavProfile.jsx's
// identical constant for why this isn't further deduplicated into one
// shared file (two small per-file icon sets, consistent with how the rest
// of the codebase defines icons locally rather than through a shared
// icon library).
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

function HomeIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function HotelIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V6a1 1 0 0 1 1-1h4v16" />
      <path d="M16 21v-11a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v11" />
      <path d="M8 21h13" />
      <path d="M8 8h4M8 12h4M8 16h4" />
    </svg>
  );
}

function TourIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 21 3 13 21 11 13 3 11" />
    </svg>
  );
}

function LabpointIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15 9 22 9.5 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.5 9 9 12 2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

// The 4 sections real usage/product priority puts above the rest — home
// (flight search), hotels, tours, and Labpoint (the loyalty differentiator
// called out on the homepage hero) — plus account. Not a 1:1 copy of a
// generic reference icon set; the hamburger menu still holds the full
// link list (Tədbirlər, Viza, Bloq) for anything not promoted here.
const TABS = [
  { path: '/', key: 'home', Icon: HomeIcon, end: true },
  { path: '/hotels', key: 'hotels', Icon: HotelIcon },
  { path: '/tours', key: 'tours', Icon: TourIcon },
  { path: '/labpoint', key: 'labpoint', Icon: LabpointIcon },
];

// Same "outside the Route tree" reasoning as Nav.jsx — paths built via
// buildLocalizedPath rather than relative Links.
export default function MobileTabBar() {
  const { isAuthenticated, profile, logout } = useAuth();
  const { openAuth } = useModals();
  const { openDrawer } = useCart();
  const { t } = useTranslation();
  const location = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const lang = getLocaleFromPathname(location.pathname);
  const localize = (path) => buildLocalizedPath(path, lang);

  // turbo.az-style hide-on-scroll-down/show-on-scroll-up, on every page.
  // On tour product pages this hands the bottom slot to TourStickyBar.jsx
  // (which shows on the same scroll-down condition) — everywhere else the
  // slot's just empty while scrolling, same as turbo.az's own listing pages.
  const scrollDirection = useScrollDirection();
  const hidden = scrollDirection === 'down';

  return (
    <>
      <nav className={'tl-tabbar' + (hidden ? ' tl-tabbar-hidden' : '')} aria-label="Mobil naviqasiya">
        {TABS.map(({ path, key, Icon, end }) => (
          <NavLink
            key={path}
            to={localize(path)}
            end={end}
            className={({ isActive }) => 'tl-tabbar-item' + (isActive ? ' active' : '')}
            onClick={() => setAccountOpen(false)}
          >
            <Icon />
            <span>{t(`mobileTabBar.${key}`)}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={'tl-tabbar-item' + (accountOpen ? ' active' : '')}
          onClick={() => (isAuthenticated ? setAccountOpen((o) => !o) : openAuth('login'))}
        >
          {isAuthenticated ? <span className="tl-tabbar-avatar">{profile.initials}</span> : <UserIcon />}
          <span>{isAuthenticated ? t('mobileTabBar.account') : t('mobileTabBar.login')}</span>
        </button>
      </nav>

      {accountOpen && isAuthenticated && (
        <>
          <div className="tl-tabbar-backdrop" onClick={() => setAccountOpen(false)} />
          <div className="tl-tabbar-sheet">
            <div className="tl-tabbar-sheet-name">{profile.name} {profile.surname}</div>
            <div className="tl-tabbar-sheet-lp">
              <span>{t('mobileTabBar.balanceLabel')}</span>
              <strong>{profile.points} LP</strong>
            </div>

            <NavLink to={localize('/hesab/sifarislerim')} className="tl-tabbar-sheet-item" onClick={() => setAccountOpen(false)}>
              {t('navProfile.orders')}
            </NavLink>

            <button
              type="button"
              className="tl-tabbar-sheet-item"
              style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              onClick={() => { setAccountOpen(false); openDrawer(); }}
            >
              {t('navProfile.cart')}
            </button>

            <a className="tl-tabbar-sheet-item" href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
              {t('navProfile.waChannel')}
            </a>

            <div className="tl-tabbar-sheet-social">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    {SOCIAL_ICON_PATHS[s.key]}
                  </svg>
                </a>
              ))}
            </div>

            <a className="tl-tabbar-sheet-item" href="mailto:info@travellab.az">
              {t('navProfile.support')}
            </a>

            <NavLink to={localize('/about')} className="tl-tabbar-sheet-item" onClick={() => setAccountOpen(false)}>
              {t('navProfile.about')}
            </NavLink>

            <a
              className="tl-tabbar-sheet-logout"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setAccountOpen(false);
                logout();
              }}
            >
              🚪 {t('mobileTabBar.logout')}
            </a>
          </div>
        </>
      )}
    </>
  );
}
