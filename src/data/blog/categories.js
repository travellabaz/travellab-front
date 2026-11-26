// Mirrors CATEGORIES in scripts/generate-blog-post.mjs — kept as a
// separate plain object here since that script runs standalone under
// Node outside the Vite/React build and can't be imported from here.
//
// 2026-11 restructure (SEO plan): every category belongs to one of our
// services and its posts send traffic to that service's page. A post's
// `category` is the slug below; the label is in the blogCategoryLabels
// translations. "Təbiət", "Səyahət Fəndləri" and "Macəra" are gone, their
// posts were moved by scripts/migrate-blog-categories.mjs.
export const BLOG_CATEGORIES = [
  { name: 'viza', class: 'cat-q' },
  { name: 'istiqametler', class: 'cat-t' },
  { name: 'aviabilet', class: 'cat-b' },
  { name: 'balayi', class: 'cat-a' },
  { name: 'mualice-turizmi', class: 'cat-o' },
  { name: 'konsertler', class: 'cat-k' },
  { name: 'korporativ', class: 'cat-c' },
  { name: 'xeberler', class: 'cat-n' },
];

// old ?category= links (category names before 2026-11) still open the right list
export const LEGACY_CATEGORIES = {
  Viza: 'viza',
  'Getməzdən Əvvəl': 'istiqametler',
  Bilet: 'aviabilet',
  Konsertlər: 'konsertler',
  Korporativ: 'korporativ',
  'Tibbi Turizm': 'mualice-turizmi',
  Xəbərlər: 'xeberler',
};
