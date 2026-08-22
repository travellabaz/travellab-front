import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BASE_URL, PAGE_META } from '../data/pageMeta';
import { getPostBySlug, isPostAvailableInLocale, BLOG_POSTS } from '../data/blog';
import { useTours } from '../context/ToursContext';
import { truncate } from '../utils/text';
import { getVizaCountryBySlug } from '../data/vizaCountries';
import { getTourSearchCountryBySlug } from '../data/tourSearchCountries';
import { getFlightRouteBySlug } from '../data/flightRoutes';
import { toAccusative } from '../utils/ruGrammar';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n';
import { getLocaleFromPathname, stripLocalePrefix, buildLocalizedPath } from '../utils/locale';

// Matches the default set in index.html — reused here to reset og:image/
// twitter:image back to it when navigating off a blog post (an SPA route
// change doesn't reload index.html's own tags, so without this the last
// post's cover image would linger on every page after it).
const DEFAULT_OG_IMAGE = BASE_URL + '/images/hero/balloons.jpg';

// Static-route path -> seo.* translation namespace key. Everything else
// (blog posts, tours, viza/tour-search countries) builds its title/desc
// from the actual entity instead of a fixed table.
const SEO_KEY_BY_PATH = {
  '/': 'home',
  '/search': 'search',
  '/hotels': 'hotels',
  '/tours': 'tours',
  '/labpoint': 'labpoint',
  '/about': 'about',
  '/blog': 'blog',
  '/events': 'events',
  '/viza': 'viza',
  '/hediyye-karti': 'giftCard',
  '/endirimler': 'endirimler',
};

