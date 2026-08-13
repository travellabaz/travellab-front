export const BASE_URL = 'https://www.travellab.az';

// One entry per route. Mirrors the original tlActivatePage()'s TL_PAGES
// title/description map, keyed by path instead of hash id.
// image is optional — routes without one fall back to the shared default
// (see DEFAULT_OG_IMAGE in usePageMeta.js / prerender.mjs). Only set where
// one of the existing photos actually depicts the page's topic; forcing a
// mismatched photo onto e.g. Labpoint or Viza would look worse than the
// generic default.
export const PAGE_META = {
  '/': {
    title: 'Səyahət Agentliyi Bakı - Aviabilet, Otel, Tur | Travellab',
    desc: 'Səyahət agentliyi Travellab ilə aviabilet, otel bron və tur paketlərini bir yerdə tapın. Viza xidməti, Labpoint bonusları. İndi bron edin!',
    image: '/images/hero/mosque-og.jpg',
  },
  '/search': {
    title: 'Aviabilet Axtarışı və Bron - Sərfəli Uçuşlar | Travellab',
    desc: 'Bakıdan bütün dünyaya sərfəli aviabilet axtarın və bron edin. Yüzlərlə aviaşirkət arasından ən əlverişli qiyməti tapın. Sürətli və etibarlı bron.',
    image: '/images/hero/plane-wing-og.jpg',
  },
  '/hotels': {
    title: 'Otel Bron - Onlayn Otel Axtarışı | Travellab',
    desc: 'Dünyanın istənilən nöqtəsində otel axtarın və onlayn bron edin. Sərfəli qiymətlər, sürətli təsdiq, Labpoint bonusları ilə otel rezervasiyası.',
    image: '/images/hero/aurora.jpg',
  },
  '/tours': {
    title: 'Tur Paketləri - Sərfəli Turlar Bakıdan | Travellab',
    desc: 'Dubay, Türkiyə, Gürcüstan və digər istiqamətlərə hazır tur paketləri. Aviabilet, otel və transfer daxil, sərfəli qiymətlərlə. İndi seçin!',
    image: '/images/hero/balloons.jpg',
  },
  '/labpoint': {
    title: 'Labpoint - Səyahət Bonus Proqramı | Travellab',
    desc: 'Labpoint loyallıq proqramı ilə hər aviabilet, otel və tur alışından bonus xal qazanın. Bonusları növbəti səyahətinizdə istifadə edin!',
    // Free Pexels stock photo (travel rewards cards + passport) — none of
    // the site's own hero photos depict a loyalty/points program.
    image: 'https://images.pexels.com/photos/32642485/pexels-photo-32642485.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
  '/about': {
    title: 'Haqqımızda - Travellab Səyahət Agentliyi | Bakı',
    desc: 'Travellab — Bakıda fəaliyyət göstərən etibarlı səyahət agentliyi. ATAA üzvü, aviabilet, otel, tur və viza xidmətləri. Bizi tanıyın!',
    image: '/images/hero/mosque-og.jpg',
  },
  '/blog': {
    title: 'Səyahət Bələdçisi və Məsləhətlər - Bloq | Travellab',
    desc: 'Şəhər bələdçiləri, viza təlimatları, macəra hekayələri və səyahət xəbərləri. Travellab bloqunda faydalı məlumatlar tapın.',
  },
  '/events': {
    title: 'Tədbir Biletləri - Konsert, Şou, Festival | Travellab',
    desc: 'Bakıda və digər şəhərlərdə konsert, şou və tədbir biletlərini onlayn əldə edin. Sürətli və etibarlı bilet alışı Travellab ilə.',
    // Free Pexels stock photo (concert crowd) — no in-house concert photo.
    image: 'https://images.pexels.com/photos/30215324/pexels-photo-30215324.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
  '/viza': {
    title: 'Viza Xidmətləri - Sürətli və Etibarlı | Travellab',
    desc: 'Türkiyə, Şengen, Dubay və digər ölkələr üçün viza xidməti. Sənəd hazırlığından təhvilə qədər tam dəstək. Sürətli və etibarlı proses.',
    // Free Pexels stock photo (passports + travel documents).
    image: 'https://images.pexels.com/photos/33497885/pexels-photo-33497885.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
  '/hediyye-karti': {
    title: 'Hədiyyə Kartı - Səyahət Hədiyyə Edin | Travellab',
    desc: 'Travellab Hədiyyə Kartı ilə sevdiklərinizə səyahət hədiyyə edin. Aviabilet, otel və turlarda keçərli, 1 il müddətinə etibarlıdır.',
  },
};
