// Hand-curated product demo clips for the "watch & shop" strip on
// ShopPage.jsx — unlike the rest of the shop data, these aren't synced
// from the Sheet (video is too heavy to hotlink from Drive reliably, see
// scripts/sync-shop-products.mjs's comments on that). To add one: drop
// the clip in public/videos/shop/{sku}.mp4 (re-encode first — see the
// existing files for the target size, roughly 720px wide, CRF ~26) and a
// poster frame in public/images/shop/spotlight-videos/{sku}.jpg, then add
// a row here.
export const SHOP_SPOTLIGHT_VIDEOS = [
  { sku: 'TB-010', video: '/videos/shop/tb-010.mp4', poster: '/images/shop/spotlight-videos/tb-010.jpg' },
  { sku: 'TB-004', video: '/videos/shop/tb-004.mp4', poster: '/images/shop/spotlight-videos/tb-004.jpg' },
];
