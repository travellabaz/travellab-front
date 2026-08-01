import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import LogoFull from './LogoFull';
import NavProfile from './NavProfile';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';

const NAV_LINKS = [
  { to: '/search', label: 'Uçuşlar' },
  { to: '/hotels', label: 'Otellər' },
  { to: '/tours', label: 'Turlar' },
  { to: '/labpoint', label: 'Labpoint' },
  { to: '/events', label: 'Tədbirlər' },
  { to: '/viza', label: 'Viza' },
];

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { openAuth } = useModals();
  const location = useLocation();

  const handleLogoClick = () => {
    setMobileOpen(false);
    // Navigating to "/" while already there is a no-op for the router —
    // useScrollTopOnRouteChange only fires on an actual pathname change —
    // so scroll up explicitly here to cover the already-on-home case.
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="tl-nav">
      <div className="tl-nav-brand">
        <Link to="/" className="tl-logo" onClick={handleLogoClick}>
          <LogoFull className="tl-logo-svg" style={{ height: 26, width: 'auto' }} />
        </Link>
        <span className="tl-nav-divider" aria-hidden="true" />
        <img
          src="/images/partners/aztaa-logo.jpeg"
          alt="Azərbaycan Turizm Agentlikləri Assosiasiyası üzvü"
          className="tl-nav-membership-logo"
        />
      </div>
      <ul className={'tl-nav-links' + (mobileOpen ? ' tl-nav-open' : '')}>
        {NAV_LINKS.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} className={({ isActive }) => (isActive ? 'active' : undefined)} onClick={() => setMobileOpen(false)}>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="tl-nav-right">
        <button
          type="button"
          className="tl-nav-burger"
          aria-label="Menyu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span />
        </button>
        {isAuthenticated ? (
          <NavProfile />
        ) : (
          <>
            <a href="#" className="tl-btn-login" onClick={(e) => { e.preventDefault(); openAuth('login'); }}>
              Daxil ol
            </a>
            <a href="#" className="tl-btn-cta" onClick={(e) => { e.preventDefault(); openAuth('register'); }}>
              Qeydiyyat
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
