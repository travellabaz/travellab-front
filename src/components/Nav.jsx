import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoFull from './LogoFull';
import NavProfile from './NavProfile';
import LanguageSwitcher from './LanguageSwitcher';
import AuthMenu from './AuthMenu';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { useCart } from '../context/CartContext';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { getLocaleFromPathname, buildLocalizedPath } from '../utils/locale';

const LANG_SHORT_LABEL = { az: 'AZ', ru: 'RU', en: 'EN' };

const NAV_LINK_PATHS = [
  { path: '/search', key: 'flights' },
  { path: '/hotels', key: 'hotels' },
  { path: '/tours', key: 'tours' },
  { path: '/labpoint', key: 'labpoint' },
  { path: '/events', key: 'events' },
  { path: '/viza', key: 'viza' },
];

// Nav is mounted as a sibling of <Routes> in App.jsx, not nested inside
// any matched <Route> — so relative <Link to="search"> would resolve
// against the router root, not the current /ru or /en branch. Every link
// here is built as an absolute, locale-prefixed path via
// buildLocalizedPath instead (same reasoning applies to Footer.jsx and
// MobileTabBar.jsx).
export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { openAuth } = useModals();
  const { count, openDrawer } = useCart();
  const location = useLocation();
  const { t } = useTranslation();
  const lang = getLocaleFromPathname(location.pathname);
  const localize = (path) => buildLocalizedPath(path, lang);

  const handleLogoClick = () => {
    setMobileOpen(false);
    if (location.pathname === localize('/')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Portaled straight to <body> instead of rendering inline inside <nav> —
  // .tl-nav is a CSS Grid container (grid-template-columns) and this list
  // used to be one of its grid items (grid-column: 2) before switching to
  // position: fixed for the open dropdown. Confirmed live in Chrome that a
  // grid item's containing block sticks to its old grid-area box even
  // after it becomes fixed-positioned and even after being moved out of
  // the grid's DOM subtree entirely — the dropdown rendered pinned inside
  // that narrow middle column instead of spanning the viewport. Safari
  // didn't have this quirk, which is why it only showed up on Android
  // Chrome. A portal sidesteps the whole class of bug: this list is never
  // a grid item in the first place, so there's no stale grid-area
  // containing block to inherit.
  const mobileMenu = mobileOpen
    ? createPortal(
        <ul className="tl-mobile-menu">
          {NAV_LINK_PATHS.map(({ path, key }) => (
            <li key={path}>
              <NavLink to={localize(path)} className={({ isActive }) => (isActive ? 'active' : undefined)} onClick={() => setMobileOpen(false)}>
                {t(`nav.${key}`)}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to={localize('/shop')} className={({ isActive }) => 'tl-nav-shop-link' + (isActive ? ' active' : '')} onClick={() => setMobileOpen(false)}>
              {t('nav.shop')}
            </NavLink>
          </li>
          {/* The top bar's own LanguageSwitcher dropdown is hidden at this
              breakpoint (see .tl-nav-lang-switcher's media rule) — nesting a
              second dropdown inside an already-open menu reads worse than a
              flat AZ/RU/EN row, the usual pattern for language options
              inside a mobile hamburger menu. */}
          <li className="tl-nav-mobile-lang">
            {/* Plain <a>, not <Link> — see LanguageSwitcher.jsx for why a
                real page reload is what makes the search widget actually
                open in the picked language. */}
            {SUPPORTED_LANGUAGES.map((l) => (
              <a
                key={l}
                href={buildLocalizedPath(location.pathname, l) + location.search}
                className={'tl-nav-mobile-lang-opt' + (l === lang ? ' active' : '')}
                onClick={() => setMobileOpen(false)}
              >
                {LANG_SHORT_LABEL[l]}
              </a>
            ))}
          </li>
        </ul>,
        document.body
      )
    : null;

  return (
    <nav className="tl-nav">
      <Link to={localize('/')} className="tl-logo" onClick={handleLogoClick}>
        <LogoFull className="tl-logo-svg" style={{ height: 29, width: 'auto' }} />
      </Link>
      <ul className="tl-nav-links">
        {NAV_LINK_PATHS.map(({ path, key }) => (
          <li key={path}>
            <NavLink to={localize(path)} className={({ isActive }) => (isActive ? 'active' : undefined)} onClick={() => setMobileOpen(false)}>
              {t(`nav.${key}`)}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink to={localize('/shop')} className={({ isActive }) => 'tl-nav-shop-pill' + (isActive ? ' active' : '')}>
            {t('nav.shop')}
          </NavLink>
        </li>
      </ul>
      {mobileMenu}
      <div className="tl-nav-right">
        <button type="button" className="tl-nav-cart" aria-label={t('nav.cart')} onClick={openDrawer}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6h15l-1.5 9h-12z" />
            <path d="M6 6L5 3H2" />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
          </svg>
          {count > 0 && <span className="tl-nav-cart-badge">{count}</span>}
        </button>
        <LanguageSwitcher className="tl-nav-lang-switcher" />
        <span className="tl-nav-divider" aria-hidden="true" />
        <button
          type="button"
          className="tl-nav-burger"
          aria-label={t('nav.menu')}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span />
        </button>
        {isAuthenticated ? (
          <NavProfile />
        ) : (
          <>
            <div className="tl-nav-auth-desktop">
              <a href="#" className="tl-btn-login" onClick={(e) => { e.preventDefault(); openAuth('login'); }}>
                {t('nav.login')}
              </a>
              <a href="#" className="tl-btn-cta" onClick={(e) => { e.preventDefault(); openAuth('register'); }}>
                {t('nav.register')}
              </a>
            </div>
            <AuthMenu className="tl-nav-auth-mobile" onOpen={() => setMobileOpen(false)} />
          </>
        )}
      </div>
    </nav>
  );
}
