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

// Tour destinations (src/data/tourSearchCountries.js) need the preposition too: "в Турцию" but
// "на Мальдивы". [where to: "Туры в Турцию", where: "отели в Турции"] by the RU nominative of
// countries.*; a country missing here falls back to "в <nominative>".
const RU_DESTINATION = {
  Австрия: ['в Австрию', 'в Австрии'],
  Греция: ['в Грецию', 'в Греции'],
  Грузия: ['в Грузию', 'в Грузии'],
  Египет: ['в Египет', 'в Египте'],
  'Занзибар (Танзания)': ['на Занзибар (Танзания)', 'на Занзибаре (Танзания)'],
  Индия: ['в Индию', 'в Индии'],
  Индонезия: ['в Индонезию', 'в Индонезии'],
  Исландия: ['в Исландию', 'в Исландии'],
  Казахстан: ['в Казахстан', 'в Казахстане'],
  Кения: ['в Кению', 'в Кении'],
  Китай: ['в Китай', 'в Китае'],
  Маврикий: ['на Маврикий', 'на Маврикии'],
  Малайзия: ['в Малайзию', 'в Малайзии'],
  Мальдивы: ['на Мальдивы', 'на Мальдивах'],
  ОАЭ: ['в ОАЭ', 'в ОАЭ'],
  Сингапур: ['в Сингапур', 'в Сингапуре'],
  США: ['в США', 'в США'],
  Таиланд: ['в Таиланд', 'в Таиланде'],
  Турция: ['в Турцию', 'в Турции'],
  Узбекистан: ['в Узбекистан', 'в Узбекистане'],
  Черногория: ['в Черногорию', 'в Черногории'],
  Швейцария: ['в Швейцарию', 'в Швейцарии'],
  'Шри-Ланка': ['на Шри-Ланку', 'на Шри-Ланке'],
  Япония: ['в Японию', 'в Японии'],
};

// {country, toCountry, inCountry} for the i18n templates of a tour destination; only ru.json uses
// the last two ("Туры {{toCountry}}"), AZ/EN keep {{country}}
export function destinationParams(nominative, lang) {
  if (lang !== 'ru') return { country: nominative, toCountry: nominative, inCountry: nominative };
  const [to, where] = RU_DESTINATION[nominative] || [`в ${nominative}`, `в ${nominative}`];
  return { country: nominative, toCountry: to, inCountry: where };
}
