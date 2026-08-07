import { slugify } from '../utils/slugify.js';

// Single source of truth for the tour search's per-country pages
// (TourSearchCountryPage.jsx) and prerender.mjs — plain JS/ESM (no JSX) so
// it's importable directly from Node at build time, same convention as
// vizaCountries.js.
//
// Kompas's destinations endpoint (GET /v1/tours/offers/destinations) is the
// live source of truth for which countries are actually searchable and
// only returns Russian names (e.g. "Египет") — there's no stable numeric
// id we control, so `nameRu` here is a join key matched against that live
// list at request time (client-side in TourSearchPage.jsx, and at build
// time in prerender.mjs), not a hardcoded id. AZ names reuse the existing
// vizaCountries.js spellings for countries that appear in both lists.
const COUNTRIES = [
  { nameAz: 'Avstriya', nameRu: 'Австрия' },
  { nameAz: 'Yunanıstan', nameRu: 'Греция' },
  { nameAz: 'Gürcüstan', nameRu: 'Грузия' },
  { nameAz: 'Misir', nameRu: 'Египет' },
  { nameAz: 'Zanzibar (Tanzaniya)', nameRu: 'Занзибар (Танзания)' },
  { nameAz: 'Hindistan', nameRu: 'Индия' },
  { nameAz: 'İndoneziya', nameRu: 'Индонезия' },
  { nameAz: 'İslandiya', nameRu: 'Исландия' },
  { nameAz: 'Qazaxıstan', nameRu: 'Казахстан' },
  { nameAz: 'Keniya', nameRu: 'Кения' },
  { nameAz: 'Çin', nameRu: 'Китай' },
  { nameAz: 'Mavriki', nameRu: 'Маврикий' },
  { nameAz: 'Malayziya', nameRu: 'Малайзия' },
  { nameAz: 'Maldiv adaları', nameRu: 'Мальдивы' },
  { nameAz: 'Birləşmiş Ərəb Əmirlikləri', nameRu: 'ОАЭ' },
  { nameAz: 'Sinqapur', nameRu: 'Сингапур' },
  { nameAz: 'Amerika Birləşmiş Ştatları', nameRu: 'США' },
  { nameAz: 'Tailand', nameRu: 'Таиланд' },
  { nameAz: 'Türkiyə', nameRu: 'Турция' },
  { nameAz: 'Özbəkistan', nameRu: 'Узбекистан' },
  { nameAz: 'Monteneqro', nameRu: 'Черногория' },
  { nameAz: 'İsveçrə', nameRu: 'Швейцария' },
  { nameAz: 'Şri-Lanka', nameRu: 'Шри-Ланка' },
  { nameAz: 'Yaponiya', nameRu: 'Япония' },
];

export const TOUR_SEARCH_COUNTRIES = COUNTRIES.map((c) => ({ ...c, slug: slugify(c.nameAz) }));

export function getTourSearchCountryBySlug(slug) {
  return TOUR_SEARCH_COUNTRIES.find((c) => c.slug === slug) || null;
}
