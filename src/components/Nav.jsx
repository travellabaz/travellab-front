import { useEffect, useState } from 'react';
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
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const LANG_SHORT_LABEL = { az: 'AZ', ru: 'RU', en: 'EN' };

const NAV_LINK_PATHS = [
  { path: '/search', key: 'flights', icon: 'plane' },
  { path: '/hotels', key: 'hotels', icon: 'bed' },
  { path: '/tours', key: 'tours', icon: 'palm' },
  { path: '/labpoint', key: 'labpoint', icon: 'star', badge: true },
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
  const { isAuthenticated, loading: authLoading } = useAuth();
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

  // Had no backdrop, no Esc-to-close, and no scroll lock at all before —
  // same gaps NavProfile.jsx's and MobileTabBar.jsx's own account menus
  // had (see useBodyScrollLock's own comment for why plain
  // overflow:hidden isn't enough on iOS Safari).
  useBodyScrollLock(mobileOpen);

  // Makes the phone/browser back button close the menu instead of
  // navigating away from the page — push a throwaway history entry the
  // instant the menu opens, then treat a 'popstate' (back button, or
  // closeMobileMenu's own history.back() call below) as "menu should be
  // closed". closeMobileMenu is for close triggers that don't themselves
  // navigate (X, overlay, Esc, cart) — see closeMobileMenuForNav below
  // for why link clicks need a different, history.back()-free close.
  const closeMobileMenu = () => {
    setMobileOpen(false);
    if (window.history.state && window.history.state.tlMobileMenu) {
      window.history.back();
    }
  };

  // Plain close, no history.back() — for anything that ALSO navigates in
  // the same click (NavLink rows, the shop/korporativ pills, the logo,
  // the language links). history.back() is async; firing it alongside
  // the navigation's own history.pushState (or, for the plain-<a>
  // language links, the browser's own full navigation) races it and can
  // silently cancel the navigation — confirmed live: tapping Viza/Turlar
  // in the open menu did nothing. The leftover pushState entry from
  // opening the menu just becomes one harmless extra "back" stop
  // pointing at the page the menu was opened from.
  const closeMobileMenuForNav = () => setMobileOpen(false);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    window.history.pushState({ tlMobileMenu: true }, '');
    const onPopState = () => setMobileOpen(false);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const toggleMobileMenu = () => {
    if (mobileOpen) closeMobileMenu();
    else setMobileOpen(true);
  };

  const handleLogoClick = () => {
    closeMobileMenuForNav();
    if (location.pathname === localize('/')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openCartFromMenu = () => {
    closeMobileMenu();
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
        <>
          {/* Same dark-blur tone as the account menus (.nav-dd-overlay /
              .tl-tabbar-backdrop) — this panel had no backdrop at all
              before, just a white dropdown over the still-fully-visible
              (and still-colorful/busy) page underneath. */}
          <div className="tl-mobile-menu-backdrop" onClick={closeMobileMenu} />
          <ul className="tl-mobile-menu">
          {NAV_LINK_PATHS.map(({ path, key, icon, badge }) => (
            <li key={path}>
              <NavLink to={localize(path)} className={({ isActive }) => 'tl-mobile-menu-row' + (isActive ? ' active' : '')} onClick={closeMobileMenuForNav}>
                <NavIcon name={icon} className="tl-mobile-menu-row-icon" />
                <span className="tl-mobile-menu-row-label">{t(`nav.${key}`)}</span>
                {badge && <span className="tl-mobile-menu-row-badge">{t('nav.newBadge')}</span>}
                <NavIcon name="chevronRight" className="tl-mobile-menu-row-chevron" />
              </NavLink>
            </li>
          ))}
          <li className="tl-mobile-menu-pill-row">
            <NavLink to={localize('/shop')} className={({ isActive }) => 'tl-nav-shop-pill' + (isActive ? ' active' : '')} onClick={closeMobileMenuForNav}>
              <NavIcon name="bag" />
              {t('nav.shop')}
            </NavLink>
          </li>
          <li className="tl-mobile-menu-pill-row">
            <NavLink to={localize('/korporativ')} className={({ isActive }) => 'tl-nav-korporativ-pill' + (isActive ? ' active' : '')} onClick={closeMobileMenuForNav}>
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
                  onClick={closeMobileMenuForNav}
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
                onClick={(e) => { e.preventDefault(); closeMobileMenu(); openAuth('login'); }}
              >
                <NavIcon name="user" className="tl-mobile-menu-row-icon" />
                <span className="tl-mobile-menu-row-label">{t('nav.login')}</span>
                <NavIcon name="chevronRight" className="tl-mobile-menu-row-chevron" />
              </a>
              <a
                href="#"
                className="tl-mobile-menu-register-btn"
                onClick={(e) => { e.preventDefault(); closeMobileMenu(); openAuth('register'); }}
              >
                <NavIcon name="userPlus" />
                {t('nav.register')}
              </a>
            </li>
          )}
          </ul>
        </>,
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
            <NavLink to={localize(path)} className={({ isActive }) => (isActive ? 'active' : undefined)} onClick={closeMobileMenuForNav}>
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
        {/* On mobile (≤900px), a logged-out visitor with an empty cart
            has no reason to see an empty cart icon — hidden via
            .tl-nav-cart-hide-mobile-guest below, replaced by the login
            pill. A logged-out visitor who already put something in the
            cart (guests can add to cart — see CartContext, it isn't
            auth-gated) still needs to find it, so the icon stays next to
            the login pill in that case. Desktop is untouched either way. */}
        <button
          type="button"
          className={'tl-nav-cart' + (!authLoading && !isAuthenticated && count === 0 ? ' tl-nav-cart-hide-mobile-guest' : '')}
          aria-label={t('nav.cart')}
          onClick={openDrawer}
        >
          <NavIcon name="cart" />
          {count > 0 && <span className="tl-nav-cart-badge">{count}</span>}
        </button>
        <LanguageSwitcher className="tl-nav-lang-switcher" />
        <span className="tl-nav-divider" aria-hidden="true" />
        {authLoading ? (
          // Reserves the same footprint as NavProfile/the login pill so
          // the header doesn't jump once the real auth state lands.
          <span className="tl-nav-auth-placeholder" aria-hidden="true" />
        ) : isAuthenticated ? (
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
            {/* Mobile-only (see .tl-nav-login-pill-mobile's media rule) —
                previously a logged-out visitor had no visible way to log
                in from the closed header at all, only via the hamburger
                menu's own login row further down. */}
            <button type="button" className="tl-nav-login-pill-mobile" onClick={() => openAuth('login')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
              </svg>
              {t('nav.login')}
            </button>
          </>
        )}
        {/* Rightmost on purpose (mobile task: the burger used to sit
            before the account block, ahead of it) — see .tl-nav-burger's
            display:none/flex media rule for when it's actually visible. */}
        <button
          type="button"
          className={'tl-nav-burger' + (mobileOpen ? ' open' : '')}
          aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.menu')}
          aria-expanded={mobileOpen}
          onClick={toggleMobileMenu}
        >
          <span />
        </button>
      </div>
    </nav>
  );
}
