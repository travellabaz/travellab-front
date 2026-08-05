// Same transliteration table as scripts/generate-blog-post.mjs's slugify()
// — kept as a separate copy since that script runs standalone under Node
// outside the Vite/React build and can't import from here.
const MAP = { ə: 'e', ı: 'i', ğ: 'g', ş: 's', ç: 'c', ö: 'o', ü: 'u', Ə: 'e', İ: 'i', Ğ: 'g', Ş: 's', Ç: 'c', Ö: 'o', Ü: 'u' };

export function slugify(text) {
  return text
    .split('')
    .map((ch) => MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
