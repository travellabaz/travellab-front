import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BASE_URL, PAGE_META } from '../data/pageMeta';
import { getPostBySlug } from '../data/blog';
import { useTours } from '../context/ToursContext';
import { truncate } from '../utils/text';
import { getVizaCountryBySlug } from '../data/vizaCountries';
import { getTourSearchCountryBySlug } from '../data/tourSearchCountries';

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
  // Tours aren't known at build time (fetched from Instagram, see
  // ToursContext) — can't be a PAGE_META entry like the fixed routes.
  // Unlike blog posts they also can't be prerendered per-URL for the same
  // reason, so this only reaches crawlers that execute JS (Googlebot does;
  // WhatsApp/Telegram/Facebook link previews won't get a tour-specific
  // image/title).
  const { tours } = useTours();

  useEffect(() => {
    const path = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
    const postSlug = path.startsWith('/blog/') ? path.slice('/blog/'.length) : null;
    const post = postSlug ? getPostBySlug(postSlug) : null;
    const tourIdMatch = /^\/tours\/([^/]+)$/.exec(path);
    const tour = tourIdMatch ? tours.find((t) => String(t.id) === tourIdMatch[1]) : null;
    const vizaCountryMatch = /^\/viza\/([^/]+)$/.exec(path);
    const vizaCountry = vizaCountryMatch ? getVizaCountryBySlug(vizaCountryMatch[1]) : null;
    const tourSearchCountryMatch = /^\/tours\/search\/([^/]+)$/.exec(path);
    const tourSearchCountry = tourSearchCountryMatch ? getTourSearchCountryBySlug(tourSearchCountryMatch[1]) : null;
    const page = post
      ? { title: `${post.title} — Travellab`, desc: post.metaDescription || post.excerpt }
      : tour
        ? { title: tour.metaTitle || `${tour.title} — Travellab`, desc: tour.metaDescription || truncate(tour.description, 160) }
        : vizaCountry
          ? {
              title: `${vizaCountry.name} Vizası - Sənədlər və Şərtlər | Travellab`,
              desc: `${vizaCountry.name} vizası üçün lazımi sənədlər, müddət və qiymət. Travellab ilə sürətli və etibarlı viza xidməti. İndi müraciət edin!`,
            }
          : tourSearchCountry
            ? {
                title: `${tourSearchCountry.nameAz} turları — canlı qiymətlər — Travellab`,
                desc: `${tourSearchCountry.nameAz} üçün canlı otel qiymətlərini axtarın — tarix, gecə sayı və ulduza görə filtrləyin, ən uyğun təklifi seçin.`,
              }
            : PAGE_META[path] || (path === '/' ? PAGE_META['/'] : { title: 'Səhifə tapılmadı — Travellab', desc: 'Axtardığınız səhifə mövcud deyil.' });
    const isHome = path === '/';
    const pageUrl = BASE_URL + (isHome ? '/' : path);
    const image = post
      ? (post.coverImage.startsWith('http') ? post.coverImage : BASE_URL + post.coverImage)
      : tour && tour.imageUrl
        ? tour.imageUrl
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
      const items = [{ name: 'Ana səhifə', url: BASE_URL + '/' }];
      if (post) {
        items.push({ name: 'Bloq', url: BASE_URL + '/blog' }, { name: post.title, url: pageUrl });
      } else if (tour) {
        items.push({ name: 'Turlar', url: BASE_URL + '/tours' }, { name: tour.title, url: pageUrl });
      } else if (vizaCountry) {
        items.push({ name: 'Viza', url: BASE_URL + '/viza' }, { name: `${vizaCountry.name} vizası`, url: pageUrl });
      } else if (tourSearchCountry) {
        items.push(
          { name: 'Tur axtarışı', url: BASE_URL + '/tours/search' },
          { name: `${tourSearchCountry.nameAz} turları`, url: pageUrl }
        );
      } else if (!isHome) {
        items.push({ name: page.title.split(' — ')[0], url: pageUrl });
      }
      breadcrumb.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
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
    // tours: re-run once the async fetch in ToursContext resolves, so a
    // /tours/:id visit gets the real title/image instead of staying on
    // the generic fallback it started with.
  }, [location.pathname, tours]);
}
