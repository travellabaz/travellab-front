import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const monthNames = t('availabilityCalendar.months', { returnObjects: true });
  const weekdayNames = t('availabilityCalendar.weekdays', { returnObjects: true });
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
        {value ? value.split('-').reverse().join('.') : t('availabilityCalendar.select')}
      </button>

      {open && (
        <div className="tl-cal-popover">
          <div className="tl-cal-header">
            <button type="button" onClick={goPrev} disabled={!canGoPrev} aria-label={t('availabilityCalendar.prevMonth')}>‹</button>
            <span>{monthNames[viewM]} {viewY}</span>
            <button type="button" onClick={goNext} aria-label={t('availabilityCalendar.nextMonth')}>›</button>
          </div>

          {loading && <div className="tl-cal-loading">{t('availabilityCalendar.loading')}</div>}

          <div className="tl-cal-weekdays">
            {weekdayNames.map((w) => <span key={w}>{w}</span>)}
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
        </div>
      )}
    </div>
  );
}
