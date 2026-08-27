// Shared AZ-aware slug transliteration — used both at build time
// (scripts/sync-shop-products.mjs, a plain Node script that imports this
// same file) and at runtime (src/data/shop/index.js, for category slugs,
// which have to be computable in the browser too since getCategories()
// runs client-side). Mirrors the slugify() in scripts/generate-blog-post.mjs
// (kept separate rather than shared, since that script also handles
// non-AZ input and isn't otherwise coupled to shop data).
const AZ_MAP = { ə: 'e', ı: 'i', ğ: 'g', ş: 's', ç: 'c', ö: 'o', ü: 'u', Ə: 'e', İ: 'i', Ğ: 'g', Ş: 's', Ç: 'c', Ö: 'o', Ü: 'u' };

export function slugify(text) {
  return (text || '')
    .split('')
    .map((ch) => AZ_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
