import { slugify } from '../utils/slugify.js';

// Single source of truth for the Viza form's country list AND its
// per-country pages (VizaCountryPage.jsx) — used by prerender.mjs too
// (plain JS/ESM, no JSX, so it's importable directly from Node there).
const SCHENGEN_NAMES = ['Almaniya', 'Fransa', 'İtaliya', 'İspaniya', 'Avstriya', 'Niderland', 'Yunanıstan', 'Çexiya', 'Polşa', 'Macarıstan', 'Portuqaliya', 'İsveçrə'];
const OTHER_NAMES = ['Böyük Britaniya', 'Amerika Birləşmiş Ştatları', 'Kanada', 'Birləşmiş Ərəb Əmirlikləri', 'Çin', 'Yaponiya', 'Cənubi Koreya', 'Hindistan', 'Tailand', 'Vyetnam', 'Rusiya', 'Avstraliya'];

function toCountries(names, group) {
  return names.map((name) => ({ name, slug: slugify(name), group }));
}

export const VIZA_COUNTRIES_SCHENGEN = toCountries(SCHENGEN_NAMES, 'schengen');
export const VIZA_COUNTRIES_OTHER = toCountries(OTHER_NAMES, 'other');
export const VIZA_COUNTRIES = [...VIZA_COUNTRIES_SCHENGEN, ...VIZA_COUNTRIES_OTHER];

export function getVizaCountryBySlug(slug) {
  return VIZA_COUNTRIES.find((c) => c.slug === slug) || null;
}
