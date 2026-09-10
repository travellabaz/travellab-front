import { slugify } from '../utils/slugify.js';

// Single source of truth for the Viza form's country list AND its
// per-country pages (VizaCountryPage.jsx) — used by prerender.mjs too
// (plain JS/ESM, no JSX, so it's importable directly from Node there).
//
// `name` is the AZ name and the i18n key (countries.<name>). `slug` is the
// canonical (AZ) URL slug; `slugs` holds one per language so /en/ and /ru/
// viza URLs read in their own language (…/en/visa/germany, not
// …/en/visa/almaniya) — mirrors the blog per-language slug scheme. The
// en/ru slugs are written out here (not derived from i18n) so this file
// stays a self-contained plain-Node import.
const SCHENGEN = [
  { name: 'Almaniya', en: 'germany', ru: 'germaniya' },
  { name: 'Fransa', en: 'france', ru: 'frantsiya' },
  { name: 'İtaliya', en: 'italy', ru: 'italiya' },
  { name: 'İspaniya', en: 'spain', ru: 'ispaniya' },
  { name: 'Avstriya', en: 'austria', ru: 'avstriya' },
  { name: 'Niderland', en: 'netherlands', ru: 'niderlandy' },
  { name: 'Yunanıstan', en: 'greece', ru: 'gretsiya' },
  { name: 'Çexiya', en: 'czechia', ru: 'chehiya' },
  { name: 'Polşa', en: 'poland', ru: 'polsha' },
  { name: 'Macarıstan', en: 'hungary', ru: 'vengriya' },
  { name: 'Portuqaliya', en: 'portugal', ru: 'portugaliya' },
  { name: 'İsveçrə', en: 'switzerland', ru: 'shveytsariya' },
];
const OTHER = [
  { name: 'Böyük Britaniya', en: 'united-kingdom', ru: 'velikobritaniya' },
  { name: 'Amerika Birləşmiş Ştatları', en: 'united-states', ru: 'ssha' },
  { name: 'Kanada', en: 'canada', ru: 'kanada' },
  { name: 'Birləşmiş Ərəb Əmirlikləri', en: 'united-arab-emirates', ru: 'oae' },
  { name: 'Çin', en: 'china', ru: 'kitay' },
  { name: 'Yaponiya', en: 'japan', ru: 'yaponiya' },
  { name: 'Cənubi Koreya', en: 'south-korea', ru: 'yuzhnaya-koreya' },
  { name: 'Hindistan', en: 'india', ru: 'indiya' },
  { name: 'Tailand', en: 'thailand', ru: 'tailand' },
  { name: 'Vyetnam', en: 'vietnam', ru: 'vetnam' },
  { name: 'Rusiya', en: 'russia', ru: 'rossiya' },
  { name: 'Avstraliya', en: 'australia', ru: 'avstraliya' },
];

function toCountries(rows, group) {
  return rows.map(({ name, en, ru }) => {
    const slug = slugify(name);
    return { name, slug, slugs: { az: slug, en, ru }, group };
  });
}

export const VIZA_COUNTRIES_SCHENGEN = toCountries(SCHENGEN, 'schengen');
export const VIZA_COUNTRIES_OTHER = toCountries(OTHER, 'other');
export const VIZA_COUNTRIES = [...VIZA_COUNTRIES_SCHENGEN, ...VIZA_COUNTRIES_OTHER];

export function vizaCountrySlug(country, locale) {
  return (country.slugs && country.slugs[locale]) || country.slug;
}

export function getVizaCountryBySlug(slug) {
  return (
    VIZA_COUNTRIES.find(
      (c) => c.slug === slug || (c.slugs && Object.values(c.slugs).includes(slug))
    ) || null
  );
}
