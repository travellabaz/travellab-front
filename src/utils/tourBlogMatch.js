import { BLOG_POSTS, isPostAvailableInLocale, localizePost } from '../data/blog';

const TRIP_GUIDE_CATEGORY = 'Getməzdən Əvvəl';

// A couple of guide posts' slug-prefix city name doesn't match how a tour
// caption spells the same city — every other guide already matches by
// plain word match once normalized.
const CITY_ALIASES = {
  barselona: ['barcelona'],
  dubay: ['dubai'],
  roma: ['rome'],
  tbilisi: ['tiflis'],
};

function normalize(str) {
  return (str || '')
    .toLocaleLowerCase('az')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasWord(haystack, word) {
  return new RegExp(`\\b${word}\\b`).test(haystack);
}

// Finds the "Getməzdən Əvvəl" trip guide for a tour's destination city, if
// one exists — the itinerary page links to this instead of repeating any
// general city/country intro itself (see the Itinerary brief's
// duplicate-content note: the same "about this city" text living on both
// pages could hurt both of their rankings).
export function findDestinationGuidePost(destination, locale) {
  const dest = normalize(destination);
  if (!dest) return null;
  for (const post of BLOG_POSTS) {
    if (post.category !== TRIP_GUIDE_CATEGORY) continue;
    if (!isPostAvailableInLocale(post, locale)) continue;
    const cityKey = post.slug.split('-')[0];
    const candidates = [cityKey, ...(CITY_ALIASES[cityKey] || [])];
    if (candidates.some((c) => hasWord(dest, c))) {
      return localizePost(post, locale);
    }
  }
  return null;
}
