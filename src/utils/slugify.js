// Shared AZ + RU + Latin slug transliteration — used both at build time
// (scripts/*.mjs, plain Node scripts that import this file) and at runtime
// (src/data/shop/index.js for category slugs, blog per-locale slug
// resolution). Mirrors the slugify() in scripts/generate-blog-post.mjs.
const AZ_MAP = { ə: 'e', ı: 'i', ğ: 'g', ş: 's', ç: 'c', ö: 'o', ü: 'u', Ə: 'e', İ: 'i', Ğ: 'g', Ş: 's', Ç: 'c', Ö: 'o', Ü: 'u' };

// Cyrillic -> Latin, so a Russian title produces a readable Latin slug
// (kak-najti-deshevye-aviabilety-iz-baku) instead of getting stripped to
// nothing by the [^a-z0-9] filter below.
const RU_MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const CHAR_MAP = { ...AZ_MAP };
for (const [k, v] of Object.entries(RU_MAP)) {
  CHAR_MAP[k] = v;
  CHAR_MAP[k.toUpperCase()] = v;
}

export function slugify(text) {
  const s = (text || '')
    .split('')
    .map((ch) => CHAR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length <= 60) return s;
  // Cut at the last word boundary inside the limit so a slug never ends
  // mid-word (…deshevye-aviabilety-iz-ba).
  const cut = s.slice(0, 60);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 20 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '');
}
