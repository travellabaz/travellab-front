import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Same idea as Kompas's own agent widget's hotel picker (a searchable
// checkbox list narrowing an already-fetched result set) — built entirely
// client-side from whatever hotel names are actually present in the
// current search results, no separate hotels API call needed.
export default function HotelFilter({ hotels, selected, onChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const toggle = (name) => {
    onChange(selected.includes(name) ? selected.filter((h) => h !== name) : [...selected, name]);
  };

  const filtered = hotels.filter((h) => h.toLowerCase().includes(query.trim().toLowerCase()));

  const label = selected.length === 0 ? t('hotelFilter.allHotels') : t('hotelFilter.selected', { n: selected.length });

  return (
    <div className="tl-cal-field tl-country-field" ref={rootRef}>
      <button type="button" className="tl-blog-filter-pill tl-hotel-filter-trigger" onClick={() => setOpen((o) => !o)}>
        {label} ▾
      </button>

      {open && (
        <div className="tl-cal-popover tl-country-popover tl-hotel-filter-popover">
          <input
            ref={searchRef}
            type="text"
            className="tl-country-search"
            placeholder={t('hotelFilter.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="tl-country-list">
            {filtered.map((h) => (
              <label className="tl-hotel-filter-option" key={h}>
                <input type="checkbox" checked={selected.includes(h)} onChange={() => toggle(h)} />
                {h}
              </label>
            ))}
            {filtered.length === 0 && <div className="tl-country-empty">{t('hotelFilter.noResults')}</div>}
          </div>
          {selected.length > 0 && (
            <button type="button" className="tl-hotel-filter-clear" onClick={() => onChange([])}>
              {t('hotelFilter.clear', { n: selected.length })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
