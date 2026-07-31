// Tour descriptions come from an Instagram feed as free-form text — there is
// no structured price field, so the lowest mentioned price has to be mined
// out of the caption itself (e.g. "Toplam - 619 EURO", "Hotel X - 1,175 USD").
const PRICE_RE = /(\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(USD|EUR|EURO|AZN|manat)\b/gi;

const CURRENCY_ALIASES = { EURO: 'EUR', EUR: 'EUR', USD: 'USD', AZN: 'AZN', MANAT: 'AZN' };
const CURRENCY_SYMBOLS = { USD: '$', EUR: '€' };

function parseAmount(raw) {
  const parts = raw.split(/[.,]/);
  if (parts.length === 1) return parseFloat(parts[0]);
  const last = parts[parts.length - 1];
  const isDecimal =
    last.length <= 2 && parts.slice(0, -1).every((p, i) => (i === 0 ? p.length <= 3 : p.length === 3));
  if (isDecimal) return parseFloat(parts.slice(0, -1).join('') + '.' + last);
  return parseFloat(parts.join(''));
}

// Lowest { amount, currency } mentioned in the text, or null if no price is found.
export function extractMinPrice(text) {
  if (!text) return null;
  let min = null;
  for (const match of text.matchAll(PRICE_RE)) {
    const amount = parseAmount(match[1]);
    if (!Number.isFinite(amount)) continue;
    const currency = CURRENCY_ALIASES[match[2].toUpperCase()] || match[2].toUpperCase();
    if (!min || amount < min.amount) min = { amount, currency };
  }
  return min;
}

export function formatPrice(amount, currency) {
  const rounded = Math.round(amount * 100) / 100;
  const numStr = rounded.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const symbol = CURRENCY_SYMBOLS[currency];
  return symbol ? `${symbol}${numStr}` : `${numStr} ${currency}`;
}

// The site's LabPoint loyalty cashback rate is 1% of the tour price.
export function calcReward({ amount, currency }) {
  return { amount: Math.round(amount * 0.01 * 100) / 100, currency };
}
