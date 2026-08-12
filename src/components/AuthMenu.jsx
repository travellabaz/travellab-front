import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModals } from '../context/ModalContext';

// Mobile-only: collapses the separate "Daxil ol" / "Qeydiyyat" buttons
// (which fit fine on desktop) into one trigger, so the top bar doesn't
// have to fit logo + language switcher + burger + two auth buttons in a
// few hundred px. Same trigger+popover shape as LanguageSwitcher.jsx.
export default function AuthMenu({ className, onOpen }) {
  const { t } = useTranslation();
  const { openAuth } = useModals();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const select = (tab) => {
    setOpen(false);
    openAuth(tab);
  };

  return (
    <div className={'tl-auth-menu' + (className ? ' ' + className : '')} ref={rootRef}>
      <button
        type="button"
        className="tl-auth-menu-trigger"
        onClick={() => setOpen((o) => {
          if (!o) onOpen?.();
          return !o;
        })}
        aria-expanded={open}
        aria-label={t('nav.account')}
      >
        👤
      </button>

      {open && (
        <div className="tl-auth-menu-popover">
          <button type="button" className="tl-auth-menu-option" onClick={() => select('login')}>
            {t('nav.login')}
          </button>
          <button type="button" className="tl-auth-menu-option tl-auth-menu-option-cta" onClick={() => select('register')}>
            {t('nav.register')}
          </button>
        </div>
      )}
    </div>
  );
}
