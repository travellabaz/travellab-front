// Tour captions are free-form Azerbaijani text with no structured departure
// date (see utils/price.js for the same situation with price) — this mines
// a date out of the caption on a best-effort basis. If no recognizable date
// pattern is found the tour is treated as active (fail open) rather than
// guessed as expired.
const AZ_MONTHS = {
  yanvar: 0, fevral: 1, mart: 2, aprel: 3, may: 4, iyun: 5,
  iyul: 6, avqust: 7, sentyabr: 8, oktyabr: 9, noyabr: 10, dekabr: 11,
};

const MONTH_NAMES = Object.keys(AZ_MONTHS).join('|');
// Matches a day (or day range) immediately followed by an Azerbaijani month
// name — "21-26 avqust", "3-8 dekabr", "27 avqust". Ranges that cross a
// month boundary ("27 avqust - 1 sentyabr") still work: the "1" before
// "sentyabr" is picked up as its own day+month match on the next pass.
const DATE_RE = new RegExp(`(\\d{1,2})(?:\\s*-\\s*(\\d{1,2}))?\\s*(${MONTH_NAMES})`, 'gi');

// Latest calendar date mentioned in the text, or null if none was found.
// Captions never include a year, so each match is resolved against the
// nearest occurrence of that month — this year, unless that would already
// be more than ~2 months in the past, in which case it must mean next year
// (a trip advertised as "3-8 dekabr" in August means this December).
export function extractLatestTourDate(text) {
  if (!text) return null;
  const now = new Date();
  let latest = null;
  for (const match of text.matchAll(DATE_RE)) {
    const day = parseInt(match[2] || match[1], 10);
    const month = AZ_MONTHS[match[3].toLocaleLowerCase('az')];
    if (!Number.isFinite(day) || day < 1 || day > 31) continue;

    let candidate = new Date(now.getFullYear(), month, day);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    if (candidate < twoMonthsAgo) candidate = new Date(now.getFullYear() + 1, month, day);

    if (!latest || candidate > latest) latest = candidate;
  }
  return latest;
}

export function isTourExpired(text) {
  const latest = extractLatestTourDate(text);
  if (!latest) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return latest < today;
}

// { checkIn, checkOut } from the first same-month day-range mention in the
// caption (e.g. "21-26 avqust"), so a tour card can show real trip dates
// without opening the tour — a lone single-day mention isn't a trip
// length, so it returns null rather than guessing a checkout date.
// Ranges crossing a month boundary ("27 avqust - 1 sentyabr") aren't
// captured here (see DATE_RE's own note above on how those tokenize) —
// no dates shown for those captions rather than a wrong pairing.
export function extractTourDateRange(text) {
  if (!text) return null;
  const now = new Date();
  for (const match of text.matchAll(DATE_RE)) {
    if (!match[2]) continue;
    const startDay = parseInt(match[1], 10);
    const endDay = parseInt(match[2], 10);
    const month = AZ_MONTHS[match[3].toLocaleLowerCase('az')];
    if (!Number.isFinite(startDay) || !Number.isFinite(endDay)) continue;

    const resolve = (day) => {
      let candidate = new Date(now.getFullYear(), month, day);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
      if (candidate < twoMonthsAgo) candidate = new Date(now.getFullYear() + 1, month, day);
      return candidate;
    };

    return { checkIn: resolve(startDay), checkOut: resolve(endDay) };
  }
  return null;
}

// Date -> "19.08.2026", matching Kompas offers' own date formatting
// (see OfferCard.jsx's formatOfferDate) so both tour sources look
// consistent on the card.
export function formatTourDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}
