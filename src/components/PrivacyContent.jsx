import { Trans, useTranslation } from 'react-i18next';

// The privacy policy text: shown in the footer's modal and on its own page /privacy,
// the address given to Meta for the Instagram app
export default function PrivacyContent() {
  const { t } = useTranslation();

  return (
    <>
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
      {t('privacy.badge')}
    </div>
    <h2 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 6, letterSpacing: '-0.5px' }}>
      {t('privacy.title')}
    </h2>
    <p style={{ fontSize: 13, color: 'rgba(29,41,57,0.55)', marginBottom: 28, lineHeight: 1.6 }}>
      <Trans
        i18nKey="privacy.intro"
        components={{ 1: <a href="https://www.travellab.az" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--tl-green)' }} /> }}
      />
    </p>

    <div className="pv-section">
      <div className="pv-h">{t('privacy.s1Title')}</div>
      <ul className="pv-ul">
        <li>{t('privacy.s1i1')}</li>
        <li>{t('privacy.s1i2')}</li>
        <li>{t('privacy.s1i3')}</li>
        <li>{t('privacy.s1i4')}</li>
        <li>{t('privacy.s1i5')}</li>
        <li>{t('privacy.s1i6')}</li>
      </ul>
    </div>

    <div className="pv-section">
      <div className="pv-h">{t('privacy.s2Title')}</div>
      <p className="pv-p"><strong style={{ color: 'var(--tl-navy)' }}>{t('privacy.s2Personal')}</strong></p>
      <ul className="pv-ul">
        <li>{t('privacy.s2i1')}</li>
        <li>{t('privacy.s2i2')}</li>
        <li>{t('privacy.s2i3')}</li>
        <li>{t('privacy.s2i4')}</li>
        <li>{t('privacy.s2i5')}</li>
      </ul>
      <div className="pv-note">{t('privacy.s2Note')}</div>
      <p className="pv-p" style={{ marginTop: 12 }}>
        <strong style={{ color: 'var(--tl-navy)' }}>{t('privacy.s2Usage')}</strong> {t('privacy.s2UsageDesc')}
      </p>
    </div>

    <div className="pv-section">
      <div className="pv-h">{t('privacy.s3Title')}</div>
      <ul className="pv-ul">
        <li>{t('privacy.s3i1')}</li>
        <li>{t('privacy.s3i2')}</li>
        <li>{t('privacy.s3i3')}</li>
        <li>{t('privacy.s3i4')}</li>
        <li>{t('privacy.s3i5')}</li>
      </ul>
    </div>

    <div className="pv-section">
      <div className="pv-h">{t('privacy.s4Title')}</div>
      <p className="pv-p">{t('privacy.s4Desc')}</p>
    </div>

    <div className="pv-section">
      <div className="pv-h">{t('privacy.s5Title')}</div>
      <p className="pv-p">{t('privacy.s5Desc')}</p>
    </div>

    <div className="pv-section">
      <div className="pv-h">{t('privacy.s6Title')}</div>
      <p className="pv-p">{t('privacy.s6Desc')}</p>
    </div>

    <div className="pv-section">
      <div className="pv-h">{t('privacy.s9Title')}</div>
      <p className="pv-p">{t('privacy.s9Desc')}</p>
      <p className="pv-p" style={{ marginTop: 12 }}>
        <strong style={{ color: 'var(--tl-navy)' }}>{t('privacy.s9Deletion')}</strong> {t('privacy.s9DeletionDesc')}
      </p>
    </div>

    <div className="pv-section">
      <div className="pv-h">{t('privacy.s7Title')}</div>
      <p className="pv-p">{t('privacy.s7Desc')}</p>
    </div>

    <div className="pv-section" style={{ marginBottom: 0 }}>
      <div className="pv-h">{t('privacy.s8Title')}</div>
      <div className="pv-contact">
        <span style={{ fontSize: 20 }}>📧</span>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(29,41,57,0.5)', marginBottom: 2 }}>{t('privacy.s8Desc')}</div>
          <a href="mailto:info@travellab.az">info@travellab.az</a>
        </div>
      </div>
    </div>
    </>
  );
}
