import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoFull from './LogoFull';
import NavProfile from './NavProfile';
import LanguageSwitcher from './LanguageSwitcher';
import NavIcon from '../utils/navIcons';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { useCart } from '../context/CartContext';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { getLocaleFromPathname, buildLocalizedPath } from '../utils/locale';
import useScrollDirection from '../hooks/useScrollDirection';

const LANG_SHORT_LABEL = { az: 'AZ', ru: 'RU', en: 'EN' };

const NAV_LINK_PATHS = [
  { path: '/search', key: 'flights', icon: 'plane' },
  { path: '/hotels', key: 'hotels', icon: 'bed' },
  { path: '/tours', key: 'tours', icon: 'palm' },
  { path: '/labpoint', key: 'labpoint', icon: 'star', badge: true },
  { path: '/events', key: 'events', icon: 'calendar' },
  { path: '/viza', key: 'viza', icon: 'passport' },
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

  // turbo.az-style hide-on-scroll-down, show-on-scroll-up, on every page
  // and at every width (desktop included, not just mobile — see
  // .tl-nav-hidden) including tour product pages (only the bottom sticky
  // price/order bar there is exempted from this, see
  // MobileTabBar.jsx / TourStickyBar.jsx).
  const scrollDirection = useScrollDirection();
  const navHidden = scrollDirection === 'down' && !mobileOpen;

  const handleLogoClick = () => {
    setMobileOpen(false);
    if (location.pathname === localize('/')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openCartFromMenu = () => {
    setMobileOpen(false);
    openDrawer();
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
  //
  // Login/Register live inside this panel too (not a separate header
  // trigger) — the closed mobile header only ever shows logo, cart,
  // language and the burger, so there's nothing else fighting for space
  // there when logged out.
  const mobileMenu = mobileOpen
    ? createPortal(
        <ul className="tl-mobile-menu">
          {NAV_LINK_PATHS.map(({ path, key, icon, badge }) => (
            <li key={path}>
              <NavLink to={localize(path)} className={({ isActive }) => 'tl-mobile-menu-row' + (isActive ? ' active' : '')} onClick={() => setMobileOpen(false)}>
                <NavIcon name={icon} className="tl-mobile-menu-row-icon" />
                <span className="tl-mobile-menu-row-label">{t(`nav.${key}`)}</span>
                {badge && <span className="tl-mobile-menu-row-badge">{t('nav.newBadge')}</span>}
                <NavIcon name="chevronRight" className="tl-mobile-menu-row-chevron" />
              </NavLink>
            </li>
          ))}
          <li className="tl-mobile-menu-pill-row">
            <NavLink to={localize('/shop')} className={({ isActive }) => 'tl-nav-shop-pill' + (isActive ? ' active' : '')} onClick={() => setMobileOpen(false)}>
              <NavIcon name="bag" />
              {t('nav.shop')}
            </NavLink>
          </li>
          <li className="tl-mobile-menu-pill-row">
            <NavLink to={localize('/korporativ')} className={({ isActive }) => 'tl-nav-korporativ-pill' + (isActive ? ' active' : '')} onClick={() => setMobileOpen(false)}>
              <NavIcon name="briefcase" />
              {t('nav.korporativ')}
            </NavLink>
          </li>
          <li className="tl-mobile-menu-utility-row">
            <button type="button" className="tl-mobile-menu-cart-btn" onClick={openCartFromMenu}>
              <NavIcon name="cart" />
              {t('nav.cart')}
              {count > 0 && <span className="tl-mobile-menu-cart-count">{count}</span>}
            </button>
            {/* The top bar's own LanguageSwitcher dropdown is hidden at this
                breakpoint (see .tl-nav-lang-switcher's media rule) — nesting a
                second dropdown inside an already-open menu reads worse than a
                flat AZ/RU/EN row, the usual pattern for language options
                inside a mobile hamburger menu. */}
            <div className="tl-nav-mobile-lang">
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
            </div>
          </li>
          {!isAuthenticated && (
            <li className="tl-mobile-menu-auth">
              <a
                href="#"
                className="tl-mobile-menu-row tl-mobile-menu-login-row"
                onClick={(e) => { e.preventDefault(); setMobileOpen(false); openAuth('login'); }}
              >
                <NavIcon name="user" className="tl-mobile-menu-row-icon" />
                <span className="tl-mobile-menu-row-label">{t('nav.login')}</span>
                <NavIcon name="chevronRight" className="tl-mobile-menu-row-chevron" />
              </a>
              <a
                href="#"
                className="tl-mobile-menu-register-btn"
                onClick={(e) => { e.preventDefault(); setMobileOpen(false); openAuth('register'); }}
              >
                <NavIcon name="userPlus" />
                {t('nav.register')}
              </a>
            </li>
          )}
        </ul>,
        document.body
      )
    : null;

  return (
    <nav className={'tl-nav' + (navHidden ? ' tl-nav-hidden' : '')}>
      <Link to={localize('/')} className="tl-logo" onClick={handleLogoClick}>
        <LogoFull className="tl-logo-svg" style={{ height: 33, width: 'auto' }} />
      </Link>
      <ul className="tl-nav-links">
        {NAV_LINK_PATHS.map(({ path, key, badge }) => (
          <li key={path}>
            <NavLink to={localize(path)} className={({ isActive }) => (isActive ? 'active' : undefined)} onClick={() => setMobileOpen(false)}>
              {badge ? (
                <span className="tl-nav-link-badged">
                  {t(`nav.${key}`)}
                  <span className="tl-nav-link-dot" aria-hidden="true">
                    <NavIcon name="star" />
                  </span>
                </span>
              ) : (
                t(`nav.${key}`)
              )}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink to={localize('/shop')} className={({ isActive }) => 'tl-nav-shop-pill' + (isActive ? ' active' : '')}>
            <NavIcon name="bag" />
            {t('nav.shop')}
          </NavLink>
        </li>
        <li>
          <NavLink to={localize('/korporativ')} className={({ isActive }) => 'tl-nav-korporativ-pill' + (isActive ? ' active' : '')}>
            <NavIcon name="briefcase" />
            {t('nav.korporativ')}
          </NavLink>
        </li>
      </ul>
      {mobileMenu}
      <div className="tl-nav-right">
        <button type="button" className="tl-nav-cart" aria-label={t('nav.cart')} onClick={openDrawer}>
          <NavIcon name="cart" />
          {count > 0 && <span className="tl-nav-cart-badge">{count}</span>}
        </button>
        <LanguageSwitcher className="tl-nav-lang-switcher" />
        <span className="tl-nav-divider" aria-hidden="true" />
        {isAuthenticated ? (
          <NavProfile />
        ) : (
          <div className="tl-nav-auth-desktop">
            <a href="#" className="tl-btn-login" onClick={(e) => { e.preventDefault(); openAuth('login'); }}>
              {t('nav.login')}
            </a>
            <a href="#" className="tl-btn-cta" onClick={(e) => { e.preventDefault(); openAuth('register'); }}>
              {t('nav.register')}
            </a>
          </div>
        )}
        {/* Rightmost on purpose (mobile task: the burger used to sit
            before the account block, ahead of it) — see .tl-nav-burger's
            display:none/flex media rule for when it's actually visible. */}
        <button
          type="button"
          className="tl-nav-burger"
          aria-label={t('nav.menu')}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span />
        </button>
      </div>
    </nav>
  );
}
