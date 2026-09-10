import { slugify } from '../utils/slugify.js';
import { getTourCategory } from '../utils/tourCategory.js';

// Sub-category (city / country) filters under the Türkiyə, Avropa and
// Asiya destination tabs. Same keyword-derivation model as
// utils/tourCategory.js — tours arrive as free-form Instagram captions
// with no structured tags, so a sub-category "contains" a tour when the
// caption mentions one of its keywords AND the tour already resolves to
// the matching parent category.
//
// Plain JS/ESM (no JSX) so prerender.mjs can import it directly at build
// time, same convention as tourSearchCountries.js / vizaCountries.js.
// Parent keys match TOUR_CATEGORIES[].name exactly.
const RAW = {
  'Türkiyə': [
    ['İstanbul', ['istanbul']],
    ['Antalya', ['antalya']],
    ['Bodrum', ['bodrum']],
    ['Trabzon', ['trabzon']],
    ['Alanya', ['alanya']],
    ['Kuşadası', ['kuşadası', 'kusadasi']],
    ['Marmaris', ['marmaris']],
    ['Fethiye', ['fethiye', 'fethiyə']],
    ['Kapadokiya', ['kapadok']],
  ],
  'Avropa': [
    ['Macarıstan', ['macarıstan', 'budapeş']],
    ['Böyük Britaniya', ['böyük britaniya', 'london', 'ingiltərə', 'britaniya']],
    ['İtaliya', ['italiya', ' roma', 'romaya', 'romada', 'milan', 'venesiya', 'florensiya']],
    ['İspaniya', ['ispaniya', 'barselona', 'madrid']],
    ['Fransa', ['fransa', 'paris']],
    ['Yunanıstan', ['yunanıstan', 'afina', 'santorini', 'mikonos']],
    ['Gürcüstan', ['gürcüstan', 'tbilisi', 'batumi']],
    ['Çexiya', ['çexiya', 'praga', 'praqa']],
    ['Portuqaliya', ['portuqaliya', 'lissabon']],
    ['Monteneqro', ['monteneqro', 'budva', 'kotor']],
  ],
  'Asiya': [
    ['Tailand', ['tailand', 'tayland', 'bangkok', 'pattaya', 'puket']],
    ['Şri-Lanka', ['şri lanka', 'şri-lanka', 'sri lanka']],
    ['Bali', ['bali']],
    ['BƏƏ', ['bəə', 'dubay', 'şərcə', 'abu-dabi', 'abu dabi', 'əmirlik']],
    ['Maldiv', ['maldiv']],
    ['Misir', ['misir', 'şarm', 'hurqada']],
    ['Vyetnam', ['vyetnam', 'nyatranq', 'hanoy']],
    ['Malayziya', ['malayziya', 'kuala-lumpur', 'kuala lumpur']],
    // Not bare 'qatar' — it's also the AZ word for "train" ("qatar
    // bileti") and appears in "Qatar hava yolları" (airline) transit notes.
    ['Qatar', ['qatar turu', 'qatara', 'doha turu', 'dohaya']],
    ['Çin', ['çin turu', 'çində', 'çinə', 'çin səyah', 'pekin', 'şanxay']],
    ['Yaponiya', ['yaponiya', 'tokio', 'osaka']],
  ],
};

