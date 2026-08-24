// Travellab Shop orders go through one dedicated WhatsApp line, not the
// round-robin manager pool the rest of the site uses (see utils/managers.js)
// — same reasoning as GiftCardPage's own dedicated number.
export const SHOP_WHATSAPP_NUMBER = '994514063665';

// t = i18next translate function from the calling component's useTranslation().
export function orderProductWhatsappUrl(product, t) {
  const text = t('shop.waOrderMessage', { name: product.name, sku: product.sku });
  return 'https://wa.me/' + SHOP_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
}
