// Tours come from an Instagram feed as free-form text (see TourDto on the
// backend) — there's no structured category field, so it's derived here by
// keyword-matching the title+description, the same way utils/price.js mines
// a price out of the caption. First matching category wins; anything that
// matches nothing falls into DEFAULT_TOUR_CATEGORY.
export const TOUR_CATEGORIES = [
  { name: 'Türkiyə', class: 'cat-t', keywords: ['türkiyə', 'istanbul', 'antalya', 'bodrum', 'kapadokya', 'izmir', 'trabzon', 'ege', 'egey'] },
  { name: 'Avropa', class: 'cat-a', keywords: ['avropa', 'budapeşt', 'bazel', 'kolmar', 'italiya', 'fransa', 'ispaniya', 'almaniya', 'praga', 'vyana', 'amsterdam', 'london', 'paris', 'roma', 'milan', 'yunanıstan', 'santorini', 'portuqaliya', 'isveçrə'] },
  { name: 'Ekzotik', class: 'cat-m', keywords: ['maldiv', 'zanzibar', 'bali', 'seyşel', 'mavritius', 'dubay', 'tayland', 'şri lanka'] },
  { name: 'Viza', class: 'cat-n', keywords: ['viza', 'schengen'] },
];

export const DEFAULT_TOUR_CATEGORY = { name: 'Digər', class: 'cat-o' };

export function getTourCategory(tour) {
  const text = `${tour.title || ''} ${tour.description || ''}`.toLocaleLowerCase('az');
  for (const category of TOUR_CATEGORIES) {
    if (category.keywords.some((kw) => text.includes(kw))) return category;
  }
  return DEFAULT_TOUR_CATEGORY;
}
