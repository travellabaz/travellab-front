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
    title: 'Travellab — Bilet və Otel',
    desc: 'Yüzlərlə travel saytını bir anda axtarıb sizin üçün ən ucuz uçuşları tapırıq.',
    image: '/images/hero/mosque-og.jpg',
  },
  '/search': {
    title: 'Travellab — Bilet və Otel axtarışı',
    desc: 'Yüzlərlə travel saytını bir anda axtarıb sizin üçün ən ucuz uçuş biletlərini tapırıq. Travellab ilə asanlıqla tap, sürətlə bron et.',
    image: '/images/hero/plane-wing-og.jpg',
  },
  '/hotels': {
    title: 'Otellər — Travellab',
    desc: 'Dünyanın 220-dən çox ölkəsində 2,6 milyondan artıq oteli müqayisə edin və Travellab ilə ən sərfəli qiymətə bron edin.',
    image: '/images/hero/aurora.jpg',
  },
  '/tours': {
    title: 'Turlar — Travellab',
    desc: 'Travellab ilə dünyanın bütün bölgələrinə hazır tur paketləri: Avropa, Asiya, Balkanlar, Baltik, Şimali Amerika və Okeaniya.',
    image: '/images/hero/balloons.jpg',
  },
  '/labpoint': {
    title: 'Labpoint — Travellab',
    desc: 'Hər səyahətdən Labpoint qazanın və qazandığınız xalları növbəti bilet, otel və ya tur bronunda endirim kimi istifadə edin.',
  },
  '/about': {
    title: 'Haqqımızda — Travellab',
    desc: 'Travellab — Azərbaycanın aparıcı turizm şirkətlərindən biri. Biz kimik, nə təklif edirik və etibarlı partnyorlarımızla tanış olun.',
    image: '/images/hero/mosque-og.jpg',
  },
  '/blog': {
    title: 'Blog — Travellab',
    desc: 'Səyahət məsləhətləri, viza məlumatları və Travellab komandasından faydalı bloq yazıları.',
  },
  '/events': {
    title: 'Konsert və Tədbir Biletləri — Travellab',
    desc: 'Travellab ilə dünya üzrə konsert, şou və idman tədbirlərinin biletlərini tapın — axtarın, seçin, biletmaster üzərindən bron edin.',
  },
  '/viza': {
    title: 'Turistik Viza — Travellab',
    desc: 'Travellab ilə vizanızı asanlıqla alın. Sənədləri, müraciəti və görüşü biz aparırıq — sorğunuza qısa müddətdə cavab veririk.',
  },
};
