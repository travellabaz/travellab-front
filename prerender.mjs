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
import { FLIGHT_ROUTES } from './src/data/flightRoutes.js';
import { truncate } from './src/utils/text.js';
import { toAccusative } from './src/utils/ruGrammar.js';
import { slugify } from './src/utils/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const ssrDir = path.join(__dirname, 'dist-server');
const postsDir = path.join(__dirname, 'src/data/blog/posts');
const shopProductsPath = path.join(__dirname, 'src/data/shop/products.json');
const shopSlugRedirectsPath = path.join(__dirname, 'src/data/shop/slugRedirects.json');
const localesDir = path.join(__dirname, 'src/i18n/locales');
const CURRENT_YEAR = new Date().getFullYear();

// A sized variant's raw Sheet name carries its size/dimensions suffix
// (e.g. "Premium Çamadan/S ölçüdə 52x30x28 sm" — see SIZE_VARIANT_RE in
// src/data/shop/index.js and scripts/sync-shop-products.mjs, duplicated
// here for the same "this script can't import that module" reason noted
// on shopCategories below). Title/schema/breadcrumb must show the clean
// group name ("Premium Çamadan"), not the raw per-row Sheet name — the
// PDP itself already shows group.name; the prerendered <title> silently
// didn't match that until this was added.
const SIZE_VARIANT_RE = /^(.+)\/(XS|S|M|L|XL)\s+öl[cç]üdə/i;
function productDisplayName(rawName) {
  const m = SIZE_VARIANT_RE.exec(rawName);
  return m ? m[1].trim() : rawName;
}

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
  '/endirimler': 'endirimler',
  '/shop': 'shop',
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
function writeRedirects(inactiveTourIds, shopProducts, slugHistory) {
  const redirectsPath = path.join(distDir, '_redirects');
  const existing = fs.existsSync(redirectsPath) ? fs.readFileSync(redirectsPath, 'utf-8') : '';
  const inactiveLines = inactiveTourIds.flatMap((id) =>
    LANGUAGES.map((lang) => `${buildLocalizedPath(`/tours/${id}`, lang)}  ${buildLocalizedPath('/tours', lang)}  301`)
  );

  // Shop URLs moved from SKU (/shop/tb-020) to a name-derived slug
  // (/shop/premium-camadan) — see Shop SEO Paketi. Two redirect sources,
  // both per language prefix:
  //  1. Every product's SKU-based URL always differs from its slug now
  //     (computed fresh each build, no history needed — SKU is stable).
  //  2. Slug *history*, for a product whose Sheet name (and so slug) was
  //     edited after this migration — see scripts/sync-shop-products.mjs's
  //     assignSlugs, which appends the old slug to slugHistory[sku].previous
  //     every time the computed slug changes, so this covers every past
  //     slug a product has ever had, not just its immediately-previous one.
  const shopLines = shopProducts.flatMap((product) => {
    const slug = product.slug || product.sku.toLowerCase();
    const skuPath = product.sku.toLowerCase();
    const previousSlugs = slugHistory[product.sku]?.previous || [];
    const oldPaths = [skuPath, ...previousSlugs].filter((old) => old && old !== slug);
    return oldPaths.flatMap((old) =>
      LANGUAGES.map((lang) => `${buildLocalizedPath(`/shop/${old}`, lang)}  ${buildLocalizedPath(`/shop/${slug}`, lang)}  301`)
    );
  });

  const allLines = [...inactiveLines, ...shopLines].join('\n');
  fs.writeFileSync(redirectsPath, allLines ? `${allLines}\n${existing}` : existing);
  console.log(`wrote ${inactiveLines.length} inactive-tour redirects and ${shopLines.length} shop slug redirects to dist/_redirects`);
}

// Blog posts aren't in PAGE_META (that's a fixed route list) — they're one
// JSON file per post, so the route list has to be built from whatever
// files exist at build time instead of being hardcoded.
// Same build-time snapshot ShopPage/ShopProductPage read via
// src/data/shop/index.js — read straight off disk here too (see
// loadTranslators above for why this file avoids `import ... json`).
function loadShopProducts() {
  if (!fs.existsSync(shopProductsPath)) return [];
  return JSON.parse(fs.readFileSync(shopProductsPath, 'utf-8'));
}

