// Every post is a standalone JSON file under ./posts — that's what both the
// React app (via this glob) and the plain-Node prerender script (via a
// direct fs.readdirSync, see prerender.mjs) read from. No backend: a new
// post is just a new file, committed and pushed like any other change.
const modules = import.meta.glob('./posts/*.json', { eager: true });

export const BLOG_POSTS = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

// Two post shapes coexist: older posts (pre-trilingual) are flat AZ-only
// objects (title/excerpt/body directly on the post); newer posts carry an
// az/ru/en key each holding {title, excerpt, metaDescription, body} for
// that language (see scripts/generate-blog-post.mjs) — everything else
// (slug, category, date, coverImage) is shared across languages since
// it's the same underlying post. Existing posts were deliberately not
// migrated to the new shape (see the i18n plan) — RU/EN readers simply
// don't see them.
function hasLocaleVariants(post) {
  return !!(post.az || post.ru || post.en);
}

export function isPostAvailableInLocale(post, locale) {
  if (!hasLocaleVariants(post)) return locale === 'az';
  return !!post[locale];
}

export function localizePost(post, locale) {
  if (!hasLocaleVariants(post)) return post;
  const variant = post[locale] || post.az;
  return { ...post, ...variant };
}

export function getPostsForLocale(locale) {
  return BLOG_POSTS.filter((p) => isPostAvailableInLocale(p, locale)).map((p) => localizePost(p, locale));
}

export function getPostBySlug(slug, locale) {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post || !isPostAvailableInLocale(post, locale)) return null;
  return localizePost(post, locale);
}