// Mirrors the original tlActivatePage()'s per-page <title>/meta/canonical/
// breadcrumb-JSON-LD updates, driven by the router location instead of
// location.hash. Locale-prefix-aware throughout: every lookup matches
// against the bare (unprefixed) path, and hreflang alternates are added
// for the other two languages.
export default function usePageMeta() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  // Tours aren't known at build time (fetched from Instagram, see
  // ToursContext) — can't be a PAGE_META entry like the fixed routes.
  // Unlike blog posts they also can't be prerendered per-URL for the same
  // reason, so this only reaches crawlers that execute JS (Googlebot does;
  // WhatsApp/Telegram/Facebook link previews won't get a tour-specific
  // image/title).
  const { tours, loading: toursLoading } = useTours();

  useEffect(() => {
    const lang = getLocaleFromPathname(location.pathname);
    const rawPath = stripLocalePrefix(location.pathname);
    const path = rawPath === '/' ? '/' : rawPath.replace(/\/$/, '');
    const postSlug = path.startsWith('/blog/') ? path.slice('/blog/'.length) : null;
    const post = postSlug ? getPostBySlug(postSlug, lang) : null;
    const tourIdMatch = /^\/tours\/([^/]+)$/.exec(path);
    const tour = tourIdMatch ? tours.find((t) => String(t.id) === tourIdMatch[1]) : null;
    // Only true once the live tours list has actually loaded — while it's
    // still loading, tour is legitimately null for every tour ID, active
    // or not, and flashing noindex during that window would be wrong.
    // Server-side (prerender.mjs) already 301s a stale tour ID at build
    // time; this covers the same case for any visit that lands on this ID
    // between builds, once the client confirms it's really gone.
    const tourNotFound = !!tourIdMatch && !toursLoading && !tour;
    const vizaCountryMatch = /^\/viza\/([^/]+)$/.exec(path);
    const vizaCountry = vizaCountryMatch ? getVizaCountryBySlug(vizaCountryMatch[1]) : null;
    const vizaCountryName = vizaCountry ? t(`countries.${vizaCountry.name}`, vizaCountry.name) : null;
    // "Виза в Грецию", not the bare nominative "Виза в Греция" — see
    // utils/ruGrammar.js (AZ/EN pass through unchanged).
    const vizaCountryNameAcc = vizaCountryName ? toAccusative(vizaCountryName, i18n.language) : null;
    const tourSearchCountryMatch = /^\/tours\/search\/([^/]+)$/.exec(path);
    const tourSearchCountry = tourSearchCountryMatch ? getTourSearchCountryBySlug(tourSearchCountryMatch[1]) : null;
    const tourSearchCountryName = tourSearchCountry ? t(`countries.${tourSearchCountry.nameAz}`, tourSearchCountry.nameAz) : null;
    const flightRouteMatch = /^\/ucuslar\/([^/]+)$/.exec(path);
    const flightRoute = flightRouteMatch ? getFlightRouteBySlug(flightRouteMatch[1]) : null;
    const flightRouteDestination = flightRoute ? t(`flightCities.${flightRoute.cityKey}`, flightRoute.cityKey) : null;
    // Query-param-driven, not path-driven — prerender.mjs only produces one
    // static file for "/tours" regardless of ?category=, so this switch
    // only reaches JS-executing crawlers/visitors, same limitation every
    // other query-param view on this site already has.
    const isToursList = path === '/tours';
    const category = isToursList ? new URLSearchParams(location.search).get('category') || '' : null;
    const categoryMetaKey = category || 'all';

    const seoKey = SEO_KEY_BY_PATH[path];
    const page = post
      ? { title: `${post.title} — Travellab`, desc: post.metaDescription || post.excerpt }
      : tour
        ? { title: tour.metaTitle || `${tour.title} — Travellab`, desc: tour.metaDescription || truncate(tour.description, 160) }
        : vizaCountry
          ? { title: t('seo.vizaCountryTitle', { country: vizaCountryNameAcc, defaultValue: `${vizaCountryNameAcc} — Travellab` }), desc: t('seo.vizaCountryDesc', { country: vizaCountryNameAcc, defaultValue: '' }) }
          : tourSearchCountry
            ? { title: t('seo.tourSearchCountryTitle', { country: tourSearchCountryName, defaultValue: `${tourSearchCountryName} — Travellab` }), desc: t('seo.tourSearchCountryDesc', { country: tourSearchCountryName, defaultValue: '' }) }
            : flightRoute
              ? { title: t('seo.flightRouteTitle', { origin: t('flights.baku'), destination: flightRouteDestination, defaultValue: `${flightRouteDestination} — Travellab` }), desc: t('seo.flightRouteDesc', { destination: flightRouteDestination, defaultValue: '' }) }
              : isToursList
                ? { title: t(`tourCategoryMeta.${categoryMetaKey}.title`), desc: t(`tourCategoryMeta.${categoryMetaKey}.desc`) }
                : seoKey
                  ? { title: t(`seo.${seoKey}.title`), desc: t(`seo.${seoKey}.desc`) }
                  : { title: t('notFound.title') + ' — Travellab', desc: t('notFound.desc') };

    const pageImage = seoKey ? PAGE_META[path === '/' ? '/' : path]?.image : undefined;

    const isHome = path === '/';
    const localizedPath = buildLocalizedPath(path, lang) + (isToursList ? location.search : '');
    const pageUrl = BASE_URL + (localizedPath === '' ? '/' : localizedPath);
    const image = post
      ? (post.coverImage.startsWith('http') ? post.coverImage : BASE_URL + post.coverImage)
      : tour && tour.imageUrl
        ? tour.imageUrl
        : pageImage
          ? (pageImage.startsWith('http') ? pageImage : BASE_URL + pageImage)
          : DEFAULT_OG_IMAGE;

    document.title = page.title;
    document.documentElement.lang = lang;

    const setMeta = (id, attr, value) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta-desc', 'content', page.desc);
    setMeta('og-title', 'content', page.title);
    setMeta('og-desc', 'content', page.desc);
    setMeta('og-url', 'content', pageUrl);
    setMeta('og-image', 'content', image);
    setMeta('og-locale', 'content', lang === 'az' ? 'az_AZ' : lang === 'ru' ? 'ru_RU' : 'en_US');
    setMeta('twitter-title', 'content', page.title);
    setMeta('twitter-desc', 'content', page.desc);
    setMeta('twitter-image', 'content', image);
    setMeta('canonical', 'href', pageUrl);
    setMeta('meta-robots', 'content', tourNotFound ? 'noindex, follow' : 'index, follow');

    // hreflang alternates — one per supported language pointing at the
    // equivalent page, plus x-default (-> AZ, the unprefixed default).
    // Blog posts only get alternates for languages that post actually has
    // (see data/blog/index.js) — no old AZ-only post pretends to have a
    // RU/EN version.
    const availableLangs = post
      ? SUPPORTED_LANGUAGES.filter((l) => {
          const raw = BLOG_POSTS.find((p) => p.slug === postSlug);
          return raw && isPostAvailableInLocale(raw, l);
        })
      : SUPPORTED_LANGUAGES;
    document.querySelectorAll('link[data-hreflang]').forEach((el) => el.remove());
    availableLangs.forEach((l) => {
      const href = BASE_URL + (buildLocalizedPath(path, l) || '/') + (isToursList ? location.search : '');
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = l;
      link.href = href;
      link.setAttribute('data-hreflang', l);
      document.head.appendChild(link);
    });
    if (availableLangs.includes(DEFAULT_LANGUAGE)) {
      const defaultLink = document.createElement('link');
      defaultLink.rel = 'alternate';
      defaultLink.hreflang = 'x-default';
      defaultLink.href = BASE_URL + (path || '/') + (isToursList ? location.search : '');
      defaultLink.setAttribute('data-hreflang', 'x-default');
      document.head.appendChild(defaultLink);
    }

    const breadcrumb = document.getElementById('breadcrumb-ld');
    if (breadcrumb) {
      const homeHref = BASE_URL + (buildLocalizedPath('/', lang) || '/');
      const items = [{ name: t('breadcrumb.home'), url: homeHref }];
      if (post) {
        items.push({ name: t('footer.blog'), url: BASE_URL + buildLocalizedPath('/blog', lang) }, { name: post.title, url: pageUrl });
      } else if (tour) {
        items.push({ name: t('nav.tours'), url: BASE_URL + buildLocalizedPath('/tours', lang) }, { name: tour.title, url: pageUrl });
      } else if (vizaCountry) {
        items.push({ name: t('nav.viza'), url: BASE_URL + buildLocalizedPath('/viza', lang) }, { name: t('viza.countryPageBreadcrumb', { country: vizaCountryNameAcc }), url: pageUrl });
      } else if (tourSearchCountry) {
        items.push(
          { name: t('tourSearch.tourSearchCrumb'), url: BASE_URL + buildLocalizedPath('/tours/search', lang) },
          { name: t('tourSearch.countryTitle', { country: tourSearchCountryName }), url: pageUrl }
        );
      } else if (flightRoute) {
        items.push(
          { name: t('nav.flights'), url: BASE_URL + buildLocalizedPath('/search', lang) },
          { name: t('flights.routeBreadcrumb', { origin: t('flights.baku'), destination: flightRouteDestination }), url: pageUrl }
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
        inLanguage: lang,
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
    // the generic fallback it started with. location.search: so switching
    // /tours category pills (no pathname change) updates the meta too.
    // i18n.language: so a client-side language switch (no pathname change
    // for the AZ<->AZ case is impossible, but query/hash-only navigations
    // could theoretically leave path unchanged) always re-evaluates.
  }, [location.pathname, location.search, tours, toursLoading, t, i18n.language]);
}
