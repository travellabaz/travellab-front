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
  };

  let section = null; // 'hotels' | 'included' | 'managers'
  // Free-form lines the model/poster wrote before the caption settles into
  // the fixed marker template (e.g. football-tour posts opening with
  // "REAL MADRID 🆚 FC BARCELONA" before the 🗓️ line) — kept as an "about"
  // blurb since it's real content this parser would otherwise just drop.
  // Stops accumulating the moment any real marker is recognised.
  const introLines = [];
  let started = false;

  for (const line of lines) {
    if (!line) continue;
    const lead = leadEmoji(line);
    const body = stripLeadEmoji(line);

    if (line.startsWith('#')) continue;

    // Date / destination
    if (lead === '🗓️' || lead === '📅') {
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

  const out = hasContent(result) ? result : null;
  cache.set(description, out);
  return out;
}

function hasContent(r) {
  return !!(r.hotels.length || r.included.length || r.total || r.managers.length || r.duration || r.dateText || r.intro);
}
