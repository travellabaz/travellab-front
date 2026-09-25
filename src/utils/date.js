const AZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
  'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

const AZ_MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyun', 'İyul', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];

// "2026-08-01" -> "1 Avqust 2026"
export function formatDateAz(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${AZ_MONTHS[month - 1]} ${year}`;
}

// Full date + time for a datetime ISO string, e.g. "2026-10-03T18:05:00"
// -> "3 Oktyabr 2026, 18:05". A manual month-name table rather than
// Intl/toLocaleString('az-AZ', ...) — confirmed live that the browser's
// az-AZ locale data doesn't have real month names, so
// {month:'short'/'long'} silently falls back to ICU's generic "M10"-style
// placeholder instead of an actual Azerbaijani name.
export function formatDateTimeAz(isoDateTime) {
  if (!isoDateTime) return '';
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return isoDateTime;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

// Date only (no time) for a datetime ISO string -> "3 Oktyabr 2026".
export function formatDateOnlyAz(isoDateTime) {
  if (!isoDateTime) return '';
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return isoDateTime;
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Day number + short month name, for compact date badges (event cards).
export function formatDayMonthAz(isoDateTime) {
  if (!isoDateTime) return null;
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return null;
  return { day: String(d.getDate()), month: AZ_MONTHS_SHORT[d.getMonth()] };
}
