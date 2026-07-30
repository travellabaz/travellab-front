import HeroSearch from '../sections/HeroSearch';
import HotelsSection from '../sections/HotelsSection';
import ToursSection from '../sections/ToursSection';
import LabpointSection from '../sections/LabpointSection';
import EventsSection from '../sections/EventsSection';
import AboutSection from '../sections/AboutSection';
import PartnersSection from '../sections/PartnersSection';
import BlogSection from '../sections/BlogSection';

// The homepage flat-scrolls every section together (except Viza, which is
// reachable only via its own dedicated page/nav link).
export default function HomePage() {
  return (
    <main className="tpwl-main">
      <HeroSearch />
      <HotelsSection />
      <ToursSection />
      <LabpointSection />
      <EventsSection />
      <AboutSection />
      <PartnersSection />
      <BlogSection />
    </main>
  );
}
