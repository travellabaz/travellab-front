import { Route, Routes } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import HotelsPage from './pages/HotelsPage';
import ToursPage from './pages/ToursPage';
import LabpointPage from './pages/LabpointPage';
import EventsPage from './pages/EventsPage';
import VizaPage from './pages/VizaPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
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

  return (
    <>
      <Nav />
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
        <Route path="*" element={<HomePage />} />
      </Routes>
      <Footer />

      <TourModal />
      <AuthModal />
      <PrivacyModal />
      <TermsModal />
    </>
  );
}
