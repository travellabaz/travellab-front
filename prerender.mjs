// Build-time SSG step: renders every route, in every supported language,
// to a real HTML string (via src/entry-server.jsx) and bakes it into its
// own dist/<lang-prefix><route>/index.html, with the same per-page
// <title>/meta/canonical/hreflang/breadcrumb values the client-side
// usePageMeta hook would otherwise only set after JS runs. This is what
// actually fixes indexing/link-preview for crawlers and bots that don't
// execute JavaScript (Yandex, WhatsApp, Telegram, Facebook…).
//
// Run after `vite build` (client) and `vite build --ssr` (server) have
// both produced their output — see the "build" script in package.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import i18next from 'i18next';
import { PAGE_META, BASE_URL } from './src/data/pageMeta.js';
import { VIZA_COUNTRIES } from './src/data/vizaCountries.js';
import { TOUR_SEARCH_COUNTRIES } from './src/data/tourSearchCountries.js';
import { truncate } from './src/utils/text.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const ssrDir = path.join(__dirname, 'dist-server');
const postsDir = path.join(__dirname, 'src/data/blog/posts');
const localesDir = path.join(__dirname, 'src/i18n/locales');

const LANGUAGES = ['az', 'ru', 'en'];
const DEFAULT_LANGUAGE = 'az';

// Static-route path -> seo.* translation namespace key — mirrors
// src/hooks/usePageMeta.js's SEO_KEY_BY_PATH exactly.
const SEO_KEY_BY_PATH = {
  '/': 'home',
  '/search': 'search',
  '/hotels': 'hotels',
  '/tours': 'tours',
  '/labpoint': 'labpoint',
  '/about': 'about',
  '/blog': 'blog',
  '/events': 'events',
  '/viza': 'viza',
  '/hediyye-karti': 'giftCard',
};

