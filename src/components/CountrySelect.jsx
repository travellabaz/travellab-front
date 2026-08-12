import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Shared popover-styled dropdown for every "pick a country" field on the
// site (tour search destination, viza country) — replaces the native
// <select>, which looks and behaves differently per OS/browser and can't
// be styled to match the rest of the search bar. Accepts either a flat
// `options` list or grouped `groups` (each { label, options }), matching
// how VizaSection splits Şengen vs Digər ölkələr.
export default function CountrySelect({ label, value, onChange, options, groups, extraOption, placeholder, disabled, fieldClassName, triggerClassName }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const allOptions = useMemo(() => {
    if (groups) return groups.flatMap((g) => g.options).concat(extraOption ? [extraOption] : []);
    return (options || []).concat(extraOption ? [extraOption] : []);
  }, [options, groups, extraOption]);

  const selected = allOptions.find((o) => String(o.value) === String(value));
  const showSearch = allOptions.length > 8;

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open && showSearch) searchRef.current?.focus();
  }, [open, showSearch]);

  const pick = (v) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  const matches = (o) => o.label.toLowerCase().includes(query.trim().toLowerCase());

  const renderOption = (o) => (
    <button
      type="button"
      key={o.value}
      className={`tl-country-option${String(o.value) === String(value) ? ' active' : ''}`}
      onClick={() => pick(o.value)}
    >
      {o.label}
    </button>
  );

  return (
    <div className={`tl-cal-field tl-country-field${fieldClassName ? ' ' + fieldClassName : ''}`} ref={rootRef}>
      {label && <label>{label}</label>}
      <button
        type="button"
        className={triggerClassName || 'tl-cal-trigger'}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        {selected ? selected.label : (placeholder || t('countrySelect.select'))}
      </button>

      {open && (
        <div className="tl-cal-popover tl-country-popover">
          {showSearch && (
            <input
              ref={searchRef}
              type="text"
              className="tl-country-search"
              placeholder={t('countrySelect.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <div className="tl-country-list">
            {groups ? (
              groups.map((g) => {
                const visible = g.options.filter(matches);
                if (visible.length === 0) return null;
                return (
                  <div key={g.label} className="tl-country-group">
                    <div className="tl-country-group-label">{g.label}</div>
                    {visible.map(renderOption)}
                  </div>
                );
              })
            ) : (
              (options || []).filter(matches).map(renderOption)
            )}
            {extraOption && matches(extraOption) && renderOption(extraOption)}
            {allOptions.filter(matches).length === 0 && (
              <div className="tl-country-empty">{t('countrySelect.noResults')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
