import { Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Nav from './components/Nav';
import MobileTabBar from './components/MobileTabBar';
import GoogleOneTap from './components/GoogleOneTap';
import Footer from './components/Footer';
import AttributionFooter from './components/AttributionFooter';
import CookieBanner from './components/CookieBanner';
import LocaleFrame from './components/LocaleFrame';
import HeroSearch from './sections/HeroSearch';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import SearchPage from './pages/SearchPage';
import HotelsPage from './pages/HotelsPage';
import ToursPage from './pages/ToursPage';
import TourDetailPage from './pages/TourDetailPage';
import TourSearchPage from './pages/TourSearchPage';
import TourSearchCountryPage from './pages/TourSearchCountryPage';
import OfferDetailPage from './pages/OfferDetailPage';
import LabpointPage from './pages/LabpointPage';
import EventsPage from './pages/EventsPage';
import VizaPage from './pages/VizaPage';
import VizaCountryPage from './pages/VizaCountryPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import GiftCardPage from './pages/GiftCardPage';
import ReferralRedirect from './pages/ReferralRedirect';
import AuthModal from './modals/AuthModal';
import PrivacyModal from './modals/PrivacyModal';
import TermsModal from './modals/TermsModal';
import usePageMeta from './hooks/usePageMeta';
import useSubpageClass from './hooks/useSubpageClass';
import useScrollTopOnRouteChange from './hooks/useScrollTopOnRouteChange';
import { stripLocalePrefix } from './utils/locale';

// One shared route list mounted under three parent layout routes (AZ
// unprefixed/default, /ru/*, /en/*) instead of tripling this JSX — see
// LocaleFrame.jsx. Paths here are relative (no leading slash) since
// they're nested under each locale branch's own "/*" parent. Keyed
// because this array gets reused as children across three separate
// parents, not because of any normal list-rendering need.
function localeRouteChildren() {
  return [
    <Route key="home" index element={<HomePage />} />,
    <Route key="search" path="search" element={<SearchPage />} />,
    <Route key="hotels" path="hotels" element={<HotelsPage />} />,
    <Route key="tours" path="tours" element={<ToursPage />} />,
    <Route key="tours-search" path="tours/search" element={<TourSearchPage />} />,
    <Route key="tours-search-offer" path="tours/search/offer" element={<OfferDetailPage />} />,
    <Route key="tours-search-country" path="tours/search/:country" element={<TourSearchCountryPage />} />,
    <Route key="tours-id" path="tours/:id" element={<TourDetailPage />} />,
    <Route key="labpoint" path="labpoint" element={<LabpointPage />} />,
    <Route key="events" path="events" element={<EventsPage />} />,
    <Route key="viza" path="viza" element={<VizaPage />} />,
    <Route key="viza-country" path="viza/:country" element={<VizaCountryPage />} />,
    <Route key="about" path="about" element={<AboutPage />} />,
    <Route key="blog" path="blog" element={<BlogPage />} />,
    <Route key="blog-slug" path="blog/:slug" element={<BlogPostPage />} />,
    <Route key="gift-card" path="hediyye-karti" element={<GiftCardPage />} />,
    <Route key="not-found" path="*" element={<NotFoundPage />} />,
  ];
}

export default function App() {
  usePageMeta();
  useSubpageClass();
  useScrollTopOnRouteChange();
  const location = useLocation();
  const { t } = useTranslation();

  // Locale-prefix-aware: /ru and /en both count as "home" too, same as /.
  const barePath = stripLocalePrefix(location.pathname);

  // The Travelpayouts search widget (#tpwl-search / #tpwl-tickets) only
  // initializes once and never re-detects a remounted DOM node. Keeping
  // HeroSearch permanently mounted and just toggling its visibility (the
  // same display:none trick the original single-page version used)
  // avoids React Router unmounting it on navigation and killing the
  // widget on the way back to "/" or "/search".
  const showHero = barePath === '/' || barePath === '/search';
  // HeroSearch's own default covers "/" — only override for "/search",
  // matching SEO Paketi v2's per-route H1 (HeroSearch itself keeps a
  // single persistent DOM instance regardless, see the comment above).
  const heroTitle =
    barePath === '/search' ? (
      <>
        {t('hero.searchTitlePlain')}<br />
        <span className="acc">{t('hero.searchTitleAccent')}</span>
      </>
    ) : undefined;

  return (
    <>
      <Nav />
      <MobileTabBar />
      <div className="tpwl-main" style={showHero ? undefined : { display: 'none' }}>
        <HeroSearch title={heroTitle} />
      </div>
      <Routes>
        <Route path="/ru/*" element={<LocaleFrame lang="ru" />}>
          {localeRouteChildren()}
        </Route>
        <Route path="/en/*" element={<LocaleFrame lang="en" />}>
          {localeRouteChildren()}
        </Route>
        <Route path="/r/:code" element={<ReferralRedirect />} />
        <Route path="/*" element={<LocaleFrame lang="az" />}>
          {localeRouteChildren()}
        </Route>
      </Routes>
      <Footer />
      <AttributionFooter />
      <CookieBanner />

      <AuthModal />
      <PrivacyModal />
      <TermsModal />
      <GoogleOneTap />
    </>
  );
}
