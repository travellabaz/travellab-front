// Build-time SSG step: renders every route to a real HTML string (via
// src/entry-server.jsx) and bakes it into its own dist/<route>/index.html,
// with the same per-page <title>/meta/canonical/breadcrumb values the
// client-side usePageMeta hook would otherwise only set after JS runs.
// This is what actually fixes indexing/link-preview for crawlers and bots
// that don't execute JavaScript (Yandex, WhatsApp, Telegram, Facebook…).
//
// Run after `vite build` (client) and `vite build --ssr` (server) have
// both produced their output — see the "build" script in package.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGE_META, BASE_URL } from './src/data/pageMeta.js';
import { VIZA_COUNTRIES } from './src/data/vizaCountries.js';
import { TOUR_SEARCH_COUNTRIES } from './src/data/tourSearchCountries.js';
import { truncate } from './src/utils/text.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const ssrDir = path.join(__dirname, 'dist-server');
const postsDir = path.join(__dirname, 'src/data/blog/posts');

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
function writeRedirects(inactiveTourIds) {
  const redirectsPath = path.join(distDir, '_redirects');
  const existing = fs.existsSync(redirectsPath) ? fs.readFileSync(redirectsPath, 'utf-8') : '';
  const inactiveLines = inactiveTourIds.map((id) => `/tours/${id}  /tours  301`).join('\n');
  fs.writeFileSync(redirectsPath, inactiveLines ? `${inactiveLines}\n${existing}` : existing);
  console.log(`wrote ${inactiveTourIds.length} inactive-tour redirects to dist/_redirects`);
}

// Blog posts aren't in PAGE_META (that's a fixed route list) — they're one
// JSON file per post, so the route list has to be built from whatever
// files exist at build time instead of being hardcoded. Keyed by route path
// so the main loop can also pull the full post (image/date/excerpt) to
// build the BlogPosting JSON-LD below.
function loadBlogPosts() {
  const postsByRoute = {};
  for (const file of fs.readdirSync(postsDir)) {
    if (!file.endsWith('.json')) continue;
    const post = JSON.parse(fs.readFileSync(path.join(postsDir, file), 'utf-8'));
    postsByRoute[`/blog/${post.slug}`] = post;
  }
  return postsByRoute;
}

