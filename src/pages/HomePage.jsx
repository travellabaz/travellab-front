import ToursSection from '../sections/ToursSection';
import HotelsSection from '../sections/HotelsSection';
import CtaSection from '../sections/CtaSection';
import EventsSection from '../sections/EventsSection';
import LabpointSection from '../sections/LabpointSection';
import PartnersSection from '../sections/PartnersSection';

// HeroSearch (the Travelpayouts search widget) is mounted persistently in
// App.jsx instead of here — see the comment there for why.
// About and Blog stay reachable via their own dedicated pages/nav links,
// just not flattened into the homepage scroll.
export default function HomePage() {
  return (
    <main className="tpwl-main">
      <ToursSection />
      <HotelsSection />
      <CtaSection />
      <EventsSection />
      <LabpointSection />
      <PartnersSection />
    </main>
  );
}