// { [sku]: { current, previous: [...] } } — written by
// scripts/sync-shop-products.mjs whenever a product's Sheet name (and so
// its slug) changes, so the old URL 301s here instead of 404ing.
function loadShopSlugRedirects() {
  if (!fs.existsSync(shopSlugRedirectsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(shopSlugRedirectsPath, 'utf-8'));
  } catch {
    return {};
  }
}

// Distinct category names in first-seen (== Sheet row) order, each with
// its slug and one representative product to use as the category page's
// og:image — mirrors getCategories()/categorySlug() in src/data/shop/
// index.js (duplicated rather than imported, same reasoning as
// hasLocaleVariants et al. below: this script runs under plain node, and
// that module also does its own `import products.json`).
function shopCategories(products) {
  const seen = new Map();
  for (const p of products) {
    for (const cat of p.categories) {
      if (!seen.has(cat)) seen.set(cat, { name: cat, slug: slugify(cat), products: [] });
      seen.get(cat).products.push(p);
    }
  }
  return Array.from(seen.values());
}

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

  const shopProducts = loadShopProducts();

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
  for (const route of FLIGHT_ROUTES) {
    routeEntries.push({ bareRoutePath: `/ucuslar/${route.slug}`, kind: 'flightRoute', flightRoute: route, langs: LANGUAGES });
  }
  for (const tour of activeTours) {
    routeEntries.push({ bareRoutePath: `/tours/${tour.id}`, kind: 'tour', tourId: String(tour.id), langs: LANGUAGES });
  }
  for (const product of shopProducts) {
    // slug (not SKU) is the public URL now — see productSlug() in
    // src/data/shop/index.js and Shop SEO Paketi. Already lowercase from
    // slugify(), but .toLowerCase() stays as a defensive no-op: Netlify/
    // Cloudflare 301s every URL on this site to an all-lowercase
    // canonical form (confirmed live), so the prerendered file has to
    // already live at that path or the redirect lands on "not found".
    const slug = (product.slug || product.sku.toLowerCase()).toLowerCase();
    routeEntries.push({ bareRoutePath: `/shop/${slug}`, kind: 'shopProduct', product, langs: LANGUAGES });
  }
  const categories = shopCategories(shopProducts);
  for (const category of categories) {
    routeEntries.push({ bareRoutePath: `/shop/${category.slug}`, kind: 'shopCategory', category, langs: LANGUAGES });
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
        // "Виза в Грецию", not the bare nominative — see src/utils/ruGrammar.js.
        const countryNameAcc = toAccusative(countryName, lang);
        title = t('seo.vizaCountryTitle', { country: countryNameAcc });
        desc = t('seo.vizaCountryDesc', { country: countryNameAcc });
        image = DEFAULT_OG_IMAGE;
      } else if (kind === 'tourSearchCountry') {
        const countryName = t(`countries.${entry.country.nameAz}`, entry.country.nameAz);
        title = t('seo.tourSearchCountryTitle', { country: countryName });
        desc = t('seo.tourSearchCountryDesc', { country: countryName });
        image = DEFAULT_OG_IMAGE;
      } else if (kind === 'flightRoute') {
        const destinationName = t(`flightCities.${entry.flightRoute.cityKey}`, entry.flightRoute.cityKey);
        title = t('seo.flightRouteTitle', { origin: t('flights.baku'), destination: destinationName });
        desc = t('seo.flightRouteDesc', { destination: destinationName });
        image = DEFAULT_OG_IMAGE;
      } else if (kind === 'tour') {
        tour = toursById[entry.tourId];
        title = tour.metaTitle || `${tour.title} — Travellab`;
        desc = tour.metaDescription || truncate(tour.description, 160) || t(`seo.tours.desc`);
        image = tour.imageUrl || DEFAULT_OG_IMAGE;
      } else if (kind === 'shopProduct') {
        const product = entry.product;
        const displayName = productDisplayName(product.name);
        // "{name} - {price} {currency} | Travellab Shop" — Shop SEO Paketi's
        // required title shape; no year here (a single product doesn't get
        // stale the way a "Collection 2026"-style category page would).
        title = `${displayName} - ${product.price} ${product.currency} | Travellab Shop`;
        const feature = product.metaFeature || truncate(product.description, 60) || '';
        desc = t('seo.shopProductDesc', { name: displayName, price: product.price, currency: product.currency, feature }).replace(/\s+/g, ' ').trim();
        image = product.images[0] || DEFAULT_OG_IMAGE;
      } else if (kind === 'shopCategory') {
        const { category } = entry;
        title = t('seo.shopCategoryTitle', { category: category.name, year: CURRENT_YEAR });
        desc = t('seo.shopCategoryDesc', { category: category.name });
        const withImage = category.products.find((p) => p.images[0]);
        image = withImage ? withImage.images[0] : DEFAULT_OG_IMAGE;
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
      } else if (kind === 'shopProduct') {
        breadcrumbItems.push({ name: t('shop.breadcrumb'), url: `${BASE_URL}${buildLocalizedPath('/shop', lang)}` });
        const productCategory = entry.product.categories[0];
        if (productCategory) {
          breadcrumbItems.push({ name: productCategory, url: `${BASE_URL}${buildLocalizedPath(`/shop/${slugify(productCategory)}`, lang)}` });
        }
        breadcrumbItems.push({ name: productDisplayName(entry.product.name), url: pageUrl });
      } else if (kind === 'shopCategory') {
        breadcrumbItems.push({ name: t('shop.breadcrumb'), url: `${BASE_URL}${buildLocalizedPath('/shop', lang)}` }, { name: entry.category.name, url: pageUrl });
      } else if (kind === 'vizaCountry') {
        const countryName = t(`countries.${entry.country.name}`, entry.country.name);
        const countryNameAcc = toAccusative(countryName, lang);
        breadcrumbItems.push(
          { name: t('nav.viza'), url: `${BASE_URL}${buildLocalizedPath('/viza', lang)}` },
          { name: t('viza.countryPageBreadcrumb', { country: countryNameAcc }), url: pageUrl }
        );
      } else if (kind === 'tourSearchCountry') {
        const countryName = t(`countries.${entry.country.nameAz}`, entry.country.nameAz);
        breadcrumbItems.push(
          { name: t('tourSearch.tourSearchCrumb'), url: `${BASE_URL}${buildLocalizedPath('/tours/search', lang)}` },
          { name: t('tourSearch.countryTitle', { country: countryName }), url: pageUrl }
        );
      } else if (kind === 'flightRoute') {
        const destinationName = t(`flightCities.${entry.flightRoute.cityKey}`, entry.flightRoute.cityKey);
        breadcrumbItems.push(
          { name: t('nav.flights'), url: `${BASE_URL}${buildLocalizedPath('/search', lang)}` },
          { name: t('flights.routeBreadcrumb', { origin: t('flights.baku'), destination: destinationName }), url: pageUrl }
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
      } else if (kind === 'shopProduct') {
        const product = entry.product;
        const productJson = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: productDisplayName(product.name),
          image: product.images.length ? product.images.map((src) => (src.startsWith('http') ? src : `${BASE_URL}${src}`)) : undefined,
          description: product.description || undefined,
          sku: product.sku,
          brand: { '@type': 'Brand', name: 'Travellab' },
          offers: {
            '@type': 'Offer',
            url: pageUrl,
            priceCurrency: product.currency,
            price: String(product.price),
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: { '@type': 'Organization', name: 'Travellab' },
          },
        });
        html = html.replace('</head>', `<script type="application/ld+json" id="product-ld">${productJson}</script>\n  </head>`);
      } else if (kind === 'shopCategory') {
        const itemListJson = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: entry.category.products.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${BASE_URL}${buildLocalizedPath(`/shop/${(p.slug || p.sku.toLowerCase())}`, lang)}`,
          })),
        });
        html = html.replace('</head>', `<script type="application/ld+json" id="itemlist-ld">${itemListJson}</script>\n  </head>`);
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
  const slugHistory = loadShopSlugRedirects();
  writeRedirects(inactiveTourIds, shopProducts, slugHistory);

  fs.rmSync(ssrDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
