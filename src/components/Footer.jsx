import { Link } from 'react-router-dom';
import LogoFull from './LogoFull';
import FooterSitemap from './FooterSitemap';
import { useModals } from '../context/ModalContext';

// Simple leaf / wave / sun line-icons, matching the Figma footer's
// decorative row (replacing the old hand-copied rainbow/zigzag icons,
// which were a different set entirely).
function LeafIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M8 17V6" stroke="#0C8A46" strokeWidth="1.4" strokeLinecap="round" /><path d="M8 10C8 6 4 4 1 4c0 4 3 6 7 6Z" stroke="#0C8A46" strokeWidth="1.4" strokeLinejoin="round" /><path d="M8 8c0-4 4-6 7-6 0 4-3 6-7 6Z" stroke="#0C8A46" strokeWidth="1.4" strokeLinejoin="round" /></svg>
  );
}

function WaveIcon() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="none"><path d="M1 6c1.8-3.6 3.6-3.6 5.4 0s3.6 3.6 5.4 0 3.6-3.6 5.4 0 3.6 3.6 5.4 0" stroke="#0E2A3D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="#FFF6E6" strokeWidth="1.3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13" stroke="#FFF6E6" strokeWidth="1.3" strokeLinecap="round" /></svg>
  );
}

const WAVE_ICONS = [LeafIcon, WaveIcon, SunIcon, LeafIcon, WaveIcon, SunIcon, LeafIcon];

export default function Footer() {
  const { openPrivacy, openTerms, openAuth } = useModals();
  const year = new Date().getFullYear();

  return (
    <>
    <FooterSitemap />
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
            {WAVE_ICONS.map((Icon, i) => <Icon key={i} />)}
          </div>
          <div className="tl-fw-row tl-fw-row-offset">
            {WAVE_ICONS.slice(0, 5).map((Icon, i) => <Icon key={i} />)}
          </div>
        </div>

        <div className="tl-footer-bottom">
          <span>© {year} Travellab. Bütün hüquqlar qorunur.</span>
          <span>🇦🇿 Bakı, Azərbaycan</span>
        </div>
      </div>
    </footer>
    </>
  );
}
