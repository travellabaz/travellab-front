import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCategories, getCalendar } from '../api/offers';
import AvailabilityCalendar from './AvailabilityCalendar';
import CountrySelect from './CountrySelect';
import { TOUR_SEARCH_COUNTRIES } from '../data/tourSearchCountries';

// Kompas's destinations endpoint only returns Russian names (see
// tourSearchCountries.js) — reuse that same nameRu->nameAz map here so the
// dropdown itself is in Azerbaijani too, not just the per-country pages.
// Falls back to the raw Kompas name for any destination not yet in that
// list, rather than hiding it.
const COUNTRY_NAME_AZ = new Map(TOUR_SEARCH_COUNTRIES.map((c) => [c.nameRu, c.nameAz]));
function destinationName(name) {
  return COUNTRY_NAME_AZ.get(name) || name;
}

const STAR_OPTIONS = [2, 3, 4, 5];

// Kompas's CURRENCY codes — confirmed live via SearchTour_CURRENCIES
// (USD=2, EUR=3, AZN=13), not documented anywhere on the public wiki.
const CURRENCY_OPTIONS = [
  { value: '2', label: 'USD' },
  { value: '3', label: 'EUR' },
  { value: '13', label: 'AZN' },
];

// Purely a styling hint (purple pill) — filtering itself is the backend's
// job (KompasSearchService.filterTours), this only decides how the pill
// looks.
function isGdsCategory(category) {
  return category.toUpperCase().includes('GDS');
}

// Kompas's own `type` values come back as raw internal strings ("BEACH",
// "GDS тур") — not fit for customer-facing copy, so translate the ones
// we've actually seen live and fall back to the raw value for anything new
// rather than hiding an unrecognized category.
function categoryLabel(category, t) {
  const upper = category.toUpperCase();
  if (upper.includes('GDS')) return 'GDS';
  if (upper === 'BEACH') return t('offerSearchFilters.categoryBeach');
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

function Stepper({ label, value, min, max, onChange, t }) {
  return (
    <div className="tl-searchbar-field tl-searchbar-field-compact">
      <label>{label}</label>
      <div className="tl-searchbar-stepper">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={t('offerSearchFilters.decrease')}>−</button>
        <span>{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={t('offerSearchFilters.increase')}>+</button>
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
  const { t } = useTranslation();
  const MEAL_OPTIONS = [
    { value: '', label: t('offerSearchFilters.mealAll') },
    { value: 'RO', label: t('offerSearchFilters.mealRoomOnly') },
    { value: 'BB', label: t('offerSearchFilters.mealBreakfast') },
    { value: 'HB', label: t('offerSearchFilters.mealHalfBoard') },
    { value: 'FB', label: t('offerSearchFilters.mealFullBoard') },
    { value: 'AI', label: t('offerSearchFilters.mealAllInclusive') },
    { value: 'UAI', label: t('offerSearchFilters.mealUltraAllInclusive') },
  ];

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
    if (!state) return setError(t('offerSearchFilters.errorDestination'));
    if (!checkinFrom || !checkinTo) return setError(t('offerSearchFilters.errorDates'));
    if (checkinTo < checkinFrom) return setError(t('offerSearchFilters.errorDateOrder'));
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
        <CountrySelect
          value={currency}
          onChange={setCurrency}
          options={CURRENCY_OPTIONS}
          triggerClassName="tl-searchbar-currency-trigger"
        />
      </div>

      {error && <div className="am-msg er show" style={{ marginBottom: 10 }}>{error}</div>}

      <div className="tl-searchbar-row">
        <CountrySelect
          label={t('offerSearchFilters.destination')}
          value={state}
          onChange={setState}
          placeholder={t('offerSearchFilters.destinationPlaceholder')}
          options={destinations.map((d) => ({ value: String(d.state), label: t(`countries.${destinationName(d.name)}`, destinationName(d.name)) }))}
        />

        <AvailabilityCalendar
          label={t('offerSearchFilters.checkinFrom')}
          value={checkinFrom}
          onChange={setCheckinFrom}
          availableDates={availableDates}
          loading={calendarLoading}
          disabled={!state}
        />

        <AvailabilityCalendar
          label={t('offerSearchFilters.checkinTo')}
          value={checkinTo}
          onChange={setCheckinTo}
          minDate={checkinFrom}
          disabled={!state}
        />

        <Stepper t={t} label={t('offerSearchFilters.nights')} value={nights} min={1} max={30} onChange={setNights} />
        <Stepper t={t} label={t('offerSearchFilters.adults')} value={adults} min={1} max={10} onChange={setAdults} />
        <Stepper t={t} label={t('offerSearchFilters.children')} value={children} min={0} max={10} onChange={setChildren} />

        <button className={`tl-searchbar-submit${loading ? ' ld' : ''}`} type="button" onClick={submit} disabled={loading}>
          <span className="sp" />
          <span className="bt">{t('offerSearchFilters.search')}</span>
        </button>
      </div>

      <div className="tl-searchbar-extra">
        {categories.length > 0 && (
          <div className="tl-searchbar-extra-group">
            <span className="tl-searchbar-extra-label">{t('offerSearchFilters.category')}</span>
            <div className="tl-searchbar-stars">
              <button
                type="button"
                className={`tl-blog-filter-pill${category === '' ? ' active' : ''}`}
                onClick={() => setCategory('')}
                aria-pressed={category === ''}
              >
                {t('offerSearchFilters.categoryAll')}
              </button>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`tl-blog-filter-pill${isGdsCategory(cat) ? ' tl-blog-filter-pill-gds' : ''}${category === cat ? ' active' : ''}`}
                  onClick={() => setCategory(cat)}
                  aria-pressed={category === cat}
                >
                  {categoryLabel(cat, t)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="tl-searchbar-extra-group">
          <span className="tl-searchbar-extra-label">{t('offerSearchFilters.stars')}</span>
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
          <span className="tl-searchbar-extra-label">{t('offerSearchFilters.meal')}</span>
          <CountrySelect
            value={meal}
            onChange={setMeal}
            options={MEAL_OPTIONS}
            fieldClassName="tl-searchbar-meal-field"
            triggerClassName="tl-searchbar-meal"
          />
        </div>
      </div>
    </div>
  );
}
