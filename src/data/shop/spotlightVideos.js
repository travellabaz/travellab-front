// Hand-curated product demo clips — used for both the "watch & shop"
// strip on ShopPage.jsx and, per-SKU, the gallery on the product's own
// ShopProductPage.jsx (see getSpotlightVideo there). Unlike the rest of
// the shop data, these aren't synced from the Sheet (video is too heavy
// to hotlink from Drive reliably, see scripts/sync-shop-products.mjs's
// comments on that). To add one: drop the clip in
// public/videos/shop/{sku}.mp4 (re-encode first — see the existing files
// for the target size, roughly 720px wide, CRF ~26) and a poster frame in
// public/images/shop/spotlight-videos/{sku}.jpg, then add a row here.
export const SHOP_SPOTLIGHT_VIDEOS = [
  { sku: 'TB-010', video: '/videos/shop/tb-010.mp4', poster: '/images/shop/spotlight-videos/tb-010.jpg' },
  { sku: 'TB-004', video: '/videos/shop/tb-004.mp4', poster: '/images/shop/spotlight-videos/tb-004.jpg' },
  { sku: 'TB-005', video: '/videos/shop/tb-005.mp4', poster: '/images/shop/spotlight-videos/tb-005.jpg' },
  { sku: 'TB-006', video: '/videos/shop/tb-006.mp4', poster: '/images/shop/spotlight-videos/tb-006.jpg' },
  { sku: 'TB-011', video: '/videos/shop/tb-011.mp4', poster: '/images/shop/spotlight-videos/tb-011.jpg' },
  { sku: 'TB-017', video: '/videos/shop/tb-017.mp4', poster: '/images/shop/spotlight-videos/tb-017.jpg' },
  // Two source clips (candle, then hair-tie set) spliced into one —
  // TB-003 is a 3-item bundle (perfume holder + candle + hair ties), the
  // single demo clip covers the other two pieces in sequence.
  { sku: 'TB-003', video: '/videos/shop/tb-003.mp4', poster: '/images/shop/spotlight-videos/tb-003.jpg' },
];

export function getSpotlightVideo(sku) {
  if (!sku) return null;
  return SHOP_SPOTLIGHT_VIDEOS.find((v) => v.sku.toLowerCase() === sku.toLowerCase()) || null;
}
