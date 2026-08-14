// Russian declines nouns by grammatical case — "Виза в Грецию" (accusative,
// direction) and "документы для Греции" (genitive), never the bare
// dictionary/nominative form "Виза в Греция" that comes straight out of
// countries.* (which is deliberately nominative there, since it's also
// used for plain lists/dropdowns where nominative is correct). AZ/EN don't
// decline this way, so callers only need these for the 'ru' locale — pass
// any other language through unchanged.
//
// Covers VIZA_COUNTRIES only (src/data/vizaCountries.js) — the set these
// helpers exist for. Entries are keyed by the RU nominative form already
// produced by t('countries.<name>'), so a country whose case form happens
// to equal its nominative (e.g. indeclinable "США") needs no entry — the
// fallback below already returns it unchanged.
const ACCUSATIVE = {
  Германия: 'Германию',
  Франция: 'Францию',
  Италия: 'Италию',
  Испания: 'Испанию',
  Австрия: 'Австрию',
  Греция: 'Грецию',
  Чехия: 'Чехию',
  Польша: 'Польшу',
  Венгрия: 'Венгрию',
  Португалия: 'Португалию',
  Швейцария: 'Швейцарию',
  Великобритания: 'Великобританию',
  Канада: 'Канаду',
  Япония: 'Японию',
  'Южная Корея': 'Южную Корею',
  Индия: 'Индию',
  Россия: 'Россию',
  Австралия: 'Австралию',
};

const GENITIVE = {
  Германия: 'Германии',
  Франция: 'Франции',
  Италия: 'Италии',
  Испания: 'Испании',
  Австрия: 'Австрии',
  Нидерланды: 'Нидерландов',
  Греция: 'Греции',
  Чехия: 'Чехии',
  Польша: 'Польши',
  Венгрия: 'Венгрии',
  Португалия: 'Португалии',
  Швейцария: 'Швейцарии',
  Великобритания: 'Великобритании',
  Канада: 'Канады',
  Китай: 'Китая',
  Япония: 'Японии',
  'Южная Корея': 'Южной Кореи',
  Индия: 'Индии',
  Таиланд: 'Таиланда',
  Вьетнам: 'Вьетнама',
  Россия: 'России',
  Австралия: 'Австралии',
};

export function toAccusative(nominative, lang) {
  if (lang !== 'ru') return nominative;
  return ACCUSATIVE[nominative] || nominative;
}

export function toGenitive(nominative, lang) {
  if (lang !== 'ru') return nominative;
  return GENITIVE[nominative] || nominative;
}
