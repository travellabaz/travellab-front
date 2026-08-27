// Pulls the "Məhsullar" sheet (Travellab Shop's admin-panel substitute) as
// CSV, downloads each product's photos out of Drive into
// public/images/shop/, and writes src/data/shop/products.json pointing at
// those local files. Run by .github/workflows/daily-tour-sync-rebuild.yml;
// safe to run locally too (`node scripts/sync-shop-products.mjs`).
//
// Images are downloaded, not hotlinked, for two reasons found the hard way
// while building this:
//  1. Drive's own hotlink endpoints (uc?export=view, and even the
//     thumbnail endpoint) rate-limit aggressively per file/IP — confirmed
//     live, a handful of rapid requests to the same file was enough to
//     start getting HTTP 429. A real storefront with real traffic would
//     see broken product images intermittently.
//  2. Downloading the actual bytes lets this script tell a real photo from
//     an unconverted RAW file by its magic bytes, which a content-type
//     header from Drive's preview pipeline can't (Drive happily generates
//     a JPEG *preview* of a RAW file, which would have hidden the problem
//     the task called out rather than catching it).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { slugify } from '../src/utils/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../src/data/shop/products.json');
const REDIRECTS_PATH = path.join(__dirname, '../src/data/shop/slugRedirects.json');
const IMAGES_DIR = path.join(__dirname, '../public/images/shop/products');

// Same Gemini setup as scripts/generate-blog-post.mjs (see that file for
// why "-latest" aliases + a distinct fallback model tier) — reused here
// rather than duplicated with different names, since it's the exact same
// account/key/failure modes.
const GEMINI_PRIMARY_MODEL = 'gemini-flash-latest';
const GEMINI_FALLBACK_MODEL = 'gemini-flash-lite-latest';
const geminiEndpoint = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// A sized variant's raw Sheet name carries its size/dimensions suffix
// (e.g. "Premium Çamadan/S ölçüdə 52x30x28 sm" — see SIZE_VARIANT_RE in
// src/data/shop/index.js, duplicated here rather than imported — that
// module also `import`s products.json itself, which would be a
// confusing circular read of the very file this script is about to
// overwrite). Used both for slugging (baseSlugFor below) and for the
// "clean" name fed to Gemini / the templated fallback, so SEO copy talks
// about "Premium Çamadan", not the raw per-row Sheet name.
const SIZE_VARIANT_RE = /^(.+)\/(XS|S|M|L|XL)\s+öl[cç]üdə/i;
function productDisplayName(name) {
  const m = SIZE_VARIANT_RE.exec(name);
  return m ? m[1].trim() : name;
}

const SHEET_ID = '1f-0xHhGXWoE0Pnb8mJl7Xs9gQQcD3TcxTQaxeEqDbJM';
const SHEET_NAME = 'Məhsullar';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

const DRIVE_FILE_ID_RE = /\/file\/d\/([^/]+)/;
// Real photo formats an <img> can render. RAW formats (.ARW/.CR2/.NEF/...)
// and anything else fall through to the warning below instead of silently
// becoming a broken image on the live site.
const MAGIC_BYTES = [
  { ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, webp: true },
];

function detectImageExt(buf) {
  for (const m of MAGIC_BYTES) {
    if (buf.length < m.bytes.length) continue;
    const matches = m.bytes.every((b, i) => buf[i] === b);
    if (matches && (!m.webp || buf.slice(8, 12).toString('ascii') === 'WEBP')) return m.ext;
  }
  return null;
}

