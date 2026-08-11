import { useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import SeoBodyText from '../components/SeoBodyText';
import { MANAGERS, formatManagerNumber } from '../utils/managers';

const AMOUNT_PRESETS = [100, 200, 300, 500, 1000];
const MESSAGE_MAX = 200;

// Gift cards go through one specific person, not the round-robin pool the
// rest of the site uses (see utils/managers.js) — Travellab handles these
// manually rather than via a real checkout, so there's one owner for it.
const GIFT_CARD_MANAGER = MANAGERS.find((m) => m.name === 'Xəyalə') || MANAGERS[0];

// Static illustration, not tied to form state — same graphic used at both
// hero size and the small "Kart önizləməsi" size, scaled purely by its
// container via cqw units (see .tl-gift-visual-stage) rather than two
// separate size variants.
function GiftCardVisual() {
  return (
    <div className="tl-gift-visual" aria-hidden="true">
      <div className="tl-gift-visual-stage">
        <span className="tl-gift-doodle tl-gift-doodle-1">✦</span>
        <span className="tl-gift-doodle tl-gift-doodle-2">✈</span>
        <span className="tl-gift-doodle tl-gift-doodle-3">〜</span>
        <span className="tl-gift-doodle tl-gift-doodle-4">✦</span>
        <span className="tl-gift-doodle tl-gift-doodle-5">〜</span>

        <div className="tl-gift-card-back">
          <span className="tl-gift-ribbon-bow">🎀</span>
          <span className="tl-gift-card-back-text">Hədiyyə<br />Kartı</span>
          <span className="tl-gift-card-back-tag">travellab</span>
        </div>

        <div className="tl-gift-card-front">
          <span className="tl-gift-card-front-brand">travellab</span>
          <span className="tl-gift-ribbon-cross tl-gift-ribbon-cross-a" />
          <span className="tl-gift-ribbon-cross tl-gift-ribbon-cross-b" />
          <span className="tl-gift-card-front-code">GFT-2031000</span>
        </div>

        <div className="tl-gift-badge">
          <span>❤️</span> Sevdiklərinizə ən gözəl səyahət hədiyyəsi!
        </div>
      </div>
    </div>
  );
}

export default function GiftCardPage() {
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
    const value = e.target.value.replace(/\D/g, '');
    setCustomAmount(value);
    if (value) setAmount(Number(value));
  };

  const openWhatsApp = (lead) => {
    const msg =
      'Salam! Travellab Hədiyyə Kartı sifariş etmək istəyirəm.\n' +
      'Məbləğ: ' + lead.amount + ' ₼\n' +
      'Göndərən: ' + lead.senderName + '\n' +
      'Qəbul edən: ' + lead.recipientName + '\n' +
      'Telefon: ' + lead.phone +
      (lead.message ? '\nMesaj: ' + lead.message : '');
    const win = window.open('https://wa.me/' + GIFT_CARD_MANAGER.number + '?text=' + encodeURIComponent(msg), '_blank');
    const opened = !!win;
    setWaOpened(opened);
    return opened;
  };

  const submit = () => {
    setError('');
    if (!amount || amount <= 0) return setError('Məbləği seçin.');
    if (!senderName.trim()) return setError('Göndərən adını yazın.');
    if (!recipientName.trim()) return setError('Qəbul edən adını yazın.');
    if (phone.replace(/\D/g, '').length < 9) return setError('Telefon nömrəsini düzgün yazın.');

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
        ['Məbləğ', `${lead.amount} ₼`],
        ['Göndərən', lead.senderName],
        ['Qəbul edən', lead.recipientName],
        ['Telefon', lead.phone],
        ...(lead.message ? [['Mesaj', lead.message]] : []),
      ]
    : null;

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section" style={{ paddingBottom: 0 }}>
          <Breadcrumb
            items={[
              { name: 'Ana səhifə', to: '/' },
              { name: 'Hədiyyə Kartı' },
            ]}
          />
        </div>
      </section>

      <section>
        <div className="tl-section">
          <div className="tl-gift-hero">
            <div>
              <div className="tl-tag">Hədiyyə edin, xatirə qazandırın!</div>
              <h1 className="tl-title">Travellab Hədiyyə Kartı</h1>
              <p className="tl-gift-hero-sub">
                Sevdiklərinizə səyahət azadlığı hədiyyə edin. Uçuş, otel, tur və daha çox xidmət üçün keçərlidir.
              </p>
              <div className="tl-gift-features">
                <div className="tl-gift-feature">
                  <span>🎁</span>
                  <p>Bütün xidmətlər üçün keçərlidir</p>
                </div>
                <div className="tl-gift-feature">
                  <span>⏳</span>
                  <p>1 il müddətinə etibarlıdır</p>
                </div>
                <div className="tl-gift-feature">
                  <span>💬</span>
                  <p>WhatsApp ilə sürətli müraciət</p>
                </div>
                <div className="tl-gift-feature">
                  <span>📞</span>
                  <p>Menecerimiz sizinlə əlaqə saxlayır</p>
                </div>
              </div>
            </div>
            <GiftCardVisual />
          </div>

          <div className="tl-gift-form-card">
            {error && <div className="am-msg er show">{error}</div>}

            {view === 'form' ? (
              <div className="tl-gift-form-grid">
                <div>
                  <div className="tl-viza-field">
                    <label>Məbləğ seçin</label>
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
                        placeholder="Digər məbləğ"
                        aria-label="Digər məbləğ"
                        value={customAmount}
                        onChange={changeCustomAmount}
                      />
                    </div>
                  </div>

                  <div className="tl-viza-row">
                    <div className="tl-viza-field">
                      <label htmlFor="gift-sender">Göndərən adı <span className="tl-viza-req">*</span></label>
                      <input id="gift-sender" className="tl-viza-input" type="text" placeholder="Məs: Elnur" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                    </div>
                    <div className="tl-viza-field">
                      <label htmlFor="gift-recipient">Qəbul edən adı <span className="tl-viza-req">*</span></label>
                      <input id="gift-recipient" className="tl-viza-input" type="text" placeholder="Məs: Ləyla" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                    </div>
                  </div>

                  <div className="tl-viza-field">
                    <label htmlFor="gift-phone">Telefon <span className="tl-viza-req">*</span></label>
                    <input id="gift-phone" className="tl-viza-input" type="tel" placeholder="+994 50 123 45 67" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  <div className="tl-viza-field">
                    <label htmlFor="gift-message">Mesajınız</label>
                    <textarea
                      id="gift-message"
                      className="tl-viza-input tl-viza-textarea"
                      placeholder="Mesajınızı yazın…"
                      value={message}
                      maxLength={MESSAGE_MAX}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <div className="tl-gift-char-count">{message.length}/{MESSAGE_MAX}</div>
                  </div>

                  <button className="tl-viza-submit" type="button" onClick={submit}>Sorğunu WhatsApp-a göndər</button>
                </div>

                <div className="tl-gift-preview">
                  <div className="tl-gift-preview-title">Kart önizləməsi</div>
                  <GiftCardVisual />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
                {waOpened === false ? (
                  <>
                    <div className="tl-viza-done-ico tl-viza-done-ico-warn">!</div>
                    <h3 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 8 }}>
                      WhatsApp avtomatik açılmadı
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', lineHeight: 1.6, marginBottom: 20 }}>
                      Brauzeriniz pəncərəni blokladı — sorğunuz hələ bizə çatmayıb. Aşağıdakı düyməni klikləyib mesajı özünüz göndərin.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="tl-viza-done-ico">✓</div>
                    <h3 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 8 }}>
                      Mesajınız WhatsApp-da hazırdır
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', lineHeight: 1.6, marginBottom: 20 }}>
                      Sorğunuzun bizə çatması üçün açılan WhatsApp söhbətində <b>&quot;Göndər&quot;</b> düyməsini basmağı unutmayın.
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
                    <i>Menecer</i>
                    <b>{GIFT_CARD_MANAGER.name} — {formatManagerNumber(GIFT_CARD_MANAGER.number)}</b>
                  </div>
                </div>
                <button className="tl-viza-wa" type="button" onClick={() => lead && openWhatsApp(lead)}>
                  {waOpened === false ? 'WhatsApp-ı aç və göndər' : 'WhatsApp-ı yenidən aç'}
                </button>
              </div>
            )}
          </div>

          <SeoBodyText>
            <p>
              Travellab Hədiyyə Kartı sevdiklərinizə səyahət azadlığı bəxş etməyin ən asan yoludur. Kartda yığılan
              məbləğ Travellab-ın bütün xidmətlərində — aviabilet, otel bron, hazır tur paketləri və viza xidmətində —
              keçərlidir, beləliklə hədiyyəni alan şəxs özü hara və necə səyahət edəcəyini seçir.
            </p>
            <p>
              Hədiyyə kartı sifarişi hazırda onlayn ödəniş sistemi ilə deyil, WhatsApp üzərindən şəxsi əlaqə ilə
              tamamlanır: yuxarıdakı formu doldurduqdan sonra sorğunuz birbaşa menecerimizə göndərilir, ödəniş və
              digər detallar birlikdə razılaşdırılır. Kart 1 il müddətinə etibarlıdır.
            </p>
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
