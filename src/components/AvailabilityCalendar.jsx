import { useEffect, useRef, useState } from 'react';

const MONTH_NAMES_AZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
  'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

const WEEKDAY_NAMES_AZ = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'];

function toIso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function isoToKompas(iso) {
  return iso.replaceAll('-', '');
}

function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m: m - 1, d };
}

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

// JS getDay() is 0=Sun..6=Sat — shift so the grid starts on Monday.
function mondayOffset(jsDay) {
  return (jsDay + 6) % 7;
}

function todayIso() {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}

// Honest 2-state calendar: green = confirmed bookable (present in
// availableDates, sourced from Kompas's SearchTour_CHECKIN), grey = not
// bookable or simply not known yet. Kompas's own agent widget shows a
// 3-color "few spots left" gradient, but SearchTour_CHECKIN only returns a
// flat list of valid checkin dates with no per-date quantity signal, so we
// don't fabricate a "yellow" severity we have no data for (see
// KompasCheckinResponse.java on the backend for the full reasoning).
export default function AvailabilityCalendar({ label, value, onChange, availableDates, loading, disabled, minDate, fieldClassName, triggerClassName }) {
  const [open, setOpen] = useState(false);
  const initial = parseIso(value || minDate || todayIso());
  const [viewY, setViewY] = useState(initial.y);
  const [viewM, setViewM] = useState(initial.m);
  const rootRef = useRef(null);

  useEffect(() => {
    if (open && value) {
      const { y, m } = parseIso(value);
      setViewY(y);
      setViewM(m);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const availableSet = new Set(availableDates || []);
  const hasAvailabilityData = availableSet.size > 0;
  const floor = minDate || todayIso();
  const floorParts = parseIso(floor);

  const canGoPrev = !(viewY === floorParts.y && viewM === floorParts.m);

  const goPrev = () => {
    if (!canGoPrev) return;
    if (viewM === 0) { setViewY(viewY - 1); setViewM(11); } else { setViewM(viewM - 1); }
  };
  const goNext = () => {
    if (viewM === 11) { setViewY(viewY + 1); setViewM(0); } else { setViewM(viewM + 1); }
  };

  const leadBlanks = mondayOffset(new Date(viewY, viewM, 1).getDay());
  const totalDays = daysInMonth(viewY, viewM);
  const cells = [];
  for (let i = 0; i < leadBlanks; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const pick = (d) => {
    onChange(toIso(viewY, viewM, d));
    setOpen(false);
  };

  return (
    <div className={`${fieldClassName || 'tl-searchbar-field'} tl-cal-field`} ref={rootRef}>
      <label>{label}</label>
      <button
        type="button"
        className={triggerClassName || 'tl-cal-trigger'}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        {value ? value.split('-').reverse().join('.') : 'Seçin'}
      </button>

      {open && (
        <div className="tl-cal-popover">
          <div className="tl-cal-header">
            <button type="button" onClick={goPrev} disabled={!canGoPrev} aria-label="Əvvəlki ay">‹</button>
            <span>{MONTH_NAMES_AZ[viewM]} {viewY}</span>
            <button type="button" onClick={goNext} aria-label="Növbəti ay">›</button>
          </div>

          {loading && <div className="tl-cal-loading">Yüklənir…</div>}

          <div className="tl-cal-weekdays">
            {WEEKDAY_NAMES_AZ.map((w) => <span key={w}>{w}</span>)}
          </div>

          <div className="tl-cal-grid">
            {cells.map((d, i) => {
              if (d === null) return <span key={i} className="tl-cal-cell tl-cal-cell-blank" />;
              const iso = toIso(viewY, viewM, d);
              const kompas = isoToKompas(iso);
              const isPast = iso < floor;
              const isAvailable = hasAvailabilityData && availableSet.has(kompas);
              const isKnownUnavailable = hasAvailabilityData && !availableSet.has(kompas);
              const isSelected = value === iso;
              const isDisabled = isPast || isKnownUnavailable;
              return (
                <button
                  type="button"
                  key={i}
                  className={`tl-cal-cell${isAvailable ? ' tl-cal-cell-available' : ''}${isSelected ? ' tl-cal-cell-selected' : ''}${isDisabled ? ' tl-cal-cell-disabled' : ''}`}
                  disabled={isDisabled}
                  onClick={() => pick(d)}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {hasAvailabilityData && (
            <div className="tl-cal-legend">
              <span><span className="tl-cal-legend-dot tl-cal-legend-dot-available" />Yerlər var</span>
              <span><span className="tl-cal-legend-dot tl-cal-legend-dot-unavailable" />Yer yoxdur</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
