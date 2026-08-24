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
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../src/data/shop/products.json');
const IMAGES_DIR = path.join(__dirname, '../public/images/shop/products');

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
    });
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(products, null, 2) + '\n');
  console.log(`Wrote ${products.length} products to ${path.relative(process.cwd(), OUT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
