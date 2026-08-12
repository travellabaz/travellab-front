import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n';

// Path-prefix locale detection: AZ (default) lives unprefixed at the
// current URLs (so existing indexed pages never move), RU/EN live under
// /ru/* and /en/*. Never derived from Accept-Language/geo — see the i18n
// plan's reasoning for why a visible switcher drives locale, not
// auto-detection.
export function getLocaleFromPathname(pathname) {
  const segment = pathname.split('/')[1];
  return SUPPORTED_LANGUAGES.includes(segment) && segment !== DEFAULT_LANGUAGE ? segment : DEFAULT_LANGUAGE;
}

// Strips a /ru or /en prefix, always returning a path starting with "/".
// Used anywhere code compares location.pathname against a bare route
// (e.g. App.jsx's HeroSearch visibility check) so it works the same
// regardless of which locale prefix, if any, is present.
export function stripLocalePrefix(pathname) {
  const segment = pathname.split('/')[1];
  if (SUPPORTED_LANGUAGES.includes(segment) && segment !== DEFAULT_LANGUAGE) {
    const rest = pathname.slice(segment.length + 1);
    return rest === '' ? '/' : rest;
  }
  return pathname;
}

// Builds the equivalent path under a different locale, preserving
// whatever route/params the visitor is currently on (e.g. switching from
// /ru/viza/turkiye to English goes to /en/viza/turkiye, not back home).
export function buildLocalizedPath(pathname, targetLang) {
  const bare = stripLocalePrefix(pathname);
  if (targetLang === DEFAULT_LANGUAGE) return bare;
  return bare === '/' ? `/${targetLang}` : `/${targetLang}${bare}`;
}
