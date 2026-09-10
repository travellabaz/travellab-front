// Tours come from an Instagram feed as free-form text (see TourDto on the
// backend) — there's no structured category field, so it's derived here by
// keyword-matching the title+description, the same way utils/price.js mines
// a price out of the caption. First matching category wins; anything that
// matches nothing falls into DEFAULT_TOUR_CATEGORY.
//
// Array order is the pill DISPLAY order (per the client's spec). Match
// PRECEDENCE is separate — see MATCH_ORDER below: theme/format categories
// (group, honeymoon, sports, concerts, visa) are tried before the
// destination ones, so "Barselona El Clásico turu" reads as İdman Turları
// and "Yaponiyaya viza almaq" as Viza, not as Avropa / Asiya.
export const TOUR_CATEGORIES = [
  { name: 'Qrup Turları', class: 'cat-q', keywords: ['qrup turu', 'qrup turları', 'group tour'] },
  { name: 'Balayı', class: 'cat-k', keywords: ['balayı', 'bal ayı', 'medovıy', 'honeymoon', 'romantik tur'] },
  // No bare 'ege'/'egey' — too short, matched "Regency" (an Egypt-tour
  // hotel name). The Aegean coast is still covered by its city names.
  { name: 'Türkiyə', class: 'cat-t', keywords: ['türkiyə', 'istanbul', 'antalya', 'bodrum', 'kapadok', 'izmir', 'trabzon', 'alanya', 'kuşadası', 'kusadasi', 'marmaris', 'fethiye', 'fethiyə', 'çeşmə'] },
  // ' roma' (leading space), not bare 'roma' — the latter matched "aroma"
  // in a packing list on a Bali tour.
  { name: 'Avropa', class: 'cat-a', keywords: ['avropa', 'budapeş', 'macarıstan', 'bazel', 'kolmar', 'italiya', ' roma', 'romaya', 'romada', 'milan', 'venesiya', 'florensiya', 'fransa', 'paris', 'ispaniya', 'barselona', 'barcelona', 'madrid', 'almaniya', 'praga', 'praqa', 'çexiya', 'vyana', 'amsterdam', 'london', 'ingiltərə', 'britaniya', 'yunanıstan', 'afina', 'santorini', 'mikonos', 'portuqaliya', 'lissabon', 'monteneqro', 'budva', 'kotor', 'gürcüstan', 'tbilisi', 'batumi', 'isveçrə'] },
  { name: 'Asiya', class: 'cat-m', keywords: ['asiya', 'maldiv', 'zanzibar', 'bali', 'seyşel', 'mavriki', 'mavritius', 'dubay', 'şərcə', 'abu-dabi', 'abu dabi', 'bəə', 'əmirlik', 'tailand', 'tayland', 'bangkok', 'pattaya', 'puket', 'şri lanka', 'şri-lanka', 'sri lanka', 'misir', 'şarm', 'hurqada', 'vyetnam', 'nyatranq', 'hanoy', 'malayziya', 'kuala-lumpur', 'kuala lumpur', 'qatar turu', 'qatara', 'doha turu', 'dohaya', 'çin turu', 'çində', 'çinə', 'pekin', 'şanxay', 'yaponiya', 'tokio', 'osaka'] },
  { name: 'İdman Turları', class: 'cat-b', keywords: ['idman turu', 'idman turları', 'futbol', 'matç', 'derbi', 'çempionlar liqası', 'çempionlar liqasi', 'el klasiko', 'el clásico', 'el clasico', 'la liqa', 'premyer liqa', 'formula 1', 'formula1', 'moto gp', 'motogp', 'boks', 'nba', 'super kubok', 'uefa', 'olimpiada'] },
  { name: 'Viza', class: 'cat-n', keywords: ['viza almaq', 'viza dəstək', 'vizasız', 'viza xidmət', 'schengen', 'şengen'] },
  { name: 'Konsertlər', class: 'cat-c', keywords: ['konsert', 'concert', 'festival'] },
];

// Precedence order for getTourCategory() — theme/format wins over
// destination. Names must all exist in TOUR_CATEGORIES above.
const MATCH_ORDER = [
  'Qrup Turları',
  'Balayı',
  'İdman Turları',
  'Konsertlər',
  'Viza',
  'Türkiyə',
  'Avropa',
  'Asiya',
];

const BY_NAME = Object.fromEntries(TOUR_CATEGORIES.map((c) => [c.name, c]));

export const DEFAULT_TOUR_CATEGORY = { name: 'Digər', class: 'cat-o' };

export function getTourCategory(tour) {
  const text = `${tour.title || ''} ${tour.description || ''}`.toLocaleLowerCase('az');
  for (const name of MATCH_ORDER) {
    const category = BY_NAME[name];
    if (category && category.keywords.some((kw) => text.includes(kw))) return category;
  }
  return DEFAULT_TOUR_CATEGORY;
}
