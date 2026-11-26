// Search-engine rules of the blog, shared by the page meta hook and (copied
// as plain Node) by prerender.mjs.

// A post stays online but out of Google when it is about nothing we sell
// (post.noindex), and every English version except the ones kept on purpose
// (post.enIndexed): EN posts bring no customers from Azerbaijan.
export function isBlogPostIndexable(post, lang) {
  if (!post || post.noindex) return false;
  if (lang === 'en' && !post.enIndexed) return false;
  return true;
}

// The author shown to Google: the team that knows the topic, with its page.
export function blogAuthor(post, baseUrl) {
  const name = post.category === 'viza' ? 'Travellab viza komandası' : 'Travellab səyahət ekspertləri';
  return { '@type': 'Organization', name, url: `${baseUrl}/about` };
}

export function absoluteImage(src, baseUrl) {
  if (!src) return `${baseUrl}/images/hero/balloons.jpg`;
  return /^https?:\/\//.test(src) ? src : `${baseUrl}${src}`;
}
