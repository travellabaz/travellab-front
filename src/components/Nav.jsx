import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
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

  return (
    <nav className="tl-nav">
      <Link to="/" className="tl-logo" onClick={() => setMobileOpen(false)}>
        <LogoFull className="tl-logo-svg" style={{ height: 26, width: 'auto' }} />
      </Link>
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
