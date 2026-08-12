import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoFull from './LogoFull';
import NavProfile from './NavProfile';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { getLocaleFromPathname, buildLocalizedPath } from '../utils/locale';

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

  return (
    <nav className="tl-nav">
      <Link to={localize('/')} className="tl-logo" onClick={handleLogoClick}>
        <LogoFull className="tl-logo-svg" style={{ height: 29, width: 'auto' }} />
      </Link>
      <ul className={'tl-nav-links' + (mobileOpen ? ' tl-nav-open' : '')}>
        {NAV_LINK_PATHS.map(({ path, key }) => (
          <li key={path}>
            <NavLink to={localize(path)} className={({ isActive }) => (isActive ? 'active' : undefined)} onClick={() => setMobileOpen(false)}>
              {t(`nav.${key}`)}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="tl-nav-right">
        <LanguageSwitcher />
        <Link to={localize('/hediyye-karti')} className="tl-nav-gift-btn">
          🎁 {t('nav.giftCard')}
        </Link>
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
            <a href="#" className="tl-btn-login" onClick={(e) => { e.preventDefault(); openAuth('login'); }}>
              {t('nav.login')}
            </a>
            <a href="#" className="tl-btn-cta" onClick={(e) => { e.preventDefault(); openAuth('register'); }}>
              {t('nav.register')}
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
