import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function NavProfile() {
  const { profile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  if (!profile) return null;

  const copyReferral = () => {
    navigator.clipboard.writeText(profile.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative' }} ref={rootRef}>
      <button type="button" className="nav-profile-btn" onClick={() => setOpen((o) => !o)}>
        <div className="nav-avatar">{profile.initials}</div>
        <span>{profile.name || 'Profil'}</span>
        <span className="nav-lp-badge">{profile.points} LP</span>
      </button>
      <div className={'nav-dd' + (open ? ' open' : '')}>
        <div className="nav-dd-hdr">
          <div className="nav-dd-name">{profile.name} {profile.surname}</div>
          <div className="nav-dd-ph">{profile.phone ? '+' + profile.phone : ''}</div>
          <div className="nav-dd-ph" style={{ marginTop: 2 }}>{profile.mail}</div>
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
            <div style={{ fontSize: 10, color: 'rgba(14,42,61,0.5)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
              🎁 Dosta dəvət linki
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
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
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
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? '✓' : 'Kopyala'}
              </button>
            </div>
          </div>
        )}
        <div className="nav-dd-sep" />
        <a
          className="nav-dd-item nav-dd-out"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}
        >
          🚪 Çıxış
        </a>
      </div>
    </div>
  );
}