// Reads the JSON translation files straight off disk (not `import ... json`)
// — this script runs under plain `node`, not through Vite, and JSON import
// attribute syntax support varies by Node version; avoiding it entirely
// sidesteps that. Builds one i18next instance per language via the same
// `i18next` package the app itself uses, so title/desc strings here can
// never drift from what the client-side hook produces for the same route.
function loadTranslators() {
  const resources = {};
  for (const lang of LANGUAGES) {
    resources[lang] = { translation: JSON.parse(fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf-8')) };
  }
  const translators = {};
  for (const lang of LANGUAGES) {
    const instance = i18next.createInstance();
    instance.init({ resources, lng: lang, fallbackLng: DEFAULT_LANGUAGE, interpolation: { escapeValue: false }, initImmediate: false });
    translators[lang] = instance.getFixedT(lang);
  }
  return translators;
}

function buildLocalizedPath(bareRoutePath, lang) {
  if (lang === DEFAULT_LANGUAGE) return bareRoutePath;
  return bareRoutePath === '/' ? `/${lang}` : `/${lang}${bareRoutePath}`;
}

// Matches the default set in index.html and src/hooks/usePageMeta.js
// (the client-side equivalent of this file, for post-hydration route
// changes) — every page gets this unless it's a blog post, which uses
// its own cover image instead.
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/hero/balloons.jpg`;

// Same endpoint ToursContext.jsx fetches client-side — now backed by a real
// DB (site-backend's TourSyncJob), so /v1/tours only returns tours whose
// status isn't INACTIVE, each optionally carrying a Claude-generated
// metaTitle/metaDescription (null until the daily sync job reaches a new
// tour). /v1/tours/inactive lists tours the sync job has since retired —
// consumed only here, to write a 301 redirect for each one (see
// writeRedirects below) so a stale bookmark/crawled URL gets a real HTTP
// status instead of silently 200-ing into a client-side "not found" page.
const TOURS_API_URL = 'https://backend.travellab-point.az/site-backend/v1/tours';
const INACTIVE_TOURS_API_URL = 'https://backend.travellab-point.az/site-backend/v1/tours/inactive';

async function fetchActiveTours() {
  try {
    const res = await fetch(TOURS_API_URL);
    if (!res.ok) throw new Error(`tours request failed: ${res.status}`);
    const tours = await res.json();
    return (tours || []).filter((t) => t.id);
  } catch (err) {
    // Never fail the whole build over this — a sitemap/prerender missing
    // tour pages for one run is much better than a broken deploy.
    console.warn('Could not fetch live tours:', err.message);
    return [];
  }
}

async function fetchInactiveTourIds() {
  try {
    const res = await fetch(INACTIVE_TOURS_API_URL);
    if (!res.ok) throw new Error(`inactive tours request failed: ${res.status}`);
    const ids = await res.json();
    return (ids || []).filter(Boolean);
  } catch (err) {
    console.warn('Could not fetch inactive tours:', err.message);
    return [];
  }
}

// Prepends a 301 -> /tours rule for every inactive tour above the existing
// SPA catch-all (public/_redirects, already copied into dist/_redirects by
// vite build) — Netlify matches _redirects top to bottom, first rule wins.
// One rule per language prefix, so a stale /ru/tours/<id> bookmark also
// redirects correctly instead of falling through to the SPA catch-all.
function writeRedirects(inactiveTourIds) {
  const redirectsPath = path.join(distDir, '_redirects');
  const existing = fs.existsSync(redirectsPath) ? fs.readFileSync(redirectsPath, 'utf-8') : '';
  const inactiveLines = inactiveTourIds.flatMap((id) =>
    LANGUAGES.map((lang) => `${buildLocalizedPath(`/tours/${id}`, lang)}  ${buildLocalizedPath('/tours', lang)}  301`)
  ).join('\n');
  fs.writeFileSync(redirectsPath, inactiveLines ? `${inactiveLines}\n${existing}` : existing);
  console.log(`wrote ${inactiveTourIds.length * LANGUAGES.length} inactive-tour redirects to dist/_redirects`);
}

// Blog posts aren't in PAGE_META (that's a fixed route list) — they're one
// JSON file per post, so the route list has to be built from whatever
// files exist at build time instead of being hardcoded.
function loadBlogPosts() {
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(postsDir, f), 'utf-8')));
}

// Two post shapes: older AZ-only flat posts, newer posts with an az/ru/en
// key each — mirrors src/data/blog/index.js exactly (duplicated here since
// that file also imports React-y things prerender.mjs shouldn't need).
function hasLocaleVariants(post) {
  return !!(post.az || post.ru || post.en);
}

function isPostAvailableInLocale(post, lang) {
  if (!hasLocaleVariants(post)) return lang === DEFAULT_LANGUAGE;
  return !!post[lang];
}

function localizePost(post, lang) {
  if (!hasLocaleVariants(post)) return post;
  return { ...post, ...(post[lang] || post.az) };
}

function buildArticleJson(post, pageUrl, lang) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: `${BASE_URL}${post.coverImage}`,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'Travellab' },
    publisher: {
      '@type': 'Organization',
      name: 'Travellab',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    inLanguage: lang,
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setAttrById(html, id, attr, value) {
  const tagRe = new RegExp(`<[^>]*\\bid=["']${id}["'][^>]*>`, 'i');
  return html.replace(tagRe, (tag) => {
    const attrRe = new RegExp(`(${attr}=["'])([^"']*)(["'])`, 'i');
    const escaped = escapeHtml(value);
    return attrRe.test(tag) ? tag.replace(attrRe, (_, pre, _old, post) => pre + escaped + post) : tag.slice(0, -1) + ` ${attr}="${escaped}">`;
  });
}

function buildBreadcrumbJson(items) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  });
}

// hreflang alternates for a route: one per language the route actually
// exists in (see availableLangs per-entry below), plus x-default -> AZ.
function buildHreflangTags(bareRoutePath, availableLangs, extraQuery = '') {
  const tags = availableLangs.map(
    (lang) => `<link rel="alternate" hreflang="${lang}" href="${BASE_URL}${buildLocalizedPath(bareRoutePath, lang)}${extraQuery}" />`
  );
  if (availableLangs.includes(DEFAULT_LANGUAGE)) {
    tags.push(`<link rel="alternate" hreflang="x-default" href="${BASE_URL}${bareRoutePath}${extraQuery}" />`);
  }
  return tags.join('\n  ');
}