function buildArticleJson(post, pageUrl) {
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

async function main() {
  const { render } = await import(path.join(ssrDir, 'entry-server.js'));
  const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  const blogPosts = loadBlogPosts();
  const blogRouteMeta = Object.fromEntries(
    Object.entries(blogPosts).map(([route, post]) => [route, { title: `${post.title} — Travellab`, desc: post.metaDescription || post.excerpt }])
  );
  // Unlike tours (a live Instagram feed, fetched at build time only for the
  // sitemap below), the country list is static data already in the repo —
  // these pages get the full prerender treatment, same as blog posts.
  const vizaRouteMeta = Object.fromEntries(
    VIZA_COUNTRIES.map((c) => [
      `/viza/${c.slug}`,
      {
        title: `${c.name} Vizası - Sənədlər və Şərtlər | Travellab`,
        desc: `${c.name} vizası üçün lazımi sənədlər, müddət və qiymət. Travellab ilə sürətli və etibarlı viza xidməti. İndi müraciət edin!`,
      },
    ])
  );
  // Same reasoning as vizaRouteMeta: the country LIST is static/known at
  // build time even though the actual search results (live Kompas prices)
  // aren't — these pages get the full prerender treatment (title/meta/
  // breadcrumb + the search form's static shell), not live offer data.
  const tourSearchRouteMeta = Object.fromEntries(
    TOUR_SEARCH_COUNTRIES.map((c) => [
      `/tours/search/${c.slug}`,
      {
        title: `${c.nameAz} turları — canlı qiymətlər — Travellab`,
        desc: `${c.nameAz} üçün canlı otel qiymətlərini axtarın — tarix, gecə sayı və ulduza görə filtrləyin, ən uyğun təklifi seçin.`,
      },
    ])
  );
  // Active Instagram-sourced tours, now DB-backed (site-backend's
  // TourSyncJob) — real content, so these get the full prerender treatment
  // like blog posts, falling back to the tour's own title/description
  // when Claude hasn't generated metaTitle/metaDescription yet.
  const activeTours = await fetchActiveTours();
  const toursByRoute = Object.fromEntries(activeTours.map((t) => [`/tours/${t.id}`, t]));
  const tourRouteMeta = Object.fromEntries(
    activeTours.map((t) => [
      `/tours/${t.id}`,
      {
        title: t.metaTitle || `${t.title} — Travellab`,
        desc: t.metaDescription || truncate(t.description, 160) || 'Travellab-da tur təklifi.',
      },
    ])
  );
  const allRouteMeta = { ...PAGE_META, ...blogRouteMeta, ...vizaRouteMeta, ...tourSearchRouteMeta, ...tourRouteMeta };

  for (const routePath of Object.keys(allRouteMeta)) {
    const meta = allRouteMeta[routePath];
    const isHome = routePath === '/';
    const pageUrl = BASE_URL + (isHome ? '/' : routePath);
    const post = blogPosts[routePath];
    const tour = toursByRoute[routePath];
    const vizaCountry = VIZA_COUNTRIES.find((c) => `/viza/${c.slug}` === routePath);
    const tourSearchCountry = TOUR_SEARCH_COUNTRIES.find((c) => `/tours/search/${c.slug}` === routePath);
    const image = post
      ? (post.coverImage.startsWith('http') ? post.coverImage : `${BASE_URL}${post.coverImage}`)
      : tour && tour.imageUrl
        ? tour.imageUrl
        : meta.image
          ? (meta.image.startsWith('http') ? meta.image : `${BASE_URL}${meta.image}`)
          : DEFAULT_OG_IMAGE;
    const appHtml = render(routePath);

    let html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
    html = setAttrById(html, 'meta-desc', 'content', meta.desc);
    html = setAttrById(html, 'canonical', 'href', pageUrl);
    html = setAttrById(html, 'og-title', 'content', meta.title);
    html = setAttrById(html, 'og-desc', 'content', meta.desc);
    html = setAttrById(html, 'og-url', 'content', pageUrl);
    html = setAttrById(html, 'og-image', 'content', image);
    html = setAttrById(html, 'twitter-title', 'content', meta.title);
    html = setAttrById(html, 'twitter-desc', 'content', meta.desc);
    html = setAttrById(html, 'twitter-image', 'content', image);

    const breadcrumbItems = [{ name: 'Ana səhifə', url: `${BASE_URL}/` }];
    if (post) {
      breadcrumbItems.push({ name: 'Bloq', url: `${BASE_URL}/blog` }, { name: post.title, url: pageUrl });
    } else if (tour) {
      breadcrumbItems.push({ name: 'Turlar', url: `${BASE_URL}/tours` }, { name: tour.title, url: pageUrl });
    } else if (vizaCountry) {
      breadcrumbItems.push({ name: 'Viza', url: `${BASE_URL}/viza` }, { name: `${vizaCountry.name} vizası`, url: pageUrl });
    } else if (tourSearchCountry) {
      breadcrumbItems.push(
        { name: 'Tur axtarışı', url: `${BASE_URL}/tours/search` },
        { name: `${tourSearchCountry.nameAz} turları`, url: pageUrl }
      );
    } else if (!isHome) {
      breadcrumbItems.push({ name: meta.title.split(' — ')[0], url: pageUrl });
    }
    html = html.replace(
      /(<script type="application\/ld\+json" id="breadcrumb-ld">)[\s\S]*?(<\/script>)/i,
      (_, open, close) => `${open}${buildBreadcrumbJson(breadcrumbItems)}${close}`
    );

    if (blogPosts[routePath]) {
      const articleJson = buildArticleJson(blogPosts[routePath], pageUrl);
      html = html.replace('</head>', `<script type="application/ld+json" id="article-ld">${articleJson}</script>\n  </head>`);
    }

    const outDir = isHome ? distDir : path.join(distDir, routePath);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`prerendered ${routePath} -> ${path.relative(__dirname, path.join(outDir, 'index.html'))}`);
  }

  // allRouteMeta already includes one entry per active tour (tourRouteMeta,
  // merged in above), so the sitemap naturally only lists active tours —
  // no separate tour fetch needed here.
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    Object.keys(allRouteMeta).map((routePath) => `  <url><loc>${BASE_URL}${routePath === '/' ? '/' : routePath}</loc></url>`).join('\n') +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
  console.log(`wrote dist/sitemap.xml (${activeTours.length} tour URLs)`);

  const inactiveTourIds = await fetchInactiveTourIds();
  writeRedirects(inactiveTourIds);

  fs.rmSync(ssrDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
