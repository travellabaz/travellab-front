// Kompas's destination names come back in Russian (its own reference data);
// Pexels' search doesn't work well outside English (same issue noted in
// scripts/generate-blog-post.mjs for blog covers) — so each known
// destination is mapped to a plain English query here.
const RU_TO_EN_QUERY = {
  'Австрия': 'Austria travel',
  'Греция': 'Greece travel',
  'Грузия': 'Georgia country travel',
  'Египет': 'Egypt Red Sea resort',
  'Занзибар (Танзания)': 'Zanzibar beach',
  'Индия': 'India travel',
  'Индонезия': 'Indonesia Bali travel',
  'Исландия': 'Iceland travel',
  'Казахстан': 'Kazakhstan travel',
  'Кения': 'Kenya safari',
  'Китай': 'China travel',
  'Маврикий': 'Mauritius beach',
  'Малайзия': 'Malaysia travel',
  'Мальдивы': 'Maldives beach resort',
  'ОАЭ': 'Dubai UAE travel',
  'Сингапур': 'Singapore travel',
  'США': 'USA travel',
  'Таиланд': 'Thailand beach',
  'Турция': 'Turkey Antalya resort',
  'Узбекистан': 'Uzbekistan Samarkand',
  'Черногория': 'Montenegro coast',
  'Швейцария': 'Switzerland Alps',
  'Шри-Ланка': 'Sri Lanka beach',
  'Япония': 'Japan travel',
};

export function photoQueryForCountry(name) {
  return RU_TO_EN_QUERY[name] || (name ? `${name} travel` : 'travel destination');
}
