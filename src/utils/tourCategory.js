// Tours come from an Instagram feed as free-form text (see TourDto on the
// backend) — there's no structured category field, so it's derived here by
// keyword-matching the title+description, the same way utils/price.js mines
// a price out of the caption. First matching category wins; anything that
// matches nothing falls into DEFAULT_TOUR_CATEGORY.
//
// Array order is both the pill display order AND the match precedence, so
// format/theme categories (group, honeymoon) sit ahead of the destination
// ones — "Antalya balayı turu" should read as Balayı, not Türkiyə.
export const TOUR_CATEGORIES = [
  { name: 'Qrup Turları', class: 'cat-q', keywords: ['qrup turu', 'qrup turları', 'group tour'] },
  { name: 'Balayı', class: 'cat-k', keywords: ['balayı', 'bal ayı', 'medovıy', 'honeymoon', 'romantik tur'] },
  { name: 'Türkiyə', class: 'cat-t', keywords: ['türkiyə', 'istanbul', 'antalya', 'bodrum', 'kapadok', 'izmir', 'trabzon', 'ege', 'egey', 'alanya', 'kuşadası', 'kusadasi', 'marmaris', 'fethiye', 'fethiyə'] },
  { name: 'Avropa', class: 'cat-a', keywords: ['avropa', 'budapeş', 'macarıstan', 'bazel', 'kolmar', 'italiya', 'roma', 'milan', 'venesiya', 'florensiya', 'fransa', 'paris', 'ispaniya', 'barselona', 'madrid', 'almaniya', 'praga', 'praqa', 'çexiya', 'vyana', 'amsterdam', 'london', 'ingiltərə', 'britaniya', 'yunanıstan', 'afina', 'santorini', 'mikonos', 'portuqaliya', 'lissabon', 'monteneqro', 'budva', 'kotor', 'gürcüstan', 'tbilisi', 'batumi', 'isveçrə'] },
  { name: 'Asiya', class: 'cat-m', keywords: ['asiya', 'maldiv', 'zanzibar', 'bali', 'seyşel', 'mavriki', 'mavritius', 'dubay', 'şərcə', 'abu-dabi', 'abu dabi', 'bəə', 'əmirlik', 'tailand', 'tayland', 'bangkok', 'pattaya', 'puket', 'şri lanka', 'şri-lanka', 'sri lanka', 'misir', 'şarm', 'hurqada', 'vyetnam', 'nyatranq', 'hanoy', 'malayziya', 'kuala-lumpur', 'kuala lumpur', 'qatar', 'doha', 'çin', 'pekin', 'şanxay', 'yaponiya', 'tokio', 'osaka'] },
  { name: 'İdman Turları', class: 'cat-b', keywords: ['idman turu', 'idman turları', 'futbol', 'matç', 'çempionlar liqası', 'el klasiko', 'premyer liqa', 'formula 1', 'formula1', 'moto gp', 'motogp', 'boks', 'nba', 'super kubok', 'uefa', 'olimpiada'] },
  { name: 'Viza', class: 'cat-n', keywords: ['viza', 'schengen', 'şengen'] },
  { name: 'Konsertlər', class: 'cat-c', keywords: ['konsert', 'concert', 'festival'] },
];

export const DEFAULT_TOUR_CATEGORY = { name: 'Digər', class: 'cat-o' };

export function getTourCategory(tour) {
  const text = `${tour.title || ''} ${tour.description || ''}`.toLocaleLowerCase('az');
  for (const category of TOUR_CATEGORIES) {
    if (category.keywords.some((kw) => text.includes(kw))) return category;
  }
  return DEFAULT_TOUR_CATEGORY;
}
