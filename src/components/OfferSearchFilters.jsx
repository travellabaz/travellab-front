import { useState } from 'react';

const STAR_OPTIONS = [2, 3, 4, 5];

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
    onSearch({ state, checkinFrom, checkinTo, nights, adults, children, stars });
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

      <button className={`tl-viza-submit tl-offer-submit${loading ? ' ld' : ''}`} type="button" onClick={submit} disabled={loading}>
        <span className="sp" />
        <span className="bt">Axtar</span>
      </button>
    </div>
  );
}
