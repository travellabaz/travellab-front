// Single source of truth for the numbers/hours that appear in more than
// one place (About page hero + stats band, CTA band) — per the Haqqımızda
// spec: "Statistika rəqəmləri bir mərkəzi config-də, iş saatları da eyni
// şəkildə bir mərkəzi config-də". Day-range/closed labels themselves are
// still translated per language via i18n; this only holds the numbers and
// hour strings, which don't vary by language.

export const STATS = [
  { n: '5+', key: 'statYears' },
  { n: '10K+', key: 'statCustomers' },
  { n: '20K+', key: 'statDestinations' },
  { n: '10+', key: 'statTeam' },
];

// Mon–Fri share the same hours (confirmed: "Cümə" is a working day, not
// closed like the spec's shorthand "B.e – C. axşamı" seemed to imply).
export const BUSINESS_HOURS = {
  weekday: '10:00 – 18:30',
  saturday: '11:00 – 16:00',
  sundayClosed: true,
};
