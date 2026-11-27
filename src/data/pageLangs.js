// Pages whose given languages stay out of Google (noindex, no hreflang, not in the sitemap):
// Google showed /en/labpoint to Azerbaijani searchers instead of the AZ page.
// Read by prerender.mjs and usePageMeta.js.
export const NOINDEX_LANGS_BY_PATH = {
  '/labpoint': ['en'],
};

export function isPathIndexedInLang(barePath, lang) {
  return !(NOINDEX_LANGS_BY_PATH[barePath] || []).includes(lang);
}
