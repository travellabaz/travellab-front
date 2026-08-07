import { useEffect, useRef, useState } from 'react';
import { getCategories, getCalendar } from '../api/offers';
import AvailabilityCalendar from './AvailabilityCalendar';

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

// Purely a styling hint (purple pill) — filtering itself is the backend's
// job (KompasSearchService.filterTours), this only decides how the pill
// looks.
function isGdsCategory(category) {
  return category.toUpperCase().includes('GDS');
}

// Kompas's own `type` values come back as raw internal strings ("BEACH",
// "GDS тур") — not fit for customer-facing AZ copy, so translate the ones
// we've actually seen live and fall back to the raw value for anything new
// rather than hiding an unrecognized category.
function categoryLabel(category) {
  const upper = category.toUpperCase();
  if (upper.includes('GDS')) return 'GDS';
  if (upper === 'BEACH') return 'Çarter turları';
  return category;
}

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

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div className="tl-searchbar-field tl-searchbar-field-compact">
      <label>{label}</label>
      <div className="tl-searchbar-stepper">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Azalt">−</button>
        <span>{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Artır">+</button>
      </div>
    </div>
  );
}

// Single-row search bar matching the flight-search widget's visual
// language (HeroSearch.jsx's Travelpayouts embed) — borderless inline
// fields separated by dividers, currency tucked in the top-right corner,
// a green submit button on the right. Star rating / meal plan don't have
// an equivalent in a flight search, so they sit in a slim secondary row
// below the main bar instead of crowding it.
export default function OfferSearchFilters({ destinations, onSearch, loading, initialState }) {
  const [state, setState] = useState('');
  const [checkinFrom, setCheckinFrom] = useState(defaultCheckinFrom);
  const [checkinTo, setCheckinTo] = useState(defaultCheckinTo);
  const [nights, setNights] = useState(7);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [stars, setStars] = useState([]);
  const [meal, setMeal] = useState('');
  const [currency, setCurrency] = useState('2');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleStar = (star) => {
    setStars((s) => (s.includes(star) ? s.filter((x) => x !== star) : [...s, star]));
  };

  // Categories are per-destination (a tour's `type` only means something
  // in the context of that destination's own tour list) — refetch whenever
  // the destination changes, and drop any category picked for the previous
  // destination since it likely doesn't exist for this one.
  useEffect(() => {
    if (!state) {
      setCategories([]);
      return;
    }
    setCategory('');
    let cancelled = false;
    getCategories(state)
      .then((cats) => { if (!cancelled) setCategories(cats); })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, [state]);

  // Recomputed whenever the destination or category changes — same
  // filterTours scope as /results server-side, so the calendar's greens
  // never disagree with what a search actually returns.
  useEffect(() => {
    if (!state) {
      setAvailableDates([]);
      return;
    }
    setCalendarLoading(true);
    let cancelled = false;
    getCalendar(state, category)
      .then((dates) => { if (!cancelled) setAvailableDates(dates); })
      .catch(() => { if (!cancelled) setAvailableDates([]); })
      .finally(() => { if (!cancelled) setCalendarLoading(false); });
    return () => { cancelled = true; };
  }, [state, category]);

  const submit = () => {
    setError('');
    if (!state) return setError('İstiqaməti seçin.');
    if (!checkinFrom || !checkinTo) return setError('Tarixləri seçin.');
    if (checkinTo < checkinFrom) return setError('Tarixlər düzgün deyil.');
    onSearch({ state, checkinFrom, checkinTo, nights, adults, children, stars, meal, currency, category });
  };

  // Per-country pages (TourSearchCountryPage.jsx) pass initialState once
  // it's resolved from the live destinations list — auto-run the search
  // once, straight from the prop rather than waiting on setState(state) to
  // flush, so the visitor lands on real results instead of an empty form.
  const autoSearchedRef = useRef(false);
  useEffect(() => {
    if (initialState && !autoSearchedRef.current) {
      autoSearchedRef.current = true;
      setState(initialState);
      onSearch({ state: initialState, checkinFrom, checkinTo, nights, adults, children, stars, meal, currency, category: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState]);

  return (
    <div className="tl-searchbar">
      <div className="tl-searchbar-currency">
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Valyuta">
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {error && <div className="am-msg er show" style={{ marginBottom: 10 }}>{error}</div>}

      <div className="tl-searchbar-row">
        <div className="tl-searchbar-field">
          <label htmlFor="offer-state">İstiqamət</label>
          <select id="offer-state" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Ölkə seçin…</option>
            {destinations.map((d) => (
              <option key={d.state} value={d.state}>{d.name}</option>
            ))}
          </select>
        </div>

        <AvailabilityCalendar
          label="Tarixdən"
          value={checkinFrom}
          onChange={setCheckinFrom}
          availableDates={availableDates}
          loading={calendarLoading}
          disabled={!state}
        />

        <div className="tl-searchbar-field">
          <label htmlFor="offer-checkin-to">Tarixə qədər</label>
          <input id="offer-checkin-to" type="date" value={checkinTo} onChange={(e) => setCheckinTo(e.target.value)} />
        </div>

        <Stepper label="Gecə" value={nights} min={1} max={30} onChange={setNights} />
        <Stepper label="Böyük" value={adults} min={1} max={10} onChange={setAdults} />
        <Stepper label="Uşaq" value={children} min={0} max={10} onChange={setChildren} />

        <button className={`tl-searchbar-submit${loading ? ' ld' : ''}`} type="button" onClick={submit} disabled={loading}>
          <span className="sp" />
          <span className="bt">Axtar</span>
        </button>
      </div>

      <div className="tl-searchbar-extra">
        {categories.length > 0 && (
          <div className="tl-searchbar-extra-group">
            <span className="tl-searchbar-extra-label">Kateqoriya:</span>
            <div className="tl-searchbar-stars">
              <button
                type="button"
                className={`tl-blog-filter-pill${category === '' ? ' active' : ''}`}
                onClick={() => setCategory('')}
                aria-pressed={category === ''}
              >
                Hamısı
              </button>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`tl-blog-filter-pill${isGdsCategory(cat) ? ' tl-blog-filter-pill-gds' : ''}${category === cat ? ' active' : ''}`}
                  onClick={() => setCategory(cat)}
                  aria-pressed={category === cat}
                >
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="tl-searchbar-extra-group">
          <span className="tl-searchbar-extra-label">Ulduz:</span>
          <div className="tl-searchbar-stars">
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
        <div className="tl-searchbar-extra-group tl-searchbar-extra-group-meal">
          <span className="tl-searchbar-extra-label">Qidalanma:</span>
          <select className="tl-searchbar-meal" value={meal} onChange={(e) => setMeal(e.target.value)} aria-label="Qidalanma">
            {MEAL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
