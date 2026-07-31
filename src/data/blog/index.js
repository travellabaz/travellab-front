// Every post is a standalone JSON file under ./posts — that's what both the
// React app (via this glob) and the plain-Node prerender script (via a
// direct fs.readdirSync, see prerender.mjs) read from. No backend: a new
// post is just a new file, committed and pushed like any other change.
const modules = import.meta.glob('./posts/*.json', { eager: true });

export const BLOG_POSTS = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug) || null;
}
