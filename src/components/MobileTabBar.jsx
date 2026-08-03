import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';

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
  { to: '/', label: 'Ana səhifə', Icon: HomeIcon, end: true },
  { to: '/hotels', label: 'Otellər', Icon: HotelIcon },
  { to: '/tours', label: 'Turlar', Icon: TourIcon },
  { to: '/labpoint', label: 'Labpoint', Icon: LabpointIcon },
];

export default function MobileTabBar() {
  const { isAuthenticated, profile, logout } = useAuth();
  const { openAuth } = useModals();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <>
      <nav className="tl-tabbar" aria-label="Mobil naviqasiya">
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => 'tl-tabbar-item' + (isActive ? ' active' : '')}
            onClick={() => setAccountOpen(false)}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={'tl-tabbar-item' + (accountOpen ? ' active' : '')}
          onClick={() => (isAuthenticated ? setAccountOpen((o) => !o) : openAuth('login'))}
        >
          {isAuthenticated ? <span className="tl-tabbar-avatar">{profile.initials}</span> : <UserIcon />}
          <span>{isAuthenticated ? 'Hesab' : 'Daxil ol'}</span>
        </button>
      </nav>

      {accountOpen && isAuthenticated && (
        <>
          <div className="tl-tabbar-backdrop" onClick={() => setAccountOpen(false)} />
          <div className="tl-tabbar-sheet">
            <div className="tl-tabbar-sheet-name">{profile.name} {profile.surname}</div>
            <div className="tl-tabbar-sheet-lp">
              <span>Labpoint balansı</span>
              <strong>{profile.points} LP</strong>
            </div>
            <a
              className="tl-tabbar-sheet-logout"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setAccountOpen(false);
                logout();
              }}
            >
              🚪 Çıxış et
            </a>
          </div>
        </>
      )}
    </>
  );
}
