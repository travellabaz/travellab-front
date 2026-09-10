// One relevant service page per blog category, used to fill the 3rd card
// in each post's end-of-article "Əlaqəli məzmun" block (2 same-category
// posts + this). Fixed mapping, not content-derived — there's no admin
// panel to pick this per post, and the category set is small/stable enough
// that a hardcoded table is simpler than inferring it. The card's label
// text lives in the blogServiceLinks translation namespace (keyed the same
// way), not here, since it's UI copy rather than data.
//
// "Macəra" kept here (not in categories.js's BLOG_CATEGORIES filter list
// anymore) so the 6 posts still tagged with it keep a working end-card
// until they're manually reassigned — see categories.js's comment.
export const CATEGORY_SERVICE_LINKS = {
  'Getməzdən Əvvəl': { to: '/tours' },
  'Bilet': { to: '/search' },
  'Viza': { to: '/viza' },
  'Konsertlər': { to: '/events' },
  'Korporativ': { to: '/korporativ' },
  'Tibbi Turizm': { to: '/about' },
  'Səyahət Fəndləri': { to: '/search' },
  'Təbiət': { to: '/tours?category=Ekzotik' },
  'Xəbərlər': { to: '/search' },
  'Macəra': { to: '/tours?category=Ekzotik' },
};
