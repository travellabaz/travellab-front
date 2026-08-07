// One relevant service page per blog category, used to fill the 3rd card
// in each post's end-of-article "Əlaqəli məzmun" block (2 same-category
// posts + this). Fixed mapping, not content-derived — there's no admin
// panel to pick this per post, and the category set is small/stable enough
// that a hardcoded table is simpler than inferring it.
export const CATEGORY_SERVICE_LINKS = {
  'Məsləhətlər': { label: 'Aviabilet axtarışı', to: '/search' },
  'Bələdçi': { label: 'Hazır tur paketləri', to: '/tours' },
  'Xəbərlər': { label: 'Uçuş və otel təklifləri', to: '/search' },
  'Macəra': { label: 'Ekzotik turlar', to: '/tours?category=Ekzotik' },
  'Vizasız Ölkələr': { label: 'Viza xidməti', to: '/viza' },
  'Tibbi Turizm': { label: 'Travellab haqqında', to: '/about' },
};
