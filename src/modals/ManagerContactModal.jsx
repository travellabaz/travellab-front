import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModals } from '../context/ModalContext';
import { formatManagerNumber } from '../utils/managers';

// Small popup shown instead of navigating straight to a tel: link on
// desktop (see ModalContext.jsx's openManagerContact for why) — just the
// picked manager's name/number, big enough to read or copy, plus a real
// tel: link for anyone who does want their OS to try dialing it.
export default function ManagerContactModal() {
  const { t } = useTranslation();
  const { managerContactOpen, managerContactManager, closeManagerContact } = useModals();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!managerContactOpen) return undefined;
    setCopied(false);
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') closeManagerContact();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [managerContactOpen, closeManagerContact]);

  if (!managerContactOpen || !managerContactManager) return null;

  const number = formatManagerNumber(managerContactManager.number);

  const copyNumber = () => {
    navigator.clipboard.writeText(number).then(() => setCopied(true));
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeManagerContact();
      }}
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(13,21,32,0.92)',
        backdropFilter: 'blur(8px)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--tl-white)',
          border: '1px solid var(--tl-gray-200)',
          boxShadow: 'var(--tl-shadow)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 360,
          padding: 32,
          position: 'relative',
          textAlign: 'center',
          animation: 'authPop 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both',
        }}
      >
        <button
          onClick={closeManagerContact}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'var(--tl-gray-100)',
            border: 'none',
            borderRadius: 8,
            width: 32,
            height: 32,
            color: 'var(--tl-navy)',
            fontSize: 20,
            cursor: 'pointer',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(4,149,72,0.1)',
            color: 'var(--tl-green)',
            fontFamily: "'Geist Sans', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          {managerContactManager.name.charAt(0)}
        </div>

        <div style={{ fontSize: 12, color: 'var(--tl-gray-400)', marginBottom: 4 }}>{t('common.manager')}</div>
        <div style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 16 }}>
          {managerContactManager.name}
        </div>

        <a
          href={`tel:+${managerContactManager.number}`}
          style={{ display: 'block', fontFamily: "'Geist Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--tl-navy)', textDecoration: 'none', marginBottom: 20, letterSpacing: '0.5px' }}
        >
          {number}
        </a>

        <button
          type="button"
          onClick={copyNumber}
          className="tl-btn-book"
          style={{ border: 'none', cursor: 'pointer', background: copied ? 'var(--tl-green)' : 'var(--tl-gray-100)', color: copied ? '#fff' : 'var(--tl-navy)', width: '100%', justifyContent: 'center' }}
        >
          {copied ? t('common.copied') : t('common.copyNumber')}
        </button>
      </div>
    </div>
  );
}
