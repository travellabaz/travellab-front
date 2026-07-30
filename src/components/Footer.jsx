import { Link } from 'react-router-dom';
import LogoFull from './LogoFull';
import { useModals } from '../context/ModalContext';

export default function Footer() {
  const { openPrivacy, openTerms, openAuth } = useModals();
  const year = new Date().getFullYear();

  return (
    <footer className="tl-footer">
      <div className="tl-footer-inner">
        <div className="tl-footer-top">
          <div className="tl-footer-brand">
            <a href="/" className="tl-logo" style={{ marginBottom: 0 }}>
              <LogoFull style={{ height: 24, width: 'auto' }} />
            </a>
            <p>Azərbaycanın aparıcı travel platforması. Biletlər, otellər, turlar — hamısı bir yerdə.</p>
          </div>

          <div className="tl-footer-cols">
            <div className="tl-footer-col">
              <div className="tl-footer-col-title">Şirkət</div>
              <Link to="/about">Haqqımızda</Link>
              <Link to="/blog">Xəbərlər</Link>
              <Link to="/blog">Bloqlar</Link>
              <a href="mailto:info@travellab.az">Yardım</a>
            </div>
            <div className="tl-footer-col">
              <div className="tl-footer-col-title">Hesab</div>
              <a href="#" onClick={(e) => { e.preventDefault(); openAuth('login'); }}>Daxil ol</a>
              <a href="#" onClick={(e) => { e.preventDefault(); openAuth('register'); }}>Qeydiyyat</a>
            </div>
            <div className="tl-footer-col">
              <div className="tl-footer-col-title">Hüquqi</div>
              <a href="#" onClick={(e) => { e.preventDefault(); openPrivacy(); }}>Məxfilik Siyasəti</a>
              <a href="#" onClick={(e) => { e.preventDefault(); openTerms(); }}>Şərtlər və Qaydalar</a>
              <a href="mailto:info@travellab.az">Əlaqə</a>
            </div>
          </div>
        </div>

        <div className="tl-footer-contact">
          <div>
            <div className="tl-footer-contact-label">Mail ünvanı</div>
            <div className="tl-footer-contact-value">
              <a href="mailto:info@travellab.az">info@travellab.az</a>
            </div>
          </div>
          <div>
            <div className="tl-footer-contact-label">Ünvan</div>
            <div className="tl-footer-contact-value">40 Cəfər Cabbarlı küçəsi, Bakı</div>
          </div>
          <div>
            <div className="tl-footer-contact-label">Sosial şəbəkələr</div>
            <div className="tl-footer-social">
              <a href="https://www.facebook.com/travellab.az/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.17 2.1 15.95 2 14.66 2 11.98 2 10 3.66 10 6.7v2.8H7v4h3V22h4v-8.5z" /></svg>
              </a>
              <a href="https://www.linkedin.com/company/travellab-azerbaijan/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM3.4 8.75h3.1V21H3.4V8.75zm6.2 0h2.97v1.68h.04c.41-.78 1.43-1.6 2.94-1.6 3.14 0 3.72 2.07 3.72 4.76V21h-3.1v-5.44c0-1.3-.02-2.97-1.81-2.97-1.82 0-2.1 1.42-2.1 2.88V21H9.6V8.75z" /></svg>
              </a>
              <a href="https://www.instagram.com/travellab.az/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>
              </a>
              <a href="https://www.tiktok.com/@travellab.az" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82c-.6-.66-.96-1.5-1-2.42h-3.14v13.3c0 1.4-1.13 2.53-2.53 2.53a2.53 2.53 0 0 1-.98-4.87 2.53 2.53 0 0 1 1.68-.13V11.1a5.7 5.7 0 0 0-.7-.05A5.73 5.73 0 1 0 15.6 16.7V9.02a8.16 8.16 0 0 0 4.75 1.52V7.4a4.85 4.85 0 0 1-3.75-1.58z" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="tl-footer-waves" aria-hidden="true">
          <div className="tl-fw-row">
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M2 12a8 8 0 0 1 16 0" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M4.3 12a5.7 5.7 0 0 1 11.4 0" stroke="#FFF6E6" strokeWidth="1.1" strokeLinecap="round" /><path d="M10 1.6v2" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M5.6 2.9l1.3 1.4" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M14.4 2.9l-1.3 1.4" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M2.6 6.4l1.6 1" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M17.4 6.4l-1.6 1" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /></svg>
            <svg width="24" height="13" viewBox="0 0 24 13" fill="none"><path d="M1 7c2.4-4.8 4.8-4.8 7.2 0s4.8 4.8 7.2 0 4.8-4.8 7.2 0" stroke="#0E2A3D" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <svg width="13" height="16" viewBox="0 0 13 16" fill="none"><path d="M2.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0E2A3D" strokeWidth="1.3" strokeLinecap="round" /><path d="M6.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0E2A3D" strokeWidth="1.3" strokeLinecap="round" /><path d="M10.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0E2A3D" strokeWidth="1.3" strokeLinecap="round" /></svg>
            <svg width="18" height="11" viewBox="0 0 18 11" fill="none"><path d="M1 1.5h16M1 5.5h16M1 9.5h16" stroke="#0C8A46" strokeWidth="1.7" strokeLinecap="round" /></svg>
            <svg width="13" height="16" viewBox="0 0 13 16" fill="none"><path d="M2.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0E2A3D" strokeWidth="1.3" strokeLinecap="round" /><path d="M6.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0E2A3D" strokeWidth="1.3" strokeLinecap="round" /><path d="M10.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0E2A3D" strokeWidth="1.3" strokeLinecap="round" /></svg>
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M2 12a8 8 0 0 1 16 0" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M4.3 12a5.7 5.7 0 0 1 11.4 0" stroke="#FFF6E6" strokeWidth="1.1" strokeLinecap="round" /><path d="M10 1.6v2" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M5.6 2.9l1.3 1.4" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M14.4 2.9l-1.3 1.4" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M2.6 6.4l1.6 1" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M17.4 6.4l-1.6 1" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /></svg>
            <svg width="18" height="11" viewBox="0 0 18 11" fill="none"><path d="M1 1.5h16M1 5.5h16M1 9.5h16" stroke="#0C8A46" strokeWidth="1.7" strokeLinecap="round" /></svg>
            <svg width="13" height="16" viewBox="0 0 13 16" fill="none"><path d="M2.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0E2A3D" strokeWidth="1.3" strokeLinecap="round" /><path d="M6.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0E2A3D" strokeWidth="1.3" strokeLinecap="round" /><path d="M10.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0E2A3D" strokeWidth="1.3" strokeLinecap="round" /></svg>
          </div>
          <div className="tl-fw-row tl-fw-row-offset">
            <svg width="18" height="11" viewBox="0 0 18 11" fill="none"><path d="M1 1.5h16M1 5.5h16M1 9.5h16" stroke="#0C8A46" strokeWidth="1.7" strokeLinecap="round" /></svg>
            <svg width="13" height="16" viewBox="0 0 13 16" fill="none"><path d="M2.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0C75BA" strokeWidth="1.3" strokeLinecap="round" /><path d="M6.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0C75BA" strokeWidth="1.3" strokeLinecap="round" /></svg>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 6.5c.8-2.4 2.4-2.4 3.2-.8s1.6 3.2 2.4 1.6 2.4-2.4 4-.8" stroke="#0E2A3D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <svg width="18" height="11" viewBox="0 0 18 11" fill="none"><path d="M1 1.5h16M1 5.5h16M1 9.5h16" stroke="#0C8A46" strokeWidth="1.7" strokeLinecap="round" /></svg>
            <svg width="13" height="16" viewBox="0 0 13 16" fill="none"><path d="M2.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0C75BA" strokeWidth="1.3" strokeLinecap="round" /><path d="M6.5 1c-1.6 1.6 1.6 3.2 0 4.8s1.6 3.2 0 4.8" stroke="#0C75BA" strokeWidth="1.3" strokeLinecap="round" /></svg>
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M2 12a8 8 0 0 1 16 0" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M4.3 12a5.7 5.7 0 0 1 11.4 0" stroke="#FFF6E6" strokeWidth="1.1" strokeLinecap="round" /><path d="M10 1.6v2" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M5.6 2.9l1.3 1.4" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M14.4 2.9l-1.3 1.4" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M2.6 6.4l1.6 1" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /><path d="M17.4 6.4l-1.6 1" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /></svg>
          </div>
        </div>

        <div className="tl-footer-bottom">
          <span>© {year} Travellab. Bütün hüquqlar qorunur.</span>
          <span>🇦🇿 Bakı, Azərbaycan</span>
        </div>
      </div>
    </footer>
  );
}
