import { useState } from 'react';
import { pickManager, formatManagerNumber } from '../utils/managers';
import { VIZA_COUNTRIES_SCHENGEN, VIZA_COUNTRIES_OTHER } from '../data/vizaCountries';

// initialCountry: pre-selects the dropdown when arriving from a
// per-country page (VizaCountryPage.jsx) — the visa request itself still
// works exactly the same either way, this just saves a click.
export default function VizaSection({ initialCountry = '' }) {
  const [form, setForm] = useState({ country: initialCountry, name: '', surname: '', phone: '', date: '', note: '' });
  const [pax, setPax] = useState(1);
  const [error, setError] = useState('');
  const [view, setView] = useState('form'); // 'form' | 'done'
  const [lead, setLead] = useState(null);
  // Nothing is actually sent anywhere until the visitor presses Send inside
  // WhatsApp itself — this is only a prefilled wa.me link, not a real form
  // submission to our own backend. So "qəbul edildi" would be a lie if the
  // popup got blocked (or the visitor just closes it) — track whether
  // window.open actually succeeded and show an honest state either way.
  const [waOpened, setWaOpened] = useState(null); // null | true | false

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const changePax = (delta) => setPax((p) => Math.max(1, Math.min(10, p + delta)));

  const openWhatsApp = (lead) => {
    const manager = lead.manager;
    const msg =
      'Salam! ' + (lead.country || '') + ' vizası ilə bağlı müraciət etdim.\n' +
      'Ad: ' + (lead.name || '') + ' ' + (lead.surname || '') + '\n' +
      'Telefon: ' + (lead.phone || '') + '\n' +
      'Nəfər sayı: ' + (lead.pax || 1) + '\n' +
      'Gediş tarixi: ' + (lead.date || 'Dəqiqləşdirilməyib') +
      (lead.note ? '\nQeyd: ' + lead.note : '');
    const win = window.open('https://wa.me/' + manager.number + '?text=' + encodeURIComponent(msg), '_blank');
    const opened = !!win;
    setWaOpened(opened);
    return opened;
  };

  const submit = () => {
    setError('');
    const { country, name, surname, phone, date, note } = form;

    if (!country) return setError('Ölkəni seçin.');
    if (!name.trim()) return setError('Adınızı yazın.');
    if (!surname.trim()) return setError('Soyadınızı yazın.');
    if (phone.replace(/\D/g, '').length < 9) return setError('Telefon nömrəsini düzgün yazın.');

    const dateText = date ? new Date(date).toLocaleDateString('az-AZ') : 'Dəqiqləşdirilməyib';
    const manager = pickManager();

    const newLead = { country, name, surname, phone: phone.trim(), pax, date: dateText, note: note.trim(), manager };

    setLead(newLead);
    setView('done');

    requestAnimationFrame(() => {
      const el = document.getElementById('viza');
      if (el) window.scrollTo({ top: el.offsetTop - 76, behavior: 'smooth' });
    });

    // Jump straight to WhatsApp — no extra click needed. Must stay
    // synchronous with the click so the browser doesn't block the popup.
    openWhatsApp(newLead);
  };

  const recap = lead
    ? [
        ['Ölkə', lead.country],
        ['Ad, soyad', `${lead.name} ${lead.surname}`],
        ['Telefon', lead.phone],
        ['Nəfər sayı', String(lead.pax)],
        ['Gediş tarixi', lead.date],
        ...(lead.note ? [['Qeyd', lead.note]] : []),
        ['Menecer', `${lead.manager.name} — ${formatManagerNumber(lead.manager.number)}`],
      ]
    : null;

  return (
    // No tl-page-top here — VizaSection is never the first section on the
    // page anymore (VizaPage puts the country picker above it,
    // VizaCountryPage puts the breadcrumb above it), so the page-level
    // top-nav clearance belongs on whichever of those actually is first.
    <section id="viza">
      <div className="tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">Turistik Viza</div>
            <h2 className="tl-title">Vizanı Asanlıqla Alın</h2>
          </div>
        </div>
        <p style={{ color: 'var(--tl-gray-600)', fontSize: 14, maxWidth: 600, margin: '-16px 0 28px', lineHeight: 1.6 }}>
          Sənədləri, müraciəti və görüşü biz aparırıq. Sorğunuza qısa müddətdə cavab veririk.
        </p>

        <div className="tl-viza-card">
          <div>
            {error && <div className="am-msg er show">{error}</div>}

            {view === 'form' ? (
              <div>
                <div className="tl-viza-field">
                  <label htmlFor="viza-country">
                    Hansı ölkəyə viza almaq istəyirsiniz? <span className="tl-viza-req">*</span>
                  </label>
                  <select id="viza-country" className="tl-viza-input" value={form.country} onChange={setField('country')}>
                    <option value="">Ölkə seçin…</option>
                    <optgroup label="Şengen">
                      {VIZA_COUNTRIES_SCHENGEN.map((c) => <option key={c.name}>{c.name}</option>)}
                    </optgroup>
                    <optgroup label="Digər ölkələr">
                      {VIZA_COUNTRIES_OTHER.map((c) => <option key={c.name}>{c.name}</option>)}
                    </optgroup>
                    <option value="Digər">Siyahıda yoxdur</option>
                  </select>
                </div>

                <div className="tl-viza-row">
                  <div className="tl-viza-field">
                    <label htmlFor="viza-name">Ad <span className="tl-viza-req">*</span></label>
                    <input id="viza-name" className="tl-viza-input" type="text" placeholder="Adınız" autoComplete="given-name" value={form.name} onChange={setField('name')} />
                  </div>
                  <div className="tl-viza-field">
                    <label htmlFor="viza-surname">Soyad <span className="tl-viza-req">*</span></label>
                    <input id="viza-surname" className="tl-viza-input" type="text" placeholder="Soyadınız" autoComplete="family-name" value={form.surname} onChange={setField('surname')} />
                  </div>
                </div>

                <div className="tl-viza-field">
                  <label htmlFor="viza-phone">Telefon <span className="tl-viza-req">*</span></label>
                  <input id="viza-phone" className="tl-viza-input" type="tel" placeholder="+994 50 123 45 67" autoComplete="tel" value={form.phone} onChange={setField('phone')} />
                </div>

                <div className="tl-viza-row">
                  <div className="tl-viza-field">
                    <label htmlFor="viza-date">Təxmini gediş tarixi</label>
                    <input id="viza-date" className="tl-viza-input" type="date" value={form.date} onChange={setField('date')} />
                  </div>
                  <div className="tl-viza-field">
                    <label htmlFor="viza-pax">Nəfər sayı</label>
                    <div className="tl-viza-count">
                      <button type="button" onClick={() => changePax(-1)} aria-label="Azalt">−</button>
                      <span id="viza-pax">{pax}</span>
                      <button type="button" onClick={() => changePax(1)} aria-label="Artır">+</button>
                    </div>
                  </div>
                </div>

                <div className="tl-viza-field">
                  <label htmlFor="viza-note">Əlavə qeyd</label>
                  <textarea
                    id="viza-note"
                    className="tl-viza-input tl-viza-textarea"
                    placeholder="Əvvəl viza rədd olunub, uşaqla səyahət, təcili lazımdır…"
                    value={form.note}
                    onChange={setField('note')}
                  />
                </div>

                <button className="tl-viza-submit" type="button" onClick={submit}>Sorğu göndər</button>
                <p className="tl-viza-note">Ödəniş tələb olunmur · Mütəxəssisimiz qısa müddətdə sizinlə əlaqə saxlayır</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                {waOpened === false ? (
                  <>
                    <div className="tl-viza-done-ico tl-viza-done-ico-warn">!</div>
                    <h3 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 8 }}>
                      WhatsApp avtomatik açılmadı
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', lineHeight: 1.6, marginBottom: 20 }}>
                      Brauzeriniz pəncərəni blokladı — müraciətiniz hələ bizə çatmayıb. Aşağıdakı düyməni klikləyib mesajı özünüz göndərin.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="tl-viza-done-ico">✓</div>
                    <h3 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 8 }}>
                      Mesajınız WhatsApp-da hazırdır
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', lineHeight: 1.6, marginBottom: 20 }}>
                      Müraciətinizin bizə çatması üçün açılan WhatsApp söhbətində <b>&quot;Göndər&quot;</b> düyməsini basmağı unutmayın.
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
                </div>
                <button className="tl-viza-wa" type="button" onClick={() => lead && openWhatsApp(lead)}>
                  {waOpened === false ? 'WhatsApp-ı aç və göndər' : 'WhatsApp-ı yenidən aç'}
                </button>
              </div>
            )}
          </div>

          <div className="tl-viza-visual">
            <h3>Necə işləyir?</h3>
            <div className="tl-viza-step">
              <div className="tl-viza-step-n">1</div>
              <div>
                <h4>Müraciət edirsiniz</h4>
                <p>Formu doldurun — bir dəqiqədən az vaxt aparır.</p>
              </div>
            </div>
            <div className="tl-viza-step">
              <div className="tl-viza-step-n">2</div>
              <div>
                <h4>Mütəxəssis sizinlə danışır</h4>
                <p>WhatsApp və ya zəng ilə əlaqə saxlayır, ölkəyə uyğun şərtləri və qiyməti izah edir.</p>
              </div>
            </div>
            <div className="tl-viza-step">
              <div className="tl-viza-step-n">3</div>
              <div>
                <h4>Vizanı alırsınız</h4>
                <p>Sənədləri birlikdə hazırlayırıq, müraciəti biz aparırıq.</p>
              </div>
            </div>
            <div className="tl-viza-stats">
              <div className="tl-viza-stat">
                <div className="tl-viza-stat-n">10 000+</div>
                <div className="tl-viza-stat-l">Uğurlu viza</div>
              </div>
              <div className="tl-viza-stat">
                <div className="tl-viza-stat-n">50+</div>
                <div className="tl-viza-stat-l">Ölkə</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
