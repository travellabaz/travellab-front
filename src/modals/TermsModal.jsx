import { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useModals } from '../context/ModalContext';

export default function TermsModal() {
  const { t } = useTranslation();
  const { termsOpen, closeTerms } = useModals();

  useEffect(() => {
    if (!termsOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') closeTerms();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [termsOpen, closeTerms]);

  if (!termsOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeTerms();
      }}
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(13,21,32,0.92)',
        backdropFilter: 'blur(8px)',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'var(--tl-white)',
          border: '1px solid var(--tl-gray-200)',
          boxShadow: 'var(--tl-shadow)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 720,
          padding: 40,
          position: 'relative',
          margin: '20px auto',
          animation: 'authPop 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both',
        }}
      >
        <button
          onClick={closeTerms}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
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
            display: 'inline-block',
            background: 'rgba(4,149,72,0.1)',
            border: '1px solid rgba(4,149,72,0.25)',
            borderRadius: 100,
            padding: '4px 14px',
            fontSize: 11,
            color: 'var(--tl-green)',
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          {t('terms.badge')}
        </div>
        <h2 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 6, letterSpacing: '-0.5px' }}>
          {t('terms.title')}
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(29,41,57,0.55)', marginBottom: 28, lineHeight: 1.6 }}>
          <Trans
            i18nKey="terms.intro"
            components={{ 1: <a href="https://www.travellab.az" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--tl-green)' }} /> }}
          />
        </p>

        <div className="pv-section">
          <div className="pv-h">{t('terms.s1Title')}</div>
          <ul className="pv-ul">
            <li>{t('terms.s1i1')}</li>
            <li>{t('terms.s1i2')}</li>
            <li>{t('terms.s1i3')}</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">{t('terms.s2Title')}</div>
          <ul className="pv-ul">
            <li>{t('terms.s2i1')}</li>
            <li>{t('terms.s2i2')}</li>
            <li>{t('terms.s2i3')}</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">{t('terms.s3Title')}</div>
          <ul className="pv-ul">
            <li>{t('terms.s3i1')}</li>
            <li>{t('terms.s3i2')}</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">{t('terms.s4Title')}</div>
          <ul className="pv-ul">
            <li>{t('terms.s4i1')}</li>
            <li>{t('terms.s4i2')}</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">{t('terms.s5Title')}</div>
          <ul className="pv-ul">
            <li>{t('terms.s5i1')}</li>
            <li>{t('terms.s5i2')}</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">{t('terms.s6Title')}</div>
          <ul className="pv-ul">
            <li>{t('terms.s6i1')}</li>
            <li>{t('terms.s6i2')}</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">{t('terms.s7Title')}</div>
          <ul className="pv-ul">
            <li>{t('terms.s7i1')}</li>
            <li>{t('terms.s7i2')}</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">{t('terms.s8Title')}</div>
          <ul className="pv-ul">
            <li>{t('terms.s8i1')}</li>
            <li>{t('terms.s8i2')}</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">{t('terms.s9Title')}</div>
          <ul className="pv-ul">
            <li>{t('terms.s9i1')}</li>
            <li>{t('terms.s9i2')}</li>
          </ul>
        </div>

        <div className="pv-section" style={{ marginBottom: 0 }}>
          <div className="pv-h">{t('terms.s10Title')}</div>
          <div className="pv-contact">
            <span style={{ fontSize: 20 }}>📧</span>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(29,41,57,0.5)', marginBottom: 2 }}>{t('terms.s10Desc')}</div>
              <a href="mailto:info@travellab.az">info@travellab.az</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
