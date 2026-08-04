import { Route, Routes, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import MobileTabBar from './components/MobileTabBar';
import GoogleOneTap from './components/GoogleOneTap';
import Footer from './components/Footer';
import AttributionFooter from './components/AttributionFooter';
import CookieBanner from './components/CookieBanner';
import HeroSearch from './sections/HeroSearch';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import HotelsPage from './pages/HotelsPage';
import ToursPage from './pages/ToursPage';
import LabpointPage from './pages/LabpointPage';
import EventsPage from './pages/EventsPage';
import VizaPage from './pages/VizaPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ReferralRedirect from './pages/ReferralRedirect';
import AuthModal from './modals/AuthModal';
import TourModal from './modals/TourModal';
import PrivacyModal from './modals/PrivacyModal';
import TermsModal from './modals/TermsModal';
import usePageMeta from './hooks/usePageMeta';
import useSubpageClass from './hooks/useSubpageClass';
import useScrollTopOnRouteChange from './hooks/useScrollTopOnRouteChange';

export default function App() {
  usePageMeta();
  useSubpageClass();
  useScrollTopOnRouteChange();
  const location = useLocation();

  // The Travelpayouts search widget (#tpwl-search / #tpwl-tickets) only
  // initializes once and never re-detects a remounted DOM node. Keeping
  // HeroSearch permanently mounted and just toggling its visibility (the
  // same display:none trick the original single-page version used)
  // avoids React Router unmounting it on navigation and killing the
  // widget on the way back to "/" or "/search".
  const showHero = location.pathname === '/' || location.pathname === '/search';

  return (
    <>
      <Nav />
      <MobileTabBar />
      <div className="tpwl-main" style={showHero ? undefined : { display: 'none' }}>
        <HeroSearch />
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/labpoint" element={<LabpointPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/viza" element={<VizaPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/r/:code" element={<ReferralRedirect />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <Footer />
      <AttributionFooter />
      <CookieBanner />

      <TourModal />
      <AuthModal />
      <PrivacyModal />
      <TermsModal />
      <GoogleOneTap />
    </>
  );
}
