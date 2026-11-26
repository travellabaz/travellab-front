import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import Breadcrumb from '../components/Breadcrumb';
import { FLIGHT_ROUTES } from '../data/flightRoutes';

// "/ucuslar": every Baku route we have a page for, so the section has a real page of its own
// (it used to answer a soft 404) and Google finds all the routes from one place.
export default function FlightRoutesHubPage() {
  const { t } = useTranslation();
  const baku = t('flights.baku');
  const active = FLIGHT_ROUTES.filter((route) => route.status !== 'suspended');
  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section">
          <Breadcrumb items={[{ name: t('breadcrumb.home'), to: '/' }, { name: t('flightsHub.title') }]} />
          <h1 className="tl-title" style={{ marginTop: 12 }}>{t('flightsHub.title')}</h1>
          <p style={{ maxWidth: 760, color: 'var(--tl-gray-600)', margin: '12px 0 28px' }}>{t('flightsHub.intro')}</p>
          <div className="tl-flight-hub-grid">
            {active.map((route) => (
              <Link key={route.slug} to={`/ucuslar/${route.slug}`} className="tl-flight-hub-card">
                <span className="tl-flight-hub-route">
                  {baku} → {t(`flightCities.${route.cityKey}`, route.cityKey)}
                </span>
                <span className="tl-flight-hub-meta">
                  {route.status === 'direct' ? t('flightsHub.direct') : t('flightsHub.connecting')}
                  {route.priceFromAzn ? ` · ${t('flightsHub.from', { price: route.priceFromAzn })}` : ''}
                </span>
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 28 }}>
            <Link to="/search" className="tl-outlink">
              {t('flightsHub.searchAll')} →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
