import { useTranslation } from 'react-i18next';
import StoriesSection from '../sections/StoriesSection';
import ToursSection from '../sections/ToursSection';
import HotelsSection from '../sections/HotelsSection';
import CtaSection from '../sections/CtaSection';
import EventsSection from '../sections/EventsSection';
import LabpointSection from '../sections/LabpointSection';
import ShopSection from '../sections/ShopSection';
import PartnersSection from '../sections/PartnersSection';
import SeoBodyText from '../components/SeoBodyText';

// HeroSearch (the Travelpayouts search widget) is mounted persistently in
// App.jsx instead of here — see the comment there for why.
// About and Blog stay reachable via their own dedicated pages/nav links,
// just not flattened into the homepage scroll.
export default function HomePage() {
  const { t } = useTranslation();
  return (
    <main className="tpwl-main">
      <StoriesSection />
      <ToursSection />
      <ShopSection />
      <HotelsSection />
      <CtaSection />
      <EventsSection />
      <LabpointSection />
      <PartnersSection />

      <section>
        <div className="tl-section" style={{ paddingTop: 0 }}>
          <SeoBodyText>
            <p>{t('home.seoP1')}</p>
            <p>{t('home.seoP2')}</p>
            <p>{t('home.seoP3')}</p>
            <p>{t('home.seoP4')}</p>
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
