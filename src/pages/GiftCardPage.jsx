import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumb';
import SeoBodyText from '../components/SeoBodyText';
import { MANAGERS, formatManagerNumber } from '../utils/managers';

const AMOUNT_PRESETS = [100, 200, 300, 500, 1000];
const MESSAGE_MAX = 200;
const MAX_AMOUNT = 1000000;

// Gift cards go through one specific person, not the round-robin pool the
// rest of the site uses (see utils/managers.js) — Travellab handles these
// manually rather than via a real checkout, so there's one owner for it.
const GIFT_CARD_MANAGER = MANAGERS.find((m) => m.name === 'Xəyalə') || MANAGERS[0];

// Real designed assets (not a CSS approximation) — the two-card scene for
// the big hero spot, the single-card crop for the small "Kart önizləməsi"
// box, matching what each is actually sized for.
function GiftCardHeroImage() {
  return (
    <div className="tl-gift-visual">
      <img src="/images/gift-card/hero.png" alt="Travellab" />
    </div>
  );
}

// The static preview doubles as a poster for the promo video — clicking it
// opens the video full-screen with sound, rather than autoplaying it muted
// in this small box (the clip is a ~29s narrated ad with burned-in
// captions, not a silent loop, so it needs to be watched intentionally).
function GiftCardPreviewImage() {
  const { t } = useTranslation();
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    if (!videoOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setVideoOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [videoOpen]);

  return (
    <>
      <button
        type="button"
        className="tl-gift-visual tl-gift-visual-preview tl-gift-visual-video-trigger"
        onClick={() => setVideoOpen(true)}
        aria-label={t('giftCard.previewPlayVideo')}
      >
        <img src="/images/gift-card/preview.png" alt="Travellab" />
        <span className="tl-gift-play-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
      </button>

      {videoOpen &&
        createPortal(
          <div className="tl-gift-video-overlay" onClick={() => setVideoOpen(false)}>
            <button
              type="button"
              className="tl-gift-video-close"
              onClick={() => setVideoOpen(false)}
              aria-label={t('giftCard.previewCloseVideo')}
            >
              ✕
            </button>
            <video
              className="tl-gift-video-player"
              src="/videos/hediyye-karti.mp4"
              poster="/images/gift-card/preview.png"
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </>
  );
}

export default function GiftCardPage() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState('form'); // 'form' | 'done'
  const [lead, setLead] = useState(null);
  // Same honest-tracking pattern as VizaSection: nothing reaches us until
  // the visitor actually presses Send inside WhatsApp, so track whether
  // the popup really opened instead of assuming success.
  const [waOpened, setWaOpened] = useState(null); // null | true | false

  const selectPreset = (value) => {
    setAmount(value);
    setCustomAmount('');
  };

  const changeCustomAmount = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    const value = digits && Number(digits) > MAX_AMOUNT ? String(MAX_AMOUNT) : digits;
    setCustomAmount(value);
    if (value) setAmount(Number(value));
  };

  const openWhatsApp = (lead) => {
    const msg =
      t('giftCard.waMessage', { amount: lead.amount, sender: lead.senderName, recipient: lead.recipientName, phone: lead.phone }) +
      (lead.message ? t('giftCard.waMessageNote', { message: lead.message }) : '');
    const win = window.open('https://wa.me/' + GIFT_CARD_MANAGER.number + '?text=' + encodeURIComponent(msg), '_blank');
    const opened = !!win;
    setWaOpened(opened);
    return opened;
  };

  const submit = () => {
    setError('');
    if (!amount || amount <= 0) return setError(t('giftCard.errorAmount'));
    if (!senderName.trim()) return setError(t('giftCard.errorSender'));
    if (!recipientName.trim()) return setError(t('giftCard.errorRecipient'));
    if (phone.replace(/\D/g, '').length < 9) return setError(t('giftCard.errorPhone'));

    const newLead = {
      amount,
      senderName: senderName.trim(),
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      message: message.trim(),
    };

    setLead(newLead);
    setView('done');

    // Jump straight to WhatsApp — no extra click needed. Must stay
    // synchronous with the click so the browser doesn't block the popup.
    openWhatsApp(newLead);
  };

  const recap = lead
    ? [
        [t('giftCard.recapAmount'), `${lead.amount} ₼`],
        [t('giftCard.recapSender'), lead.senderName],
        [t('giftCard.recapRecipient'), lead.recipientName],
        [t('giftCard.recapPhone'), lead.phone],
        ...(lead.message ? [[t('giftCard.recapMessage'), lead.message]] : []),
      ]
    : null;

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section" style={{ paddingBottom: 0 }}>
          <Breadcrumb
            items={[
              { name: t('breadcrumb.home'), to: '/' },
              { name: t('giftCard.breadcrumb') },
            ]}
          />
        </div>
      </section>

      <section>
        <div className="tl-section" style={{ paddingTop: 12 }}>
          <div className="tl-gift-hero">
            <div>
              <div className="tl-tag">{t('giftCard.tag')}</div>
              <h1 className="tl-title">{t('giftCard.title')}</h1>
              <p className="tl-gift-hero-sub">{t('giftCard.subtitle')}</p>
              <div className="tl-gift-features">
                <div className="tl-gift-feature">
                  <span>🎁</span>
                  <p>{t('giftCard.feat1')}</p>
                </div>
                <div className="tl-gift-feature">
                  <span>⏳</span>
                  <p>{t('giftCard.feat2')}</p>
                </div>
                <div className="tl-gift-feature">
                  <span>💬</span>
                  <p>{t('giftCard.feat3')}</p>
                </div>
                <div className="tl-gift-feature">
                  <span>📞</span>
                  <p>{t('giftCard.feat4')}</p>
                </div>
              </div>
            </div>
            <GiftCardHeroImage />
          </div>

          <div className="tl-gift-form-card">
            {error && <div className="am-msg er show">{error}</div>}

            {view === 'form' ? (
              <div className="tl-gift-form-grid">
                <div>
                  <div className="tl-viza-field">
                    <label>{t('giftCard.amountLabel')}</label>
                    <div className="tl-gift-amounts">
                      {AMOUNT_PRESETS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={'tl-gift-amount-pill' + (amount === value && !customAmount ? ' active' : '')}
                          onClick={() => selectPreset(value)}
                        >
                          {value} ₼
                        </button>
                      ))}
                      <input
                        className={'tl-gift-amount-pill tl-gift-amount-custom' + (customAmount ? ' active' : '')}
                        type="text"
                        inputMode="numeric"
                        placeholder={t('giftCard.customAmount')}
                        aria-label={t('giftCard.customAmount')}
                        value={customAmount}
                        onChange={changeCustomAmount}
                      />
                    </div>
                  </div>

                  <div className="tl-viza-row">
                    <div className="tl-viza-field">
                      <label htmlFor="gift-sender">{t('giftCard.senderLabel')} <span className="tl-viza-req">*</span></label>
                      <input id="gift-sender" className="tl-viza-input" type="text" placeholder={t('giftCard.senderPlaceholder')} value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                    </div>
                    <div className="tl-viza-field">
                      <label htmlFor="gift-recipient">{t('giftCard.recipientLabel')} <span className="tl-viza-req">*</span></label>
                      <input id="gift-recipient" className="tl-viza-input" type="text" placeholder={t('giftCard.recipientPlaceholder')} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                    </div>
                  </div>

                  <div className="tl-viza-field">
                    <label htmlFor="gift-phone">{t('giftCard.phoneLabel')} <span className="tl-viza-req">*</span></label>
                    <input id="gift-phone" className="tl-viza-input" type="tel" placeholder={t('giftCard.phonePlaceholder')} autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  <div className="tl-viza-field">
                    <label htmlFor="gift-message">{t('giftCard.messageLabel')}</label>
                    <textarea
                      id="gift-message"
                      className="tl-viza-input tl-viza-textarea"
                      placeholder={t('giftCard.messagePlaceholder')}
                      value={message}
                      maxLength={MESSAGE_MAX}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <div className="tl-gift-char-count">{message.length}/{MESSAGE_MAX}</div>
                  </div>

                  <button className="tl-viza-submit" type="button" onClick={submit}>{t('giftCard.submit')}</button>
                </div>

                <div className="tl-gift-preview">
                  <div className="tl-gift-preview-title">{t('giftCard.previewTitle')}</div>
                  <GiftCardPreviewImage />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
                {waOpened === false ? (
                  <>
                    <div className="tl-viza-done-ico tl-viza-done-ico-warn">!</div>
                    <h3 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 8 }}>
                      {t('giftCard.waNotOpened')}
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', lineHeight: 1.6, marginBottom: 20 }}>
                      {t('giftCard.waNotOpenedDesc')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="tl-viza-done-ico">✓</div>
                    <h3 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 8 }}>
                      {t('giftCard.waReady')}
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', lineHeight: 1.6, marginBottom: 20 }}>
                      {t('giftCard.waReadyDesc')}
                    </p>
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
                    <i>{t('giftCard.recapManager')}</i>
                    <b>{GIFT_CARD_MANAGER.name} — {formatManagerNumber(GIFT_CARD_MANAGER.number)}</b>
                  </div>
                </div>
                <button className="tl-viza-wa" type="button" onClick={() => lead && openWhatsApp(lead)}>
                  {waOpened === false ? t('giftCard.waOpen') : t('giftCard.waReopen')}
                </button>
              </div>
            )}
          </div>

          <SeoBodyText>
            <p>{t('giftCard.seoP1')}</p>
            <p>{t('giftCard.seoP2')}</p>
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
