// Per-category title/description/body-text for /tours?category=X — the
// category set itself is owned by utils/tourCategory.js (TOUR_CATEGORIES);
// this only maps those same names to SEO copy (SEO Paketi v2, section 4.2).
// Keyed by category name, '' for the default "Bütün Turlar" (no filter) view.
// Paragraph text isn't machine-templated from the category name — Azerbaijani
// case suffixes ("Türkiyəyə" vs "Avropaya") don't follow a single mechanical
// rule, so each entry is written out by hand instead of risking bad grammar.
export const TOUR_CATEGORY_META = {
  '': {
    title: 'Tur Paketləri - Sərfəli Turlar Bakıdan | Travellab',
    desc: 'Dubay, Türkiyə, Gürcüstan və digər istiqamətlərə hazır tur paketləri. Aviabilet, otel və transfer daxil, sərfəli qiymətlərlə. İndi seçin!',
    paragraphs: [
      'Travellab səyahət agentliyi Dubay, Türkiyə, Gürcüstan və digər populyar istiqamətlərə hazır tur paketləri təklif edir. Hər tur paketinə aviabilet, otel gecələməsi və transfer daxildir — sərfəli qiymətlərlə, əlavə xərc olmadan.',
      'Tur paketlərimiz həm fərdi, həm qrup səyahətləri üçün uyğundur. Hər tur alışında Labpoint bonus xalları qazanır, növbəti səyahətinizdə istifadə edə bilərsiniz.',
    ],
  },
  'Qrup Turları': {
    title: 'Qrup Turları - Birgə Səyahət Paketləri | Travellab',
    desc: 'Bakıdan qrup halında sərfəli turlar. Dostlar və ailə ilə birgə səyahət, aviabilet və otel daxil. İndi qoşulun!',
    paragraphs: [
      'Travellab səyahət agentliyi qrup halında səyahət etmək istəyənlər üçün hazır tur paketləri təklif edir. Hər tur paketinə aviabilet, otel gecələməsi və transfer daxildir — sərfəli qiymətlərlə, əlavə xərc olmadan.',
      'Qrup turları dostlar, ailə və ya iş yoldaşları ilə birgə səyahət üçün əlverişlidir. Hər tur alışında Labpoint bonus xalları qazanır, növbəti səyahətinizdə istifadə edə bilərsiniz.',
    ],
  },
  'Türkiyə': {
    title: 'Türkiyə Turu - Sərfəli Paketlər | Travellab',
    desc: 'Bakıdan Türkiyəyə sərfəli tur paketləri. Aviabilet, otel və transfer daxil. İstanbul, Antalya və digər şəhərlər.',
    paragraphs: [
      'Travellab səyahət agentliyi Türkiyəyə hazır tur paketləri təklif edir. Hər tur paketinə aviabilet, otel gecələməsi və transfer daxildir — sərfəli qiymətlərlə, əlavə xərc olmadan.',
      'Türkiyə turları həm fərdi, həm qrup səyahətləri üçün uyğundur. Hər tur alışında Labpoint bonus xalları qazanır, növbəti səyahətinizdə istifadə edə bilərsiniz.',
    ],
  },
  'Avropa': {
    title: 'Avropa Turu - Sərfəli Tur Paketləri | Travellab',
    desc: 'Bakıdan Avropaya hazır tur paketləri. Aviabilet, otel və transfer daxil, sərfəli qiymətlərlə. İndi bron edin!',
    paragraphs: [
      'Travellab səyahət agentliyi Avropaya hazır tur paketləri təklif edir. Hər tur paketinə aviabilet, otel gecələməsi və transfer daxildir — sərfəli qiymətlərlə, əlavə xərc olmadan.',
      'Avropa turları həm fərdi, həm qrup səyahətləri üçün uyğundur. Hər tur alışında Labpoint bonus xalları qazanır, növbəti səyahətinizdə istifadə edə bilərsiniz.',
    ],
  },
  'Ekzotik': {
    title: 'Ekzotik Turlar - Uzaq Ölkələrə Səyahət | Travellab',
    desc: 'Maldiv, Zanzibar, Bali kimi ekzotik istiqamətlərə hazır tur paketləri. Sərfəli qiymətlərlə unudulmaz səyahət.',
    paragraphs: [
      'Travellab səyahət agentliyi Maldiv, Zanzibar, Bali kimi ekzotik istiqamətlərə hazır tur paketləri təklif edir. Hər tur paketinə aviabilet, otel gecələməsi və transfer daxildir — sərfəli qiymətlərlə, əlavə xərc olmadan.',
      'Ekzotik turlar unudulmaz təbiət mənzərələri və fərqli mədəniyyətlər axtaranlar üçün idealdır. Hər tur alışında Labpoint bonus xalları qazanır, növbəti səyahətinizdə istifadə edə bilərsiniz.',
    ],
  },
  'Viza': {
    title: 'Viza Dəstəkli Turlar | Travellab',
    desc: 'Viza xidməti daxil olan hazır tur paketləri. Sənədləşmədən narahat olmadan səyahət edin.',
    paragraphs: [
      'Travellab səyahət agentliyi viza dəstəyi daxil olan hazır tur paketləri təklif edir. Sənədləşmə prosesini biz aparırıq — siz yalnız səyahətinizi düşünün.',
      'Bu turlar viza tələb edən istiqamətlərə narahatlıqsız səyahət etmək istəyənlər üçün uyğundur. Hər tur alışında Labpoint bonus xalları qazanır, növbəti səyahətinizdə istifadə edə bilərsiniz.',
    ],
  },
};

export function getTourCategoryMeta(category) {
  return TOUR_CATEGORY_META[category || ''] || TOUR_CATEGORY_META[''];
}
