import products from './products.json';
import { slugify } from '../../utils/slugify';

// products.json is the build-time snapshot of the "Məhsullar" Google Sheet
// (see scripts/sync-shop-products.mjs) — this module is the only place the
// rest of the app should read shop data from, so the shape it hands out
// (categories split, images resolved, size groups, etc.) never needs
// re-deriving twice.

// Same product in different sizes gets one row per size in the Sheet (its
// own SKU/price/stock each), named "{Base name}/{Size} ölçüdə {dims}" —
// e.g. "Çamadan/S ölçüdə 52x30x28 sm", "Çamadan/M ölçüdə 57x33x32 sm".
// Listing those as separate cards reads as 3 different products for what
// is really one, sized differently — so everywhere *listing* products
// groups same-base-name rows into one card with a size picker (see
// getProductGroups); the cart/wishlist/detail page still deal in actual
// SKUs underneath, since a customer ultimately orders one specific size.
const SIZE_VARIANT_RE = /^(.+)\/(XS|S|M|L|XL)\s+öl[cç]üdə/i;
const SIZE_ORDER = { XS: 0, S: 1, M: 2, L: 3, XL: 4 };

function parseSizeVariant(product) {
  const m = SIZE_VARIANT_RE.exec(product.name);
  return m ? { baseName: m[1].trim(), size: m[2].toUpperCase() } : null;
}

export function getAllProducts() {
  return products;
}

// Case-insensitive on purpose: Netlify/Cloudflare 301s every URL on this
// site to an all-lowercase, trailing-slash canonical form (confirmed live
// — /Shop and /shop both end up at /shop/, same for every other route).
// Product URLs use the lowercase SKU (see productSlug) precisely so that
// redirect never has to fire, but a stray uppercase link/bookmark still
// needs to resolve instead of hitting "not found".
export function getProductBySku(sku) {
  if (!sku) return null;
  const needle = sku.toLowerCase();
  return products.find((p) => p.sku.toLowerCase() === needle) || null;
}

// The product's URL slug — a name-derived, human-readable, keyword-
// carrying path segment (e.g. "premium-camadan"), written into
// products.json by scripts/sync-shop-products.mjs (which also tracks
// slug history there so a name edit gets a 301, not a 404 — see
// src/data/shop/slugRedirects.json and prerender.mjs). SKU stays the
// stable internal id (cart/wishlist keys, WhatsApp messages); slug is
// purely the public-facing URL — see getProductBySku for the SKU-based
// lookup this is deliberately kept separate from.
export function productSlug(product) {
  return product.slug || product.sku.toLowerCase();
}

export function getProductBySlug(slug) {
  if (!slug) return null;
  const needle = slug.toLowerCase();
  return products.find((p) => productSlug(p) === needle) || null;
}

// Category names are free text from the Sheet's "Kateqoriya" column, not
// a fixed enum — the slug is derived the same way every time (not
// persisted/tracked for redirects like product slugs) since a category
// rename is rare and, unlike a product, has no per-item history to lose.
export function categorySlug(categoryName) {
  return slugify(categoryName);
}

export function getCategoryBySlug(slug) {
  if (!slug) return null;
  return getCategories().find((c) => categorySlug(c) === slug) || null;
}

// Snapshot shape CartContext/WishlistContext store — sku doubles as the
// cart/wishlist line id, `product:${sku}` unique across both item kinds.
export function toCartItem(product) {
  return {
    kind: 'product',
    id: product.sku,
    title: product.name,
    price: product.price,
    currency: product.currency,
    image: product.images[0] || null,
    url: `/shop/${productSlug(product)}`,
  };
}

// One entry per distinct product line: { id, name, categories, variants
// (sorted XS→XL), defaultVariant (smallest size), minPrice, bestseller,
// inStock, colors (union across variants) }. A product with no size in
// its name is its own single-variant group. Map preserves first-seen
// order, so group order still matches Sheet row order like the flat list.
export function getProductGroups() {
  const groups = new Map();
  for (const p of products) {
    const parsed = parseSizeVariant(p);
    const key = parsed ? `size:${parsed.baseName}` : `single:${p.sku}`;
    if (!groups.has(key)) {
      groups.set(key, { id: key, name: parsed ? parsed.baseName : p.name, categories: p.categories, variants: [] });
    }
    groups.get(key).variants.push({ ...p, size: parsed ? parsed.size : null });
  }
  return Array.from(groups.values()).map((g) => {
    g.variants.sort((a, b) => (SIZE_ORDER[a.size] ?? 0) - (SIZE_ORDER[b.size] ?? 0));
    g.defaultVariant = g.variants[0];
    g.bestseller = g.variants.some((v) => v.bestseller);
    g.inStock = g.variants.some((v) => v.inStock);
    g.minPrice = Math.min(...g.variants.map((v) => v.price));
    g.colors = Array.from(new Set(g.variants.flatMap((v) => v.colors)));
    return g;
  });
}

export function getGroupBySku(sku) {
  if (!sku) return null;
  const needle = sku.toLowerCase();
  return getProductGroups().find((g) => g.variants.some((v) => v.sku.toLowerCase() === needle)) || null;
}

export function getBestsellerGroups(limit = 5) {
  return getProductGroups()
    .filter((g) => g.bestseller)
    .slice(0, limit);
}

// Sheet order == insertion order == "newest last", so a product's
// position in the array already doubles as its recency rank.
export function getCategories() {
  const set = new Set();
  products.forEach((p) => p.categories.forEach((c) => set.add(c)));
  return Array.from(set);
}

export function getRelatedProductGroups(group, limit = 4) {
  return getProductGroups()
    .filter((g) => g.id !== group.id && g.categories.some((c) => group.categories.includes(c)))
    .slice(0, limit);
}

export function sortProductGroups(list, sortKey) {
  const sorted = [...list];
  if (sortKey === 'cheapest') sorted.sort((a, b) => a.minPrice - b.minPrice);
  else if (sortKey === 'expensive') sorted.sort((a, b) => b.minPrice - a.minPrice);
  else sorted.reverse(); // 'newest' — later sheet rows were added more recently
  return sorted;
}