function driveFileId(link) {
  const trimmed = (link || '').trim();
  if (!trimmed) return null;
  const match = DRIVE_FILE_ID_RE.exec(trimmed);
  return match ? match[1] : null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One retry with backoff — Drive's thumbnail endpoint rate-limits (429)
// under bursts; a sync run touching dozens of images is exactly a burst.
async function fetchWithRetry(url, attempt = 1) {
  const res = await fetch(url, { redirect: 'follow' });
  if (res.status === 429 && attempt < 3) {
    await sleep(attempt * 1500);
    return fetchWithRetry(url, attempt + 1);
  }
  return res;
}

// Downloads one Drive file's photo to public/images/shop/products/, named
// by SKU + index so re-running the sync overwrites in place instead of
// accumulating stale files. Returns the site-relative path, or null (with
// a console warning) if the link didn't resolve to a real image.
async function downloadProductImage(link, sku, index) {
  const id = driveFileId(link);
  if (!id) return null;

  const url = `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
  let res;
  try {
    res = await fetchWithRetry(url);
  } catch (err) {
    console.warn(`[${sku}] image ${index}: network error (${err.message}), skipping`);
    return null;
  }
  if (!res.ok) {
    console.warn(`[${sku}] image ${index}: Drive returned ${res.status}, skipping`);
    return null;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const ext = detectImageExt(buf);
  if (!ext) {
    console.warn(`[${sku}] image ${index}: not a recognizable image (likely an unconverted RAW/.ARW file) — export it to JPG/WEBP and re-upload to Drive`);
    return null;
  }

  const filename = `${sku}-${index}.${ext}`;
  fs.writeFileSync(path.join(IMAGES_DIR, filename), buf);
  // Small pacing gap between downloads, not just on retry — keeps a
  // 70+-product sync well under Drive's per-minute threshold instead of
  // relying on the retry path to paper over it.
  await sleep(250);
  return `/images/shop/products/${filename}`;
}

async function downloadProductImages(rawLinks, sku) {
  const results = [];
  let index = 1;
  for (const link of rawLinks) {
    if (!link || !link.trim()) continue;
    // eslint-disable-next-line no-await-in-loop
    const localPath = await downloadProductImage(link, sku, index);
    if (localPath) results.push(localPath);
    index += 1;
  }
  return results;
}

// Minimal RFC4180 CSV parser (quoted fields, "" escape, embedded newlines)
// — the Təsvir column has real multi-line descriptions, so a naive
// split('\n')/split(',') would corrupt every row after the first one.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else if (c === '\r' && text[i + 1] === '\n') {
        // normalize CRLF -> LF inside quoted multi-line fields (Təsvir)
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      // skip — \n right after handles the line break
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function splitList(value) {
  return (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Cache key for a product's generated SEO copy — regenerate only when
// something that copy actually depends on changes (name/category/price/
// description), not on every daily sync run. Keeping this a hash instead
// of just re-checking each field individually means one line covers
// "did anything relevant change" without the two call sites (write here,
// compare in loadPreviousSeoBySku) having to agree field-by-field.
function seoCacheKey(product) {
  return crypto.createHash('sha1').update(`${product.name}|${product.categories.join(',')}|${product.price}|${product.description}`).digest('hex').slice(0, 12);
}

function loadPreviousSeoBySku() {
  if (!fs.existsSync(OUT_PATH)) return {};
  try {
    const prev = JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8'));
    return Object.fromEntries(prev.filter((p) => p.metaFeature && p.seoParagraph).map((p) => [p.sku, p]));
  } catch (err) {
    console.warn(`Could not read previous ${OUT_PATH} for SEO cache (${err.message}) — regenerating everything`);
    return {};
  }
}

async function callGemini(prompt, model = GEMINI_PRIMARY_MODEL) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const res = await fetch(`${geminiEndpoint(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`No text in Gemini response: ${JSON.stringify(data)}`);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`No JSON object in Gemini output:\n${text}`);
  return JSON.parse(text.slice(start, end + 1));
}

// Two short AZ-only text fields for Shop SEO Paketi (shop content is AZ-
// only site-wide already — see the Sheet's single "Ad (AZ)" column, no
// per-language variants like blog/tour posts have): `metaFeature` is the
// "{1 əsas xüsusiyyət}" clause the <meta description> template plugs in,
// `seoParagraph` is the ~100-150 word page-end SEO_BODY_TEXT block (see
// SeoBodyText.jsx). Generated once per product and cached in
// products.json (see seoCacheKey) — regenerated only when the product's
// name/category/price/description actually changes, so a normal daily
// sync run (nothing edited) makes zero Gemini calls for this. Non-fatal
// on failure: the sync must never fail (and thus skip a whole day's
// product update) just because copy-generation hiccuped — falls back to
// a plain templated line instead.
async function generateProductSeoCopy(product) {
  const name = productDisplayName(product.name);
  const prompt = `Sən Travellab Shop (Bakıda fəaliyyət göstərən Travellab səyahət agentliyinin onlayn mağazası) üçün SEO mətn yazıçısısan.

Məhsul: "${name}"
Kateqoriya: ${product.categories.join(', ') || 'Ümumi'}
Qiymət: ${product.price} ${product.currency}
Mövcud təsvir: ${product.description || '(yoxdur)'}

Bu məhsul üçün İKİ mətn yaz, Azərbaycan dilində:
1. "feature" — meta description-un içində istifadə olunacaq, məhsulun BİR əsas üstünlüyünü vurğulayan çox qısa cümlə (təxminən 4-9 söz, nöqtə ilə bitsin). Reklam şüarı kimi deyil, sadə və konkret yaz.
2. "seoParagraph" — səhifənin sonunda göstəriləcək 100-150 söz uzunluğunda unikal bir paraqraf. Məhsulun adını, "${product.categories[0] || ''}" kateqoriyasını və "Travellab Shop" ifadəsini təbii şəkildə, bir dəfə-iki dəfə keçir. Reklam kimi səslənməyən, faydalı, təbii yazılmış mətn olsun — məhsulun nə üçün faydalı olduğunu, kimin üçün uyğun olduğunu izah et.

Cavabı YALNIZ bu JSON formatında ver, başqa heç nə yazma: {"feature": "...", "seoParagraph": "..."}`;

  try {
    const json = await callGemini(prompt, GEMINI_PRIMARY_MODEL);
    if (json.feature && json.seoParagraph) return json;
    throw new Error(`Incomplete response: ${JSON.stringify(json)}`);
  } catch (primaryErr) {
    console.warn(`[${product.sku}] SEO copy (primary model) failed: ${primaryErr.message} — trying fallback model`);
    try {
      const json = await callGemini(prompt, GEMINI_FALLBACK_MODEL);
      if (json.feature && json.seoParagraph) return json;
      throw new Error(`Incomplete response: ${JSON.stringify(json)}`);
    } catch (fallbackErr) {
      console.warn(`[${product.sku}] SEO copy (fallback model) also failed: ${fallbackErr.message} — using a templated fallback`);
      return null;
    }
  }
}

// Slugging the raw size-suffixed name ("...52x30x28-sm") would be an
// ugly URL for no benefit; "{base-name}-{size}" (e.g. "camadan-s") reads
// better and is still unique across a group's variants. Uses the same
// SIZE_VARIANT_RE as productDisplayName above, just keeping the size
// letter instead of discarding it.
function baseSlugFor(name) {
  const m = SIZE_VARIANT_RE.exec(name);
  return m ? `${slugify(m[1].trim())}-${m[2].toLowerCase()}` : slugify(name);
}

// Assigns each product a unique slug (de-duped with a -2/-3/... suffix in
// the rare case two different products slugify to the same thing) and
// updates the on-disk slug history in place: a SKU whose computed slug
// changed since the last run (i.e. its Sheet name was edited) gets its
// old slug appended to `previous`, so prerender.mjs can 301 it instead of
// it 404ing. `history` is mutated and returned for convenience.
function assignSlugs(products, history) {
  const used = new Set();
  for (const p of products) {
    const base = baseSlugFor(p.name) || p.sku.toLowerCase();
    let slug = base;
    let n = 2;
    while (used.has(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    used.add(slug);
    p.slug = slug;

    const entry = history[p.sku];
    if (!entry) {
      history[p.sku] = { current: slug, previous: [] };
    } else if (entry.current !== slug) {
      if (!entry.previous.includes(entry.current)) entry.previous.push(entry.current);
      entry.current = slug;
    }
  }
  return history;
}

function loadSlugHistory() {
  if (!fs.existsSync(REDIRECTS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(REDIRECTS_PATH, 'utf-8'));
  } catch (err) {
    console.warn(`Could not parse ${REDIRECTS_PATH} (${err.message}) — starting fresh`);
    return {};
  }
}

async function main() {
  console.log(`Fetching ${CSV_URL}`);
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status} ${res.statusText}`);
  const csvText = await res.text();
  const rows = parseCsv(csvText);
  const [header, ...dataRows] = rows;
  const col = (name) => header.indexOf(name);

  const idx = {
    sku: col('SKU'),
    name: col('Ad (AZ)'),
    category: col('Kateqoriya'),
    price: col('Qiymət'),
    currency: col('Valyuta'),
    colors: col('Rənglər'),
    image1: col('Şəkil linki 1'),
    image2: col('Şəkil linki 2'),
    image3: col('Şəkil linki 3'),
    image4: col('Şəkil linki 4'),
    description: col('Təsvir'),
    stock: col('Stok'),
    bestseller: col('Bestseller'),
    // Optional — Shop SEO Paketi's per-category keyword pair, entered on
    // every row of that category (same duplication pattern "Kateqoriya"
    // itself already uses). col() returns -1 until these two columns
    // exist in the Sheet; every read below is written to tolerate that
    // (undefined -> '' -> null) rather than assume they're there.
    keywordP1: col('Açar söz P1'),
    keywordP2: col('Açar söz P2'),
  };

  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const products = [];
  for (const row of dataRows) {
    const sku = (row[idx.sku] || '').trim();
    const name = (row[idx.name] || '').trim();
    // Structured-but-empty rows (SKU reserved, nothing else filled yet)
    // aren't real products — skip until the sheet owner fills them in.
    if (!sku || !name) continue;

    const rawImages = [row[idx.image1], row[idx.image2], row[idx.image3], row[idx.image4]];
    // eslint-disable-next-line no-await-in-loop
    const images = await downloadProductImages(rawImages, sku);

    products.push({
      sku,
      name,
      categories: splitList(row[idx.category]),
      price: Number(row[idx.price]) || 0,
      currency: (row[idx.currency] || 'AZN').trim(),
      colors: splitList(row[idx.colors]),
      images,
      description: (row[idx.description] || '').trim(),
      inStock: (row[idx.stock] || '').trim() !== 'Yox',
      bestseller: (row[idx.bestseller] || '').trim() === 'Bəli',
      keywordP1: (row[idx.keywordP1] || '').trim() || null,
      keywordP2: (row[idx.keywordP2] || '').trim() || null,
    });
  }

  const previousSeoBySku = loadPreviousSeoBySku();
  for (const p of products) {
    const cacheKey = seoCacheKey(p);
    const cached = previousSeoBySku[p.sku];
    if (cached && cached.seoCacheKey === cacheKey) {
      p.metaFeature = cached.metaFeature;
      p.seoParagraph = cached.seoParagraph;
    } else {
      // eslint-disable-next-line no-await-in-loop
      const generated = await generateProductSeoCopy(p);
      if (generated) {
        p.metaFeature = generated.feature;
        p.seoParagraph = generated.seoParagraph;
      } else {
        // Deterministic fallback so the site never ships a blank field —
        // not uniquely written per product, but still correct/usable
        // (see generateProductSeoCopy's comment on why generation
        // failures must never fail the whole sync).
        p.metaFeature = 'Keyfiyyətli və sərfəli seçim.';
        p.seoParagraph = `${productDisplayName(p.name)} Travellab Shop-da ${p.categories[0] || 'səyahət aksesuarları'} kateqoriyasında sərfəli qiymətə təqdim olunur. Orijinal keyfiyyət və sürətli çatdırılma ilə, WhatsApp vasitəsilə asanlıqla sifariş verə bilərsiniz.`;
      }
    }
    p.seoCacheKey = cacheKey;
  }

  const slugHistory = assignSlugs(products, loadSlugHistory());

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(products, null, 2) + '\n');
  fs.writeFileSync(REDIRECTS_PATH, JSON.stringify(slugHistory, null, 2) + '\n');
  console.log(`Wrote ${products.length} products to ${path.relative(process.cwd(), OUT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
