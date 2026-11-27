// Search-engine rules of the blog, shared by the page meta hook and (copied
// as plain Node) by prerender.mjs.

// A post stays online but out of Google when it is about nothing we sell
// (post.noindex), and every English version except the ones kept on purpose
// (post.enIndexed): EN posts bring no customers from Azerbaijan.
export function isBlogPostIndexable(post, lang) {
  if (!post || post.noindex) return false;
  // one language of a post on a general topic (e.g. its RU version) stays out of Google
  if (Array.isArray(post.noindexLangs) && post.noindexLangs.includes(lang)) return false;
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

// Google wants the full date and time with the zone: "2026-11-15T10:00:00+04:00" (Baku)
export function blogDateTime(date) {
  if (!date) return undefined;
  return /T/.test(date) ? date : `${date}T10:00:00+04:00`;
}

// Google takes a PNG or JPG of at least 112x112 for the publisher logo, not an SVG
export const PUBLISHER_LOGO = '/favicon-192x192.png';
