import { BASE_URL } from '../data/pageMeta';
import { formatPrice } from './price';
import { productSlug } from '../data/shop';

// "Tur paketi" — Shop products bought alongside one specific tour, at the
// cheaper bundle price (product.price vs. product.standalonePrice, see
// data/shop's toBundleCartItem). One package per tour, persisted per tour
// id (tl_tour_pkg_<tourId>) so it survives a reload and shows up as its
// own group in the cart (CartDrawer). State itself lives in CartContext;
// this file is the pure shape/storage/message side of it.
//
// Package shape:
//   { tourId, code, createdAt,
//     tour: { title, image, url, dateText, hotel: { name } | null,
//             price: { amount, currency } | null,
//             manager: { name, phone } | null },
//     items: { [sku]: { sku, name, image, url, qty, bundlePrice, standalonePrice, currency } } }

const STORAGE_PREFIX = 'tl_tour_pkg_';

export function readStoredPackages() {
  if (typeof window === 'undefined') return {};
  const out = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const pkg = JSON.parse(window.localStorage.getItem(key));
      if (pkg && pkg.tourId && pkg.code) out[pkg.tourId] = pkg;
    }
  } catch {
    // storage blocked/corrupt — packages just won't survive a reload
  }
  return out;
}

export function writeStoredPackage(tourId, pkg) {
  try {
    if (pkg) window.localStorage.setItem(STORAGE_PREFIX + tourId, JSON.stringify(pkg));
    else window.localStorage.removeItem(STORAGE_PREFIX + tourId);
  } catch {
    // storage full/blocked — fine, see readStoredPackages
  }
}

// TL-<5 digits>. Not globally unique (no backend yet) — it only has to
// let the tour manager and the Shop team refer to the same request.
export function generateRequestCode() {
  return 'TL-' + String(Math.floor(10000 + Math.random() * 90000));
}

export function toPackageItem(product, qty) {
  return {
    sku: product.sku,
    name: product.name,
    image: product.images?.[0] || null,
    url: `/shop/${productSlug(product)}`,
    qty,
    bundlePrice: product.price,
    standalonePrice: product.standalonePrice ?? product.price,
    currency: product.currency || 'AZN',
  };
}

export function packageItems(pkg) {
  return pkg ? Object.values(pkg.items || {}).filter((it) => it.qty > 0) : [];
}

export function packageSummary(pkg) {
  const items = packageItems(pkg);
  const count = items.reduce((n, it) => n + it.qty, 0);
  const total = items.reduce((sum, it) => sum + it.bundlePrice * it.qty, 0);
  const savings = items.reduce((sum, it) => sum + Math.max(0, it.standalonePrice - it.bundlePrice) * it.qty, 0);
  return { items, count, total, savings, currency: items[0]?.currency || 'AZN' };
}

// Tour titles come straight from Instagram captions — flags, mics,
// sparkles etc. Managers asked for plain text in the WhatsApp message.
export function stripEmoji(text) {
  return (text || '')
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// The structured request — exactly what a future POST /tour-requests (Shop
// team notification, task item G) will send. Built now so the WhatsApp
// message below is just a rendering of it, and adding the backend call
// later needs no change to what's collected.
export function buildTourRequest(pkg, { pax = 1, user = null } = {}) {
  const { items, total } = packageSummary(pkg);
  return {
    code: pkg.code,
    tourId: pkg.tourId,
    tourTitle: stripEmoji(pkg.tour.title),
    tourUrl: BASE_URL + pkg.tour.url,
    hotel: pkg.tour.hotel?.name || null,
    dates: pkg.tour.dateText || null,
    pax,
    tourPrice: pkg.tour.price,
    items: items.map((it) => ({
      sku: it.sku,
      name: it.name,
      qty: it.qty,
      bundlePrice: it.bundlePrice,
      standalonePrice: it.standalonePrice,
      currency: it.currency,
    })),
    itemsTotal: items.length ? { amount: total, currency: items[0].currency } : null,
    user,
    tourManager: pkg.tour.manager?.name || null,
    createdAt: new Date().toISOString(),
  };
}

// t = i18next translate function from the calling component.
export function buildTourRequestWaText(request, t) {
  const tourLine = [
    [request.dates, request.hotel].filter(Boolean).join(' · '),
    request.tourPrice
      ? t('tourPackage.waPricePax', { price: formatPrice(request.tourPrice.amount, request.tourPrice.currency), count: request.pax })
      : null,
  ].filter(Boolean).join(' — ');

  const lines = [t('tourPackage.waIntro'), request.tourTitle, tourLine, request.tourUrl].filter(Boolean);

  if (request.items.length) {
    lines.push('', t('tourPackage.waItemsTitle'));
    request.items.forEach((it) => {
      lines.push(`• ${it.name} × ${it.qty} — ${formatPrice(it.bundlePrice * it.qty, it.currency)}`);
    });
    lines.push(t('tourPackage.waItemsTotal', { total: formatPrice(request.itemsTotal.amount, request.itemsTotal.currency) }));
  }

  lines.push('', t('tourPackage.waCode', { code: request.code }));
  return lines.join('\n');
}

export function tourRequestWaUrl(request, phone, t) {
  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(buildTourRequestWaText(request, t));
}