// Per-language slug overrides, keyed by AZ name. Only the ones that
// actually differ per language are listed — proper-noun cities
// (İstanbul, Antalya…) reuse the AZ slug in every language, so they're
// omitted. Same per-language slug scheme as the blog / viza pages.
const SUB_SLUGS = {
  'İstanbul': { ru: 'stambul' },
  'Kuşadası': { ru: 'kushadasy' },
  'Fethiye': { ru: 'fethie' },
  'Kapadokiya': { en: 'cappadocia', ru: 'kappadokiya' },
  'Macarıstan': { en: 'hungary', ru: 'vengriya' },
  'Böyük Britaniya': { en: 'united-kingdom', ru: 'velikobritaniya' },
  'İtaliya': { en: 'italy', ru: 'italiya' },
  'İspaniya': { en: 'spain', ru: 'ispaniya' },
  'Fransa': { en: 'france', ru: 'frantsiya' },
  'Yunanıstan': { en: 'greece', ru: 'gretsiya' },
  'Gürcüstan': { en: 'georgia', ru: 'gruziya' },
  'Çexiya': { en: 'czechia', ru: 'chehiya' },
  'Portuqaliya': { en: 'portugal', ru: 'portugaliya' },
  'Monteneqro': { en: 'montenegro', ru: 'chernogoriya' },
  'Tailand': { en: 'thailand' },
  'Şri-Lanka': { ru: 'shri-lanka' },
  'BƏƏ': { en: 'uae', ru: 'oae' },
  'Maldiv': { en: 'maldives', ru: 'maldivy' },
  'Misir': { en: 'egypt', ru: 'egipet' },
  'Vyetnam': { en: 'vietnam', ru: 'vetnam' },
  'Malayziya': { en: 'malaysia' },
  'Qatar': { ru: 'katar' },
  'Çin': { en: 'china', ru: 'kitay' },
  'Yaponiya': { en: 'japan' },
};

export const TOUR_SUBCATEGORIES = Object.fromEntries(
  Object.entries(RAW).map(([parent, subs]) => [
    parent,
    subs.map(([name, keywords]) => {
      const slug = slugify(name);
      const o = SUB_SLUGS[name] || {};
      return { name, keywords, slug, slugs: { az: slug, en: o.en || slug, ru: o.ru || slug } };
    }),
  ])
);

// Parent tab name -> its URL slug segment per language
// (/<lang>/tours/<parent>/<sub>).
const PARENT_SLUGS_BY_LANG = {
  'Türkiyə': { az: 'turkiye', en: 'turkey', ru: 'turtsiya' },
  'Avropa': { az: 'avropa', en: 'europe', ru: 'evropa' },
  'Asiya': { az: 'asiya', en: 'asia', ru: 'aziya' },
};

// Back-compat: the bare AZ parent slug map (used where locale isn't known).
export const TOUR_PARENT_SLUGS = Object.fromEntries(
  Object.entries(PARENT_SLUGS_BY_LANG).map(([name, s]) => [name, s.az])
);

export function tourParentSlug(parentName, locale) {
  const s = PARENT_SLUGS_BY_LANG[parentName];
  return s ? s[locale] || s.az : null;
}

export function tourSubSlug(sub, locale) {
  return (sub.slugs && sub.slugs[locale]) || sub.slug;
}

const PARENT_BY_SLUG = {};
for (const [name, s] of Object.entries(PARENT_SLUGS_BY_LANG)) {
  for (const slug of Object.values(s)) PARENT_BY_SLUG[slug] = name;
}

export function getParentBySlug(slug) {
  return PARENT_BY_SLUG[slug] || null;
}

export function getSubcategory(parentName, subSlug) {
  return (
    (TOUR_SUBCATEGORIES[parentName] || []).find(
      (s) => s.slug === subSlug || (s.slugs && Object.values(s.slugs).includes(subSlug))
    ) || null
  );
}

export function tourMatchesSubcategory(tour, sub) {
  const text = `${tour.title || ''} ${tour.description || ''}`.toLocaleLowerCase('az');
  return sub.keywords.some((kw) => text.includes(kw));
}

// A sub-category "is active" (renders / gets a prerendered page / lands in
// the sitemap) only when at least one live tour resolves to its parent
// category AND matches one of its keywords — the client's "boş kateqoriya
// render olunmur" rule.
export function getActiveSubcategories(tours, parentName) {
  const subs = TOUR_SUBCATEGORIES[parentName] || [];
  const parentTours = tours.filter((t) => getTourCategory(t).name === parentName);
  return subs.filter((sub) => parentTours.some((t) => tourMatchesSubcategory(t, sub)));
}

export function filterToursForSubcategory(tours, parentName, sub) {
  return tours.filter(
    (t) => getTourCategory(t).name === parentName && tourMatchesSubcategory(t, sub)
  );
}
