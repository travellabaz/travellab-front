import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BASE_URL, PAGE_META } from '../data/pageMeta';

// Mirrors the original tlActivatePage()'s per-page <title>/meta/canonical/
// breadcrumb-JSON-LD updates, driven by the router location instead of
// location.hash.
export default function usePageMeta() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
    const page = PAGE_META[path] || PAGE_META['/'];
    const isHome = path === '/';
    const pageUrl = BASE_URL + (isHome ? '/' : path);

    document.title = page.title;

    const setMeta = (id, attr, value) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta-desc', 'content', page.desc);
    setMeta('og-title', 'content', page.title);
    setMeta('og-desc', 'content', page.desc);
    setMeta('og-url', 'content', pageUrl);
    setMeta('twitter-title', 'content', page.title);
    setMeta('twitter-desc', 'content', page.desc);
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
  }, [location.pathname]);
}
