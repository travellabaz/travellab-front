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

// Fixed rates used only to size the LabPoint reward — not a live FX feed.
const AZN_RATES = { USD: 1.7, EUR: 1.95, AZN: 1 };

export function toAzn(amount, currency) {
  return amount * (AZN_RATES[currency] ?? 1);
}

// How much of the tour price a user's LabPoint (AZN) balance can cover —
// capped at the tour price itself, since the balance can't push it negative.
export function calcBalanceDiscount(price, balanceAzn) {
  const priceAzn = toAzn(price.amount, price.currency);
  const discountAzn = Math.max(0, Math.min(balanceAzn, priceAzn));
  return {
    discountAzn: Math.round(discountAzn * 100) / 100,
    finalAzn: Math.round((priceAzn - discountAzn) * 100) / 100,
  };
}

// LabPoint reward: convert the tour price to AZN, take 1% of that, then the
// loyalty program pays out 10 points per AZN of cashback.
export function calcReward({ amount, currency }) {
  const azn = toAzn(amount, currency);
  const points = azn * 0.01 * 10;
  return { points: Math.round(points * 100) / 100 };
}

export function formatPoints(points) {
  return points.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
