// Mirrors CATEGORIES in scripts/generate-blog-post.mjs — kept as a
// separate plain object here since that script runs standalone under
// Node outside the Vite/React build and can't be imported from here.
//
// "Macəra" was removed from this list (client decision) but is NOT
// migrated on the 6 existing posts still tagged with it — those are
// being reassigned to "Təbiət" or "Səyahət Fəndləri" by hand, post by
// post, not automatically. Their blogCategoryLabels/blogServiceLinks
// entries stay in the i18n files and CATEGORY_SERVICE_LINKS so those
// posts keep rendering correctly until that manual pass happens.
export const BLOG_CATEGORIES = [
  { name: 'Getməzdən Əvvəl', class: 'cat-t' },
  { name: 'Bilet', class: 'cat-b' },
  { name: 'Viza', class: 'cat-q' },
  { name: 'Konsertlər', class: 'cat-k' },
  { name: 'Korporativ', class: 'cat-c' },
  { name: 'Tibbi Turizm', class: 'cat-o' },
  { name: 'Səyahət Fəndləri', class: 'cat-a' },
  { name: 'Təbiət', class: 'cat-e' },
  { name: 'Xəbərlər', class: 'cat-n' },
];
