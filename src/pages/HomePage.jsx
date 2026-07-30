import ToursSection from '../sections/ToursSection';
import IdeasSection from '../sections/IdeasSection';
import HotelsSection from '../sections/HotelsSection';
import CtaSection from '../sections/CtaSection';
import EventsSection from '../sections/EventsSection';
import RegionsSection from '../sections/RegionsSection';
import LabpointSection from '../sections/LabpointSection';
import AboutSection from '../sections/AboutSection';
import PartnersSection from '../sections/PartnersSection';
import BlogSection from '../sections/BlogSection';

// HeroSearch (the Travelpayouts search widget) is mounted persistently in
// App.jsx instead of here — see the comment there for why.
// The homepage flat-scrolls every section together (except Viza, which is
// reachable only via its own dedicated page/nav link).
export default function HomePage() {
  return (
    <main className="tpwl-main">
      <ToursSection />
      <IdeasSection />
      <HotelsSection />
      <CtaSection />
      <EventsSection />
      <RegionsSection />
      <LabpointSection />
      <AboutSection />
      <PartnersSection />
      <BlogSection />
    </main>
  );
}