async function main() {
  const { render } = await import(path.join(ssrDir, 'entry-server.js'));
  const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  const translators = loadTranslators();

  const blogPosts = loadBlogPosts();
  const blogPostBySlug = Object.fromEntries(blogPosts.map((p) => [p.slug, p]));

  const activeTours = await fetchActiveTours();
  const toursById = Object.fromEntries(activeTours.map((t) => [String(t.id), t]));

  // One entry per bare (AZ) route path, describing what kind of page it is
  // and which languages it should be generated for. Built once, then the
  // actual per-language render loop below just reads from these.
  const routeEntries = [];

  for (const bareRoutePath of Object.keys(PAGE_META)) {
    routeEntries.push({ bareRoutePath, kind: 'static', langs: LANGUAGES });
  }
  for (const post of blogPosts) {
    const langs = LANGUAGES.filter((l) => isPostAvailableInLocale(post, l));
    routeEntries.push({ bareRoutePath: `/blog/${post.slug}`, kind: 'blog', slug: post.slug, langs });
  }
  for (const country of VIZA_COUNTRIES) {
    routeEntries.push({ bareRoutePath: `/viza/${country.slug}`, kind: 'vizaCountry', country, langs: LANGUAGES });
  }
  for (const country of TOUR_SEARCH_COUNTRIES) {
    routeEntries.push({ bareRoutePath: `/tours/search/${country.slug}`, kind: 'tourSearchCountry', country, langs: LANGUAGES });
  }
  for (const tour of activeTours) {
    routeEntries.push({ bareRoutePath: `/tours/${tour.id}`, kind: 'tour', tourId: String(tour.id), langs: LANGUAGES });
  }

  let renderCount = 0;
  for (const entry of routeEntries) {
    const { bareRoutePath, kind, langs } = entry;

    for (const lang of langs) {
      const t = translators[lang];
      const localizedRoutePath = buildLocalizedPath(bareRoutePath, lang);
      const isHome = localizedRoutePath === '' || localizedRoutePath === '/';
      const pageUrl = BASE_URL + (isHome ? '/' : localizedRoutePath);

      let title;
      let desc;
      let image;
      let post = null;
      let tour = null;

      if (kind === 'static') {
        const seoKey = SEO_KEY_BY_PATH[bareRoutePath];
        title = t(`seo.${seoKey}.title`);
        desc = t(`seo.${seoKey}.desc`);
        const staticImage = PAGE_META[bareRoutePath]?.image;
        image = staticImage ? (staticImage.startsWith('http') ? staticImage : `${BASE_URL}${staticImage}`) : DEFAULT_OG_IMAGE;
      } else if (kind === 'blog') {
        post = localizePost(blogPostBySlug[entry.slug], lang);
        title = `${post.title} — Travellab`;
        desc = post.metaDescription || post.excerpt;
        image = post.coverImage.startsWith('http') ? post.coverImage : `${BASE_URL}${post.coverImage}`;
      } else if (kind === 'vizaCountry') {
        const countryName = t(`countries.${entry.country.name}`, entry.country.name);
        title = t('seo.vizaCountryTitle', { country: countryName });
        desc = t('seo.vizaCountryDesc', { country: countryName });
        image = DEFAULT_OG_IMAGE;
      } else if (kind === 'tourSearchCountry') {
        const countryName = t(`countries.${entry.country.nameAz}`, entry.country.nameAz);
        title = t('seo.tourSearchCountryTitle', { country: countryName });
        desc = t('seo.tourSearchCountryDesc', { country: countryName });
        image = DEFAULT_OG_IMAGE;
      } else if (kind === 'tour') {
        tour = toursById[entry.tourId];
        title = tour.metaTitle || `${tour.title} — Travellab`;
        desc = tour.metaDescription || truncate(tour.description, 160) || t(`seo.tours.desc`);
        image = tour.imageUrl || DEFAULT_OG_IMAGE;
      }

      const appHtml = render(localizedRoutePath || '/');

      let html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
      html = html.replace(/<html lang="[^"]*"/i, `<html lang="${lang}"`);
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
      html = setAttrById(html, 'meta-desc', 'content', desc);
      html = setAttrById(html, 'canonical', 'href', pageUrl);
      html = setAttrById(html, 'og-title', 'content', title);
      html = setAttrById(html, 'og-desc', 'content', desc);
      html = setAttrById(html, 'og-url', 'content', pageUrl);
      html = setAttrById(html, 'og-image', 'content', image);
      html = setAttrById(html, 'og-locale', 'content', lang === 'az' ? 'az_AZ' : lang === 'ru' ? 'ru_RU' : 'en_US');
      html = setAttrById(html, 'twitter-title', 'content', title);
      html = setAttrById(html, 'twitter-desc', 'content', desc);
      html = setAttrById(html, 'twitter-image', 'content', image);

      const hreflangTags = buildHreflangTags(bareRoutePath, langs);
      html = html.replace('</head>', `  ${hreflangTags}\n  </head>`);

      const homeHref = BASE_URL + (buildLocalizedPath('/', lang) || '/');
      const breadcrumbItems = [{ name: t('breadcrumb.home'), url: homeHref }];
      if (kind === 'blog') {
        breadcrumbItems.push({ name: t('footer.blog'), url: `${BASE_URL}${buildLocalizedPath('/blog', lang)}` }, { name: post.title, url: pageUrl });
      } else if (kind === 'tour') {
        breadcrumbItems.push({ name: t('nav.tours'), url: `${BASE_URL}${buildLocalizedPath('/tours', lang)}` }, { name: tour.title, url: pageUrl });
      } else if (kind === 'vizaCountry') {
        const countryName = t(`countries.${entry.country.name}`, entry.country.name);
        breadcrumbItems.push(
          { name: t('nav.viza'), url: `${BASE_URL}${buildLocalizedPath('/viza', lang)}` },
          { name: t('viza.countryPageBreadcrumb', { country: countryName }), url: pageUrl }
        );
      } else if (kind === 'tourSearchCountry') {
        const countryName = t(`countries.${entry.country.nameAz}`, entry.country.nameAz);
        breadcrumbItems.push(
          { name: t('tourSearch.tourSearchCrumb'), url: `${BASE_URL}${buildLocalizedPath('/tours/search', lang)}` },
          { name: t('tourSearch.countryTitle', { country: countryName }), url: pageUrl }
        );
      } else if (!isHome) {
        breadcrumbItems.push({ name: title.split(' — ')[0], url: pageUrl });
      }
      html = html.replace(
        /(<script type="application\/ld\+json" id="breadcrumb-ld">)[\s\S]*?(<\/script>)/i,
        (_, open, close) => `${open}${buildBreadcrumbJson(breadcrumbItems)}${close}`
      );

      if (kind === 'blog') {
        const articleJson = buildArticleJson(post, pageUrl, lang);
        html = html.replace('</head>', `<script type="application/ld+json" id="article-ld">${articleJson}</script>\n  </head>`);
      }

      const outDir = isHome ? distDir : path.join(distDir, localizedRoutePath);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
      renderCount += 1;
    }
  }
  console.log(`prerendered ${renderCount} pages across ${routeEntries.length} routes x up to ${LANGUAGES.length} languages`);

  // Sitemap: one <url> per language variant of every route, each carrying
  // its own hreflang alternate entries (Google's documented multi-language
  // sitemap format) — blog posts only list the languages they actually
  // have, same rule as the prerender loop above.
  const urlEntries = routeEntries.flatMap(({ bareRoutePath, langs }) =>
    langs.map((lang) => {
      const localizedRoutePath = buildLocalizedPath(bareRoutePath, lang);
      const loc = `${BASE_URL}${localizedRoutePath || '/'}`;
      const alternates = langs
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}${buildLocalizedPath(bareRoutePath, l) || '/'}" />`)
        .join('\n');
      const defaultAlternate = langs.includes(DEFAULT_LANGUAGE)
        ? `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${bareRoutePath}" />`
        : '';
      return `  <url>\n    <loc>${loc}</loc>\n${alternates}${defaultAlternate}\n  </url>`;
    })
  );
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urlEntries.join('\n') +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
  console.log(`wrote dist/sitemap.xml (${urlEntries.length} URL entries, ${activeTours.length} live tours)`);

  const inactiveTourIds = await fetchInactiveTourIds();
  writeRedirects(inactiveTourIds);

  fs.rmSync(ssrDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
