import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BASE_URL, PAGE_META } from '../data/pageMeta';
import { getPostBySlug } from '../data/blog';

// Matches the default set in index.html — reused here to reset og:image/
// twitter:image back to it when navigating off a blog post (an SPA route
// change doesn't reload index.html's own tags, so without this the last
// post's cover image would linger on every page after it).
const DEFAULT_OG_IMAGE = BASE_URL + '/images/hero/balloons.jpg';

// Mirrors the original tlActivatePage()'s per-page <title>/meta/canonical/
// breadcrumb-JSON-LD updates, driven by the router location instead of
// location.hash.
export default function usePageMeta() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
    const postSlug = path.startsWith('/blog/') ? path.slice('/blog/'.length) : null;
    const post = postSlug ? getPostBySlug(postSlug) : null;
    const page = post ? { title: `${post.title} — Travellab`, desc: post.excerpt } : PAGE_META[path] || PAGE_META['/'];
    const isHome = path === '/';
    const pageUrl = BASE_URL + (isHome ? '/' : path);
    const image = post
      ? (post.coverImage.startsWith('http') ? post.coverImage : BASE_URL + post.coverImage)
      : page.image
        ? (page.image.startsWith('http') ? page.image : BASE_URL + page.image)
        : DEFAULT_OG_IMAGE;

    document.title = page.title;

    const setMeta = (id, attr, value) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta-desc', 'content', page.desc);
    setMeta('og-title', 'content', page.title);
    setMeta('og-desc', 'content', page.desc);
    setMeta('og-url', 'content', pageUrl);
    setMeta('og-image', 'content', image);
    setMeta('twitter-title', 'content', page.title);
    setMeta('twitter-desc', 'content', page.desc);
    setMeta('twitter-image', 'content', image);
    setMeta('canonical', 'href', pageUrl);

    const breadcrumb = document.getElementById('breadcrumb-ld');
    if (breadcrumb) {
      const items = [{ '@type': 'ListItem', position: 1, name: 'Ana səhifə', item: BASE_URL + '/' }];
      if (!isHome) {
        items.push({ '@type': 'ListItem', position: 2, name: page.title.split(' — ')[0], item: pageUrl });
      }
      breadcrumb.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items,
      });
    }

    // Article rich-result eligibility only applies to blog posts — created
    // on demand here rather than living as a static tag in index.html like
    // breadcrumb-ld, since every other route has no article to describe.
    let articleLd = document.getElementById('article-ld');
    if (post) {
      const articleJson = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: BASE_URL + post.coverImage,
        datePublished: post.date,
        dateModified: post.date,
        author: { '@type': 'Organization', name: 'Travellab' },
        publisher: {
          '@type': 'Organization',
          name: 'Travellab',
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.svg` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
      });
      if (!articleLd) {
        articleLd = document.createElement('script');
        articleLd.type = 'application/ld+json';
        articleLd.id = 'article-ld';
        document.head.appendChild(articleLd);
      }
      articleLd.textContent = articleJson;
    } else if (articleLd) {
      articleLd.remove();
    }
  }, [location.pathname]);
}
