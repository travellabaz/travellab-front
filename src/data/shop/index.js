import products from './products.json';

// products.json is the build-time snapshot of the "Məhsullar" Google Sheet
// (see scripts/sync-shop-products.mjs) — this module is the only place the
// rest of the app should read shop data from, so the shape it hands out
// (categories split, images resolved, etc.) never needs re-deriving twice.

export function getAllProducts() {
  return products;
}

export function getProductBySku(sku) {
  return products.find((p) => p.sku === sku) || null;
}

export function getBestsellers(limit = 5) {
  return products.filter((p) => p.bestseller).slice(0, limit);
}

// Sheet order == insertion order == "newest last", so a product's
// position in the array already doubles as its recency rank.
export function getCategories() {
  const set = new Set();
  products.forEach((p) => p.categories.forEach((c) => set.add(c)));
  return Array.from(set);
}

export function getProductsByCategory(category) {
  if (!category) return products;
  return products.filter((p) => p.categories.includes(category));
}

export function getRelatedProducts(product, limit = 4) {
  return products
    .filter((p) => p.sku !== product.sku && p.categories.some((c) => product.categories.includes(c)))
    .slice(0, limit);
}

export function sortProducts(list, sortKey) {
  const sorted = [...list];
  if (sortKey === 'cheapest') sorted.sort((a, b) => a.price - b.price);
  else if (sortKey === 'expensive') sorted.sort((a, b) => b.price - a.price);
  else sorted.reverse(); // 'newest' — later sheet rows were added more recently
  return sorted;
}
