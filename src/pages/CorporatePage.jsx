import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumb';
import { MANAGERS, formatManagerNumber } from '../utils/managers';

const TEAM_SIZES = ['under10', '10to30', '30to100', 'over100'];
const HERO_PHOTOS = ['/images/hero/aurora.jpg', '/images/hero/balloons.jpg', '/images/hero/mosque.jpg', '/images/hero/plane-wing.jpg'];
const SERVICE_KEYS = ['flights', 'hotels', 'tours', 'visa', 'events', 'support'];
const SERVICE_ICONS = { flights: '✈️', hotels: '🏨', tours: '🧳', visa: '🛂', events: '🎤', support: '💬' };
const MESSAGE_MAX = 300;

// Corporate leads go through one specific person (same reasoning as
// GiftCardPage's GIFT_CARD_MANAGER) — handled manually, not the round-robin
// pool the rest of the site uses for tour inquiries.
const CORPORATE_MANAGER = MANAGERS.find((m) => m.name === 'Xəyalə') || MANAGERS[0];

export default function CorporatePage() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState('form'); // 'form' | 'done'
  const [lead, setLead] = useState(null);
  // Same honest-tracking pattern as GiftCardPage/VizaSection — nothing
  // reaches us until the visitor actually presses Send inside WhatsApp.
  const [waOpened, setWaOpened] = useState(null); // null | true | false

  const openWhatsApp = (lead) => {
    const msg =
      t('corporate.waMessage', { name: lead.name, company: lead.company, phone: lead.phone, teamSize: t(`corporate.teamSize.${lead.teamSize}`) }) +
      (lead.email ? t('corporate.waMessageEmail', { email: lead.email }) : '') +
      (lead.message ? t('corporate.waMessageNote', { message: lead.message }) : '');
    const win = window.open('https://wa.me/' + CORPORATE_MANAGER.number + '?text=' + encodeURIComponent(msg), '_blank');
    const opened = !!win;
    setWaOpened(opened);
    return opened;
  };

  const submit = () => {
    setError('');
    if (!name.trim()) return setError(t('corporate.errorName'));
    if (!company.trim()) return setError(t('corporate.errorCompany'));
    if (phone.replace(/\D/g, '').length < 9) return setError(t('corporate.errorPhone'));
    if (!teamSize) return setError(t('corporate.errorTeamSize'));

    const newLead = {
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      teamSize,
      message: message.trim(),
    };

    setLead(newLead);
    setView('done');
    openWhatsApp(newLead);
  };

  const recap = lead
    ? [
        [t('corporate.recapName'), lead.name],
        [t('corporate.recapCompany'), lead.company],
        ...(lead.email ? [[t('corporate.recapEmail'), lead.email]] : []),
        [t('corporate.recapPhone'), lead.phone],
        [t('corporate.recapTeamSize'), t(`corporate.teamSize.${lead.teamSize}`)],
        ...(lead.message ? [[t('corporate.recapMessage'), lead.message]] : []),
      ]
    : null;

  return (
    <main className="tpwl-main tl-corp">
      <section className="tl-page-top">
        <div className="tl-section" style={{ paddingBottom: 0 }}>
          <Breadcrumb
            items={[
              { name: t('breadcrumb.home'), to: '/' },
              { name: t('corporate.breadcrumb') },
            ]}
          />
        </div>
      </section>

      <section className="tl-corp-hero-section">
        <div className="tl-section">
          <div className="tl-corp-hero">
            <div className="tl-corp-hero-text">
              <div className="tl-corp-badge">{t('corporate.badge')}</div>
              <h1 className="tl-corp-title">{t('corporate.title')}</h1>
              <p className="tl-corp-subtitle">{t('corporate.subtitle')}</p>
              <div className="tl-corp-cta-row">
                <a href="#tl-corp-contact" className="tl-corp-btn-primary">{t('corporate.ctaContact')}</a>
                <a href="#tl-corp-services" className="tl-corp-btn-secondary">{t('corporate.ctaLearnMore')}</a>
              </div>
            </div>
            <div className="tl-corp-hero-cards">
              {HERO_PHOTOS.map((src, i) => (
                <div key={src} className={`tl-corp-hero-card tl-corp-hero-card-${i}`} style={{ backgroundImage: `url('${src}')` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="tl-corp-value-section">
        <div className="tl-section">
          <div className="tl-corp-value-grid">
            <div className="tl-corp-value-card">
              <h2>{t('corporate.value1Title')}</h2>
              <p>{t('corporate.value1Desc')}</p>
              <div className="tl-corp-chips">
                {['flights', 'hotels', 'tours', 'visa', 'events', 'transfer'].map((key) => (
                  <span key={key} className="tl-corp-chip">{t(`corporate.chip.${key}`)}</span>
                ))}
              </div>
            </div>
            <div className="tl-corp-value-card tl-corp-value-card-lp">
              <h2>{t('corporate.value2Title')}</h2>
              <p>{t('corporate.value2Desc')}</p>
              <div className="tl-corp-lp-widget">
                <div className="tl-corp-lp-widget-label">LabPoint</div>
                <div className="tl-corp-lp-widget-value">2 500 LP</div>
              </div>
            </div>
          </div>

          <div className="tl-corp-features">
            <div className="tl-corp-feature-card">
              <span>👤</span>
              <h3>{t('corporate.feature1Title')}</h3>
              <p>{t('corporate.feature1Desc')}</p>
            </div>
            <div className="tl-corp-feature-card">
              <span>💳</span>
              <h3>{t('corporate.feature2Title')}</h3>
              <p>{t('corporate.feature2Desc')}</p>
            </div>
            <div className="tl-corp-feature-card">
              <span>📊</span>
              <h3>{t('corporate.feature3Title')}</h3>
              <p>{t('corporate.feature3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="tl-corp-services" className="tl-corp-services-section">
        <div className="tl-section">
          <div className="tl-corp-section-header-center">
            <h2 className="tl-corp-section-title">{t('corporate.servicesTitle')}</h2>
            <p className="tl-corp-section-subtitle">{t('corporate.servicesSubtitle')}</p>
          </div>
          <div className="tl-corp-services-grid">
            {SERVICE_KEYS.map((key) => (
              <div key={key} className="tl-corp-service-card">
                <div className="tl-corp-service-icon">{SERVICE_ICONS[key]}</div>
                <h3>{t(`corporate.service.${key}.title`)}</h3>
                <p>{t(`corporate.service.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tl-corp-contact" className="tl-corp-contact-section">
        <div className="tl-section">
          <div className="tl-corp-contact-card">
            <div className="tl-corp-section-header-center">
              <h2 className="tl-corp-section-title">{t('corporate.contactTitle')}</h2>
              <p className="tl-corp-section-subtitle">{t('corporate.contactSubtitle')}</p>
            </div>

            {error && <div className="am-msg er show">{error}</div>}

            {view === 'form' ? (
              <div className="tl-corp-form">
                <div className="tl-corp-row">
                  <div className="tl-corp-field">
                    <label htmlFor="corp-name">{t('corporate.nameLabel')} <span className="tl-viza-req">*</span></label>
                    <input id="corp-name" className="tl-corp-input" type="text" placeholder={t('corporate.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="tl-corp-field">
                    <label htmlFor="corp-company">{t('corporate.companyLabel')} <span className="tl-viza-req">*</span></label>
                    <input id="corp-company" className="tl-corp-input" type="text" placeholder={t('corporate.companyPlaceholder')} value={company} onChange={(e) => setCompany(e.target.value)} />
                  </div>
                </div>

                <div className="tl-corp-row">
                  <div className="tl-corp-field">
                    <label htmlFor="corp-email">{t('corporate.emailLabel')}</label>
                    <input id="corp-email" className="tl-corp-input" type="email" placeholder={t('corporate.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="tl-corp-field">
                    <label htmlFor="corp-phone">{t('corporate.phoneLabel')} <span className="tl-viza-req">*</span></label>
                    <input id="corp-phone" className="tl-corp-input" type="tel" placeholder={t('corporate.phonePlaceholder')} autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="tl-corp-field">
                  <label>{t('corporate.teamSizeLabel')} <span className="tl-viza-req">*</span></label>
                  <div className="tl-corp-radio-row">
                    {TEAM_SIZES.map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={'tl-corp-radio-pill' + (teamSize === key ? ' active' : '')}
                        onClick={() => setTeamSize(key)}
                      >
                        {t(`corporate.teamSize.${key}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tl-corp-field">
                  <label htmlFor="corp-message">{t('corporate.messageLabel')}</label>
                  <textarea
                    id="corp-message"
                    className="tl-corp-input tl-corp-textarea"
                    placeholder={t('corporate.messagePlaceholder')}
                    value={message}
                    maxLength={MESSAGE_MAX}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="tl-corp-char-count">{message.length}/{MESSAGE_MAX}</div>
                </div>

                <button className="tl-corp-submit" type="button" onClick={submit}>{t('corporate.submit')} →</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
                {waOpened === false ? (
                  <>
                    <div className="tl-viza-done-ico tl-viza-done-ico-warn">!</div>
                    <h3 className="tl-corp-done-title">{t('corporate.waNotOpened')}</h3>
                    <p className="tl-corp-done-desc">{t('corporate.waNotOpenedDesc')}</p>
                  </>
                ) : (
                  <>
                    <div className="tl-viza-done-ico">✓</div>
                    <h3 className="tl-corp-done-title">{t('corporate.waReady')}</h3>
                    <p className="tl-corp-done-desc">{t('corporate.waReadyDesc')}</p>
                  </>
                )}
                <div className="tl-viza-recap">
                  {recap?.map(([label, value]) => (
                    <div key={label}>
                      <i>{label}</i>
                      <b>{value}</b>
                    </div>
                  ))}
                  <div>
                    <i>{t('corporate.recapManager')}</i>
                    <b>{CORPORATE_MANAGER.name} — {formatManagerNumber(CORPORATE_MANAGER.number)}</b>
                  </div>
                </div>
                <button className="tl-viza-wa" type="button" onClick={() => lead && openWhatsApp(lead)}>
                  {waOpened === false ? t('corporate.waOpen') : t('corporate.waReopen')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
