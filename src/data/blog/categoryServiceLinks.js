// One relevant service page per blog category, used to fill the 3rd card
// in each post's end-of-article "Əlaqəli məzmun" block (2 same-category
// posts + this). Fixed mapping, not content-derived — there's no admin
// panel to pick this per post, and the category set is small/stable enough
// that a hardcoded table is simpler than inferring it. The card's label
// text lives in the blogServiceLinks translation namespace (keyed the same
// way), not here, since it's UI copy rather than data.
export const CATEGORY_SERVICE_LINKS = {
  'Məsləhətlər': { to: '/search' },
  'Bələdçi': { to: '/tours' },
  'Xəbərlər': { to: '/search' },
  'Macəra': { to: '/tours?category=Ekzotik' },
  'Vizasız Ölkələr': { to: '/viza' },
  'Tibbi Turizm': { to: '/about' },
};
