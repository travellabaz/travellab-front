import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { getLocaleFromPathname, buildLocalizedPath } from '../utils/locale';

const SHORT_LABEL = { az: 'AZ', ru: 'RU', en: 'EN' };
const FULL_LABEL = { az: 'Azərbaycan', ru: 'Русский', en: 'English' };

// Dropdown, not an inline pill row — matches the site's own
// trigger+popover pattern (see CountrySelect.jsx's .tl-cal-trigger /
// .tl-cal-popover / .tl-country-option) rather than inventing a new look.
export default function LanguageSwitcher({ className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const location = useLocation();
  const current = getLocaleFromPathname(location.pathname);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className={'tl-lang-switcher' + (className ? ' ' + className : '')} ref={rootRef}>
      <button type="button" className="tl-lang-switcher-trigger" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        🌐 {SHORT_LABEL[current]}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="tl-lang-switcher-popover">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Link
              key={lang}
              to={buildLocalizedPath(location.pathname, lang) + location.search}
              className={'tl-lang-switcher-option' + (lang === current ? ' active' : '')}
              onClick={() => setOpen(false)}
            >
              {FULL_LABEL[lang]}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
