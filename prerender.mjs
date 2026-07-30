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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const ssrDir = path.join(__dirname, 'dist-server');

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

function buildBreadcrumbJson(pageUrl, title, isHome) {
  const items = [{ '@type': 'ListItem', position: 1, name: 'Ana səhifə', item: `${BASE_URL}/` }];
  if (!isHome) items.push({ '@type': 'ListItem', position: 2, name: title.split(' — ')[0], item: pageUrl });
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items });
}

async function main() {
  const { render } = await import(path.join(ssrDir, 'entry-server.js'));
  const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

  for (const routePath of Object.keys(PAGE_META)) {
    const meta = PAGE_META[routePath];
    const isHome = routePath === '/';
    const pageUrl = BASE_URL + (isHome ? '/' : routePath);
    const appHtml = render(routePath);

    let html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
    html = setAttrById(html, 'meta-desc', 'content', meta.desc);
    html = setAttrById(html, 'canonical', 'href', pageUrl);
    html = setAttrById(html, 'og-title', 'content', meta.title);
    html = setAttrById(html, 'og-desc', 'content', meta.desc);
    html = setAttrById(html, 'og-url', 'content', pageUrl);
    html = setAttrById(html, 'twitter-title', 'content', meta.title);
    html = setAttrById(html, 'twitter-desc', 'content', meta.desc);
    html = html.replace(
      /(<script type="application\/ld\+json" id="breadcrumb-ld">)[\s\S]*?(<\/script>)/i,
      (_, open, close) => `${open}${buildBreadcrumbJson(pageUrl, meta.title, isHome)}${close}`
    );

    const outDir = isHome ? distDir : path.join(distDir, routePath);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`prerendered ${routePath} -> ${path.relative(__dirname, path.join(outDir, 'index.html'))}`);
  }

  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    Object.keys(PAGE_META)
      .map((routePath) => `  <url><loc>${BASE_URL}${routePath === '/' ? '/' : routePath}</loc></url>`)
      .join('\n') +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
  console.log('wrote dist/sitemap.xml');

  fs.rmSync(ssrDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
