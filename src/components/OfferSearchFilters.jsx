import { useState } from 'react';

const STAR_OPTIONS = [2, 3, 4, 5];

// Kompas's CURRENCY codes — confirmed live via SearchTour_CURRENCIES
// (USD=2, EUR=3, AZN=13), not documented anywhere on the public wiki.
const CURRENCY_OPTIONS = [
  { value: '2', label: 'USD' },
  { value: '3', label: 'EUR' },
  { value: '13', label: 'AZN' },
];

// Standard hotel meal-plan abbreviations — sent as-is to the backend, which
// compares them directly against Kompas's own "meal" field (also one of
// these abbreviations, e.g. "AI", "BB").
const MEAL_OPTIONS = [
  { value: '', label: 'Hamısı' },
  { value: 'RO', label: 'Yalnız otaq (RO)' },
  { value: 'BB', label: 'Səhər yeməyi (BB)' },
  { value: 'HB', label: 'Yarım pansion (HB)' },
  { value: 'FB', label: 'Tam pansion (FB)' },
  { value: 'AI', label: 'Hər şey daxil (AI)' },
  { value: 'UAI', label: 'Ultra hər şey daxil (UAI)' },
];

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

// Sensible defaults so the form is submittable without the visitor having
// to think about dates first: a week out, one-month browsing window.
function defaultCheckinFrom() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toIsoDate(d);
}

function defaultCheckinTo() {
  const d = new Date();
  d.setDate(d.getDate() + 37);
  return toIsoDate(d);
}

export default function OfferSearchFilters({ destinations, onSearch, loading }) {
  const [state, setState] = useState('');
  const [checkinFrom, setCheckinFrom] = useState(defaultCheckinFrom);
  const [checkinTo, setCheckinTo] = useState(defaultCheckinTo);
  const [nights, setNights] = useState(7);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [stars, setStars] = useState([]);
  const [meal, setMeal] = useState('');
  const [currency, setCurrency] = useState('2');
  const [error, setError] = useState('');

  const changeNights = (delta) => setNights((n) => Math.max(1, Math.min(30, n + delta)));
  const changeAdults = (delta) => setAdults((n) => Math.max(1, Math.min(10, n + delta)));
  const changeChildren = (delta) => setChildren((n) => Math.max(0, Math.min(10, n + delta)));

  const toggleStar = (star) => {
    setStars((s) => (s.includes(star) ? s.filter((x) => x !== star) : [...s, star]));
  };

  const submit = () => {
    setError('');
    if (!state) return setError('İstiqaməti seçin.');
    if (!checkinFrom || !checkinTo) return setError('Tarixləri seçin.');
    if (checkinTo < checkinFrom) return setError('Tarixlər düzgün deyil.');
    onSearch({ state, checkinFrom, checkinTo, nights, adults, children, stars, meal, currency });
  };

  return (
    <div className="tl-offer-filters">
      {error && <div className="am-msg er show">{error}</div>}

      <div className="tl-viza-field">
        <label htmlFor="offer-state">
          İstiqamət <span className="tl-viza-req">*</span>
        </label>
        <select id="offer-state" className="tl-viza-input" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">Ölkə seçin…</option>
          {destinations.map((d) => (
            <option key={d.state} value={d.state}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="tl-viza-row">
        <div className="tl-viza-field">
          <label htmlFor="offer-checkin-from">Tarixdən</label>
          <input id="offer-checkin-from" className="tl-viza-input" type="date" value={checkinFrom} onChange={(e) => setCheckinFrom(e.target.value)} />
        </div>
        <div className="tl-viza-field">
          <label htmlFor="offer-checkin-to">Tarixə qədər</label>
          <input id="offer-checkin-to" className="tl-viza-input" type="date" value={checkinTo} onChange={(e) => setCheckinTo(e.target.value)} />
        </div>
      </div>

      <div className="tl-viza-row">
        <div className="tl-viza-field">
          <label htmlFor="offer-nights">Gecə sayı</label>
          <div className="tl-viza-count">
            <button type="button" onClick={() => changeNights(-1)} aria-label="Azalt">−</button>
            <span id="offer-nights">{nights}</span>
            <button type="button" onClick={() => changeNights(1)} aria-label="Artır">+</button>
          </div>
        </div>
        <div className="tl-viza-field">
          <label htmlFor="offer-adults">Böyüklər</label>
          <div className="tl-viza-count">
            <button type="button" onClick={() => changeAdults(-1)} aria-label="Azalt">−</button>
            <span id="offer-adults">{adults}</span>
            <button type="button" onClick={() => changeAdults(1)} aria-label="Artır">+</button>
          </div>
        </div>
      </div>

      <div className="tl-viza-field">
        <label htmlFor="offer-children">Uşaqlar</label>
        <div className="tl-viza-count">
          <button type="button" onClick={() => changeChildren(-1)} aria-label="Azalt">−</button>
          <span id="offer-children">{children}</span>
          <button type="button" onClick={() => changeChildren(1)} aria-label="Artır">+</button>
        </div>
      </div>

      <div className="tl-viza-field">
        <label>Ulduz</label>
        <div className="tl-blog-filter" role="group" aria-label="Ulduz sayı">
          {STAR_OPTIONS.map((star) => (
            <button
              type="button"
              key={star}
              className={`tl-blog-filter-pill${stars.includes(star) ? ' active' : ''}`}
              onClick={() => toggleStar(star)}
              aria-pressed={stars.includes(star)}
            >
              {star}★
            </button>
          ))}
        </div>
      </div>

      <div className="tl-viza-row">
        <div className="tl-viza-field">
          <label htmlFor="offer-meal">Qidalanma</label>
          <select id="offer-meal" className="tl-viza-input" value={meal} onChange={(e) => setMeal(e.target.value)}>
            {MEAL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="tl-viza-field">
          <label htmlFor="offer-currency">Valyuta</label>
          <select id="offer-currency" className="tl-viza-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button className={`tl-viza-submit tl-offer-submit${loading ? ' ld' : ''}`} type="button" onClick={submit} disabled={loading}>
        <span className="sp" />
        <span className="bt">Axtar</span>
      </button>
    </div>
  );
}
