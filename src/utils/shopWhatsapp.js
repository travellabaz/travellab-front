import { BASE_URL } from '../data/pageMeta';
import { buildLocalizedPath } from './locale';

// Travellab Shop orders go through one dedicated WhatsApp line, not the
// round-robin manager pool the rest of the site uses (see utils/managers.js)
// — same reasoning as GiftCardPage's own dedicated number.
export const SHOP_WHATSAPP_NUMBER = '994514063665';

// Absolute, locale-prefixed product URL — so whoever picks up the WhatsApp
// message can open the exact product (and see the right language) without
// being told which one by hand.
export function productUrl(product, lang) {
  return BASE_URL + buildLocalizedPath(`/shop/${product.sku}`, lang);
}

// t = i18next translate function from the calling component's useTranslation().
export function orderProductWhatsappUrl(product, t, lang) {
  const text = t('shop.waOrderMessage', { name: product.name, sku: product.sku, link: productUrl(product, lang) });
  return 'https://wa.me/' + SHOP_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
}
