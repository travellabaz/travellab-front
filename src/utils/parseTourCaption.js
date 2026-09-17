// Instagram tour captions follow a fixed emoji-marker template (see the
// Tour Page brief). This turns the raw caption into a structured object
// the detail page renders from. Anything that doesn't match the expected
// shape is simply left out — a missing/!matching block never renders
// (the "boş bölmə render olunmur" rule).
//
// Ideally the backend would parse this once into the tour DB; until then
// it's done here, memoised per caption string.

const cache = new Map();

const PRICE_RE = /([\d][\d.,\s]*\d|\d)\s*(USD|EUR|AZN|\$|€|₼|man|manat)/i;

function parsePrice(text) {
  const m = text && text.match(PRICE_RE);
  if (!m) return null;
  // These captions write whole amounts with '.', ',' or space as the
  // thousands separator ("1,400" / "2.079" / "1 400") and never a real
  // decimal, so strip every separator down to the digits.
  const amount = Number(m[1].replace(/[.,\s]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  let currency = m[2].toUpperCase();
  if (currency === '$') currency = 'USD';
  else if (currency === '€') currency = 'EUR';
  else if (currency === '₼' || currency === 'MAN' || currency === 'MANAT') currency = 'AZN';
  return { amount, currency, raw: m[0].trim() };
}

// Strips a leading emoji (and its ZWJ sequence / skin-tone modifiers) plus
// any following whitespace, returning the plain text after it.
function stripLeadEmoji(line) {
  return line.replace(/^[^\p{L}\p{N}(#]+/u, '').trim();
}

// The first emoji "cluster" of a line, or '' if it starts with text.
function leadEmoji(line) {
  const m = line.match(/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*)/u);
  return m ? m[1] : '';
}

const DURATION_RE = /(\d+)\s*gecə\s*\/\s*(\d+)\s*gün/i;

// Multi-city tours are already titled "Roma - Lizbon - Barselona turu" /
// "London-Edinburq turu" today — no new marker needed there. What follows
// in the body is real per-city data too, just not uniformly formatted —
// confirmed against live captions:
//   "13-15 noyabr - Roma"
//   "10-14 oktyabr, London gecələmə"
//   "22-25 noyabr, Budapeştdə gecələmə"
// (note the last two suffix the city name with an Azerbaijani locative
// case ending — "Budapeşt" + "də" — which is why leg dates are matched by
// ORDER against the clean title-derived names, not by parsing the name
// back out of these lines). Nights per leg come straight from each line's
// own date range (13-15 = 2, 10-14 = 4 — real tours are NOT evenly split,
// e.g. London 4 nights / Edinburgh 3), never computed.
const CITY_TITLE_RE = /^(.+?)\s+turu\s*$/i;
const CITY_SPLIT_RE = /\s*-\s*/;
const DATE_RANGE_RE = /^(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+(\S+?),?\s*$/;
// Same shape as DATE_RANGE_RE but without the end anchor — these lines
// have trailing text ("- Roma", ", London gecələmə") after the date.
const CITY_LEG_DATE_RE = /^(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+(\S+)/;
const NIGHTS_RE = /^(\d+)\s*gecə/i;

function parseCityNames(text) {
  const segments = text.split(CITY_SPLIT_RE).map((s) => s.trim()).filter(Boolean);
  if (segments.length < 2) return null;
  // Guard against matching an unrelated "X - Y turu"-shaped line: every
  // segment should look like a place name (starts with a capital letter,
  // no digits, not absurdly long).
  const looksLikeCity = (s) => /^\p{Lu}/u.test(s) && !/\d/.test(s) && s.length <= 30;
  return segments.every(looksLikeCity) ? segments : null;
}

// legDateRanges: [{start, end, month}, ...] collected in the order
// encountered in the caption body (see the main loop) — zipped against
// cityNames by position, since that's the only link between the two
// (the leg lines' city names aren't reliably parseable back out, see
// above). Falls back to splitting the overall dateText/duration evenly
// only when no explicit per-leg dates were found at all.
function computeCityLegs(cityNames, legDateRanges, legHotels, dateText, duration) {
  if (!cityNames) return null;

  if (legDateRanges.length > 0) {
    return cityNames.map((name, i) => {
      const leg = legDateRanges[i];
      return {
        name,
        nights: leg ? leg.end - leg.start : null,
        dateRange: leg ? `${leg.start}-${leg.end} ${leg.month}` : null,
        hotel: legHotels[i] || null,
      };
    });
  }

  const nightsMatch = duration && duration.match(NIGHTS_RE);
  const totalNights = nightsMatch ? Number(nightsMatch[1]) : null;
  const n = cityNames.length;
  const nightsPerCity = totalNights != null && totalNights >= n
    ? (() => {
        const base = Math.floor(totalNights / n);
        const remainder = totalNights % n;
        return cityNames.map((_, i) => base + (i < remainder ? 1 : 0));
      })()
    : null;

  const dateMatch = dateText && dateText.match(DATE_RANGE_RE);
  let cursor = dateMatch ? Number(dateMatch[1]) : null;
  const month = dateMatch ? dateMatch[3] : null;

  return cityNames.map((name, i) => {
    const nights = nightsPerCity ? nightsPerCity[i] : null;
    let dateRange = null;
    if (cursor != null && nights != null && month) {
      const endDay = cursor + nights;
      dateRange = `${cursor}-${endDay} ${month}`;
      cursor = endDay;
    }
    return { name, nights, dateRange, hotel: null };
  });
}

export function parseTourCaption(description) {
  if (!description) return null;
  if (cache.has(description)) return cache.get(description);

  const lines = description.split('\n').map((l) => l.trim());

  const result = {
    dateText: null,
    destination: null,
    venue: null,
    duration: null,
    hotels: [],
    hotelsHeader: null,
    included: [],
    total: null,
    labpointNote: null,
    conditions: [],
    paymentNote: null,
    managers: [],
    intro: null,
    cities: null,
  };

  let section = null; // 'hotels' | 'included' | 'managers'
  // Free-form lines the model/poster wrote before the caption settles into
  // the fixed marker template (e.g. football-tour posts opening with
  // "REAL MADRID 🆚 FC BARCELONA" before the 🗓️ line) — kept as an "about"
  // blurb since it's real content this parser would otherwise just drop.
  // Stops accumulating the moment any real marker is recognised.
  const introLines = [];
  let started = false;
  let cityNames = null;
  const legDateRanges = [];
  const legHotels = [];

  for (const line of lines) {
    if (!line) continue;
    const lead = leadEmoji(line);
    const body = stripLeadEmoji(line);

    if (line.startsWith('#')) continue;

    // "📍 Roma - Lizbon - Barselona turu" / "London-Edinburq turu" — real
    // captions lead this with 📍 (matched against body, emoji already
    // stripped) as often as not, so this has to run before the plain 📍
    // venue handler below claims the line first. See computeCityLegs for
    // how this combines with dateText/duration once the loop is done.
    if (!cityNames) {
      const titleMatch = body.match(CITY_TITLE_RE);
      const names = titleMatch && parseCityNames(titleMatch[1]);
      if (names) {
        cityNames = names;
        started = true;
        continue;
      }
    }

    // Date / destination — 🗒️ (spiral notepad) shows up as a date marker
    // on a couple of real captions alongside the usual 🗓️/📅.
    if (lead === '🗓️' || lead === '📅' || lead === '🗒️') {
      started = true;
      const parts = body.split(/\s+[-–—]\s+/);
      result.dateText = parts[0].trim();
      if (parts.length > 1) {
        const tail = parts[parts.length - 1].trim();
        // "… - Maldiv" is a destination; "… - 04.11.2026" is just the
        // end of a date range.
        if (!/^\d[\d.\s/-]*$/.test(tail)) result.destination = tail;
      }
      section = null;
      continue;
    }
    if (lead === '📍') {
      started = true;
      result.venue = body;
      if (!result.destination) {
        const bits = body.split(',');
        result.destination = bits[bits.length - 1].trim();
      }
      section = null;
      continue;
    }

    // Per-city leg date, multi-city tours only — "13-15 noyabr - Roma" /
    // "10-14 oktyabr, London gecələmə". No emoji lead in real captions
    // (unlike the 🗓️ overall-date line above, already consumed by now),
    // collected in encounter order and zipped against cityNames in
    // computeCityLegs once the loop is done.
    if (cityNames && !lead) {
      const legMatch = body.match(CITY_LEG_DATE_RE);
      if (legMatch) {
        legDateRanges.push({ start: Number(legMatch[1]), end: Number(legMatch[2]), month: legMatch[3].replace(/,$/, '') });
        continue;
      }
    }

    const dur = line.match(DURATION_RE);
    if (dur) {
      started = true;
      result.duration = `${dur[1]} gecə / ${dur[2]} gün`;
      continue;
    }

    // Section headers
    if (/^(hotel|otel).*(seçim|siyah|qiymət)/i.test(line) || /^otellər və qiymətlər/i.test(line)) {
      started = true;
      result.hotelsHeader = line.replace(/:\s*$/, '');
      section = 'hotels';
      continue;
    }
    if (/daxildir\s*:?\s*$/i.test(line)) {
      section = 'included';
      continue;
    }
    if (/^əlaqə üçün\s*:?\s*$/i.test(line)) {
      section = 'managers';
      continue;
    }

    // The hotel line right after a leg date, e.g. "13-15 noyabr - Roma"
    // -> "🏨 Raeli Hotel Floridia" — no price (multi-city legs don't
    // break the price out per city), so the regular priced-hotel check
    // below would never catch it. One per leg, in the same order as
    // legDateRanges.
    if (cityNames && (lead === '🏩' || lead === '🏨') && legHotels.length < legDateRanges.length) {
      legHotels.push(body.replace(/^(hotel|otel)\s*[-–—:]\s*/i, '').trim());
      continue;
    }

    // Hotel lines: "🏩 Name (Location) - 1,400 USD" or "🏩 Name - 1239 USD"
    if ((lead === '🏩' || lead === '🏨') && /[-–—]\s*.*\d.*(USD|EUR|AZN|\$|€|₼)/i.test(body)) {
      const withLoc = body.match(/^(.+?)\s*\((.+?)\)\s*[-–—]\s*(.+)$/);
      const noLoc = withLoc ? null : body.match(/^(.+?)\s*[-–—]\s*(.+)$/);
      const name = withLoc ? withLoc[1] : noLoc && noLoc[1];
      const location = withLoc ? withLoc[2] : null;
      const priceStr = withLoc ? withLoc[3] : noLoc && noLoc[2];
      const price = parsePrice(priceStr || '');
      if (name && price) {
        result.hotels.push({ name: name.trim(), location: location && location.trim(), price });
        if (section !== 'hotels') section = 'hotels';
        continue;
      }
    }

    // Total
    if (/^toplam\s*:/i.test(line)) {
      const total = parsePrice(body);
      const cb = body.match(/\(([^)]*keşbek[^)]*)\)/i);
      result.total = total ? { ...total, cashback: cb ? parsePrice(cb[1]) : null } : null;
      section = null;
      continue;
    }

    if (lead === '💰') {
      result.labpointNote = body;
      section = null;
      continue;
    }
    if (lead === '💫') {
      result.conditions.push(body);
      section = null;
      continue;
    }
    if (lead === '💳') {
      result.paymentNote = body;
      section = null;
      continue;
    }

    // Manager lines: "👩🏻‍💼 Menecer Əfsanə: +99451 6383665"
    if (section === 'managers' || /menecer\s+.+:\s*\+?\d/i.test(line)) {
      const m = body.match(/menecer\s+(.+?)\s*:\s*(\+?[\d\s]+)/i);
      if (m) {
        const digits = m[2].replace(/\D/g, '');
        if (digits.length >= 9) result.managers.push({ name: m[1].trim(), phone: digits });
        continue;
      }
    }

    // Included items: an emoji-prefixed line while in the "included" section
    if (section === 'included' && lead && body) {
      result.included.push({ icon: lead, text: body });
      continue;
    }

    // Nothing above matched this line — while we're still ahead of the
    // first recognised marker, it's real free-form lead-in text (e.g. a
    // football-tour caption opening with "REAL MADRID 🆚 FC BARCELONA"
    // before the 🗓️ line). Once a marker has fired, an unmatched line is
    // just noise from the fixed template and is dropped as before.
    if (!started) {
      introLines.push(line);
    }
  }

  result.intro = introLines.length ? introLines.join('\n') : null;
  // Computed after the loop, not inline where cityNames is set — dateText/
  // duration usually come from lines later in the caption than the title.
  result.cities = computeCityLegs(cityNames, legDateRanges, legHotels, result.dateText, result.duration);

  const out = hasContent(result) ? result : null;
  cache.set(description, out);
  return out;
}

function hasContent(r) {
  return !!(r.hotels.length || r.included.length || r.total || r.managers.length || r.duration || r.dateText || r.intro || r.cities);
}
