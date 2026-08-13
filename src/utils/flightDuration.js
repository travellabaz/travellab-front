// Small locale-aware "Xh Ym" formatter for flight-route SEO body text
// (src/pages/FlightRoutePage.jsx) — abbreviated units throughout
// specifically to sidestep AZ/RU/EN having different pluralization rules
// for "hour(s)"/"minute(s)"; "2 saat 30 dəq" / "2 ч 30 мин" / "2h 30m"
// read fine singular or plural without needing per-language plural forms.
const UNITS = {
  az: { hour: 'saat', minute: 'dəq' },
  ru: { hour: 'ч', minute: 'мин' },
  en: { hour: 'h', minute: 'm' },
};

export function formatFlightDuration(totalMinutes, lang) {
  const units = UNITS[lang] || UNITS.az;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} ${units.minute}`;
  if (minutes === 0) return `${hours} ${units.hour}`;
  return `${hours} ${units.hour} ${minutes} ${units.minute}`;
}
