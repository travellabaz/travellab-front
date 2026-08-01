// Mirrors CATEGORIES in scripts/generate-blog-post.mjs — kept as a
// separate plain object here since that script runs standalone under
// Node outside the Vite/React build and can't be imported from here.
export const BLOG_CATEGORIES = [
  { name: 'Məsləhətlər', class: 'cat-a' },
  { name: 'Bələdçi', class: 'cat-t' },
  { name: 'Xəbərlər', class: 'cat-n' },
  { name: 'Macəra', class: 'cat-m' },
];
