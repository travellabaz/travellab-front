import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pickManager, formatManagerNumber } from '../utils/managers';
import { VIZA_COUNTRIES_SCHENGEN, VIZA_COUNTRIES_OTHER } from '../data/vizaCountries';
import CountrySelect from '../components/CountrySelect';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

// initialCountry: pre-selects the dropdown when arriving from a
// per-country page (VizaCountryPage.jsx) — the visa request itself still
// works exactly the same either way, this just saves a click.
export default function VizaSection({ initialCountry = '' }) {
  const { t } = useTranslation();
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

  const VIZA_COUNTRY_GROUPS = [
    { label: t('viza.schengenGroup'), options: VIZA_COUNTRIES_SCHENGEN.map((c) => ({ value: c.name, label: t(`countries.${c.name}`) })) },
    { label: t('viza.otherGroup'), options: VIZA_COUNTRIES_OTHER.map((c) => ({ value: c.name, label: t(`countries.${c.name}`) })) },
  ];
  const VIZA_COUNTRY_OTHER_OPTION = { value: 'Digər', label: t('viza.countryOther') };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const changePax = (delta) => setPax((p) => Math.max(1, Math.min(10, p + delta)));

  const openWhatsApp = (lead) => {
    const manager = lead.manager;
    const msg =
      t('viza.waMessage', { country: lead.country || '', name: lead.name || '', surname: lead.surname || '', phone: lead.phone || '', pax: lead.pax || 1, date: lead.date || t('viza.dateUnspecified') }) +
      (lead.note ? t('viza.waMessageNote', { note: lead.note }) : '');
    const win = window.open('https://wa.me/' + manager.number + '?text=' + encodeURIComponent(msg), '_blank');
    const opened = !!win;
    setWaOpened(opened);
    return opened;
  };

  const submit = () => {
    setError('');
    const { country, name, surname, phone, date, note } = form;

    if (!country) return setError(t('viza.errorCountry'));
    if (!name.trim()) return setError(t('viza.errorName'));
    if (!surname.trim()) return setError(t('viza.errorSurname'));
    if (phone.replace(/\D/g, '').length < 9) return setError(t('viza.errorPhone'));

    const dateText = date ? new Date(date).toLocaleDateString('az-AZ') : t('viza.dateUnspecified');
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
        [t('viza.recapCountry'), t(`countries.${lead.country}`, lead.country)],
        [t('viza.recapName'), `${lead.name} ${lead.surname}`],
        [t('viza.recapPhone'), lead.phone],
        [t('viza.recapPax'), String(lead.pax)],
        [t('viza.recapDate'), lead.date],
        ...(lead.note ? [[t('viza.recapNote'), lead.note]] : []),
        [t('viza.recapManager'), `${lead.manager.name} — ${formatManagerNumber(lead.manager.number)}`],
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
            <div className="tl-tag">{t('viza.tag')}</div>
            <h2 className="tl-title">{t('viza.title')}</h2>
          </div>
        </div>
        <p style={{ color: 'var(--tl-gray-600)', fontSize: 14, maxWidth: 600, margin: '-16px 0 28px', lineHeight: 1.6 }}>
          {t('viza.subtitle')}
        </p>

        <div className="tl-viza-card">
          <div>
            {error && <div className="am-msg er show">{error}</div>}

            {view === 'form' ? (
              <div>
                <CountrySelect
                  label={<>{t('viza.countryLabel')} <span className="tl-viza-req">*</span></>}
                  value={form.country}
                  onChange={(v) => setForm((f) => ({ ...f, country: v }))}
                  placeholder={t('viza.countryPlaceholder')}
                  groups={VIZA_COUNTRY_GROUPS}
                  extraOption={VIZA_COUNTRY_OTHER_OPTION}
                  fieldClassName="tl-viza-field"
                  triggerClassName="tl-viza-input tl-cal-trigger-viza"
                />

                <div className="tl-viza-row">
                  <div className="tl-viza-field">
                    <label htmlFor="viza-name">{t('viza.name')} <span className="tl-viza-req">*</span></label>
                    <input id="viza-name" className="tl-viza-input" type="text" placeholder={t('viza.namePlaceholder')} autoComplete="given-name" value={form.name} onChange={setField('name')} />
                  </div>
                  <div className="tl-viza-field">
                    <label htmlFor="viza-surname">{t('viza.surname')} <span className="tl-viza-req">*</span></label>
                    <input id="viza-surname" className="tl-viza-input" type="text" placeholder={t('viza.surnamePlaceholder')} autoComplete="family-name" value={form.surname} onChange={setField('surname')} />
                  </div>
                </div>

                <div className="tl-viza-field">
                  <label htmlFor="viza-phone">{t('viza.phone')} <span className="tl-viza-req">*</span></label>
                  <input id="viza-phone" className="tl-viza-input" type="tel" placeholder={t('viza.phonePlaceholder')} autoComplete="tel" value={form.phone} onChange={setField('phone')} />
                </div>

                <div className="tl-viza-row">
                  <AvailabilityCalendar
                    label={t('viza.date')}
                    value={form.date}
                    onChange={(v) => setForm((f) => ({ ...f, date: v }))}
                    fieldClassName="tl-viza-field"
                    triggerClassName="tl-viza-input tl-cal-trigger-viza"
                  />
                  <div className="tl-viza-field">
                    <label htmlFor="viza-pax">{t('viza.pax')}</label>
                    <div className="tl-viza-count">
                      <button type="button" onClick={() => changePax(-1)} aria-label="-">−</button>
                      <span id="viza-pax">{pax}</span>
                      <button type="button" onClick={() => changePax(1)} aria-label="+">+</button>
                    </div>
                  </div>
                </div>

                <div className="tl-viza-field">
                  <label htmlFor="viza-note">{t('viza.note')}</label>
                  <textarea
                    id="viza-note"
                    className="tl-viza-input tl-viza-textarea"
                    placeholder={t('viza.notePlaceholder')}
                    value={form.note}
                    onChange={setField('note')}
                  />
                </div>

                <button className="tl-viza-submit" type="button" onClick={submit}>{t('viza.submit')}</button>
                <p className="tl-viza-note">{t('viza.submitNote')}</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                {waOpened === false ? (
                  <>
                    <div className="tl-viza-done-ico tl-viza-done-ico-warn">!</div>
                    <h3 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 8 }}>
                      {t('viza.waNotOpened')}
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', lineHeight: 1.6, marginBottom: 20 }}>
                      {t('viza.waNotOpenedDesc')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="tl-viza-done-ico">✓</div>
                    <h3 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 8 }}>
                      {t('viza.waReady')}
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', lineHeight: 1.6, marginBottom: 20 }}>
                      {t('viza.waReadyDesc')}
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
                  {waOpened === false ? t('viza.waOpen') : t('viza.waReopen')}
                </button>
              </div>
            )}
          </div>

          <div className="tl-viza-visual">
            <h3>{t('viza.howItWorks')}</h3>
            <div className="tl-viza-step">
              <div className="tl-viza-step-n">1</div>
              <div>
                <h4>{t('viza.step1Title')}</h4>
                <p>{t('viza.step1Desc')}</p>
              </div>
            </div>
            <div className="tl-viza-step">
              <div className="tl-viza-step-n">2</div>
              <div>
                <h4>{t('viza.step2Title')}</h4>
                <p>{t('viza.step2Desc')}</p>
              </div>
            </div>
            <div className="tl-viza-step">
              <div className="tl-viza-step-n">3</div>
              <div>
                <h4>{t('viza.step3Title')}</h4>
                <p>{t('viza.step3Desc')}</p>
              </div>
            </div>
            <div className="tl-viza-stats">
              <div className="tl-viza-stat">
                <div className="tl-viza-stat-n">10 000+</div>
                <div className="tl-viza-stat-l">{t('viza.statSuccess')}</div>
              </div>
              <div className="tl-viza-stat">
                <div className="tl-viza-stat-n">50+</div>
                <div className="tl-viza-stat-l">{t('viza.statCountries')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
