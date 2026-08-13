import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import Breadcrumb from '../components/Breadcrumb';
import SeoBodyText from '../components/SeoBodyText';
import ToursSection from '../sections/ToursSection';
import { getFlightRouteBySlug } from '../data/flightRoutes';
import { fillFlightWidgetDestination } from '../utils/flightWidgetFill';
import { formatFlightDuration } from '../utils/flightDuration';

// The actual search UI is the persistently-mounted HeroSearch widget (see
// App.jsx's showHero/heroTitle) — this page only adds the destination
// pre-fill (best-effort, see flightWidgetFill.js) and the per-route SEO
// body copy below it, same division of labour as SearchPage.jsx.
export default function FlightRoutePage() {
  const { t, i18n } = useTranslation();
  const { route: slug } = useParams();
  const route = getFlightRouteBySlug(slug);

  // Depends on route (not just mount) so navigating client-side between
  // two /ucuslar/:route pages re-runs the fill — React Router keeps this
  // component instance mounted across a param-only change, it doesn't
  // remount.
  useEffect(() => {
    // Skip Kyiv: Ukrainian airspace has been closed to civil aviation
    // since Feb 2022 — pre-filling a destination with no real service
    // would just point visitors at a dead search.
    if (!route || route.status === 'suspended') return;
    fillFlightWidgetDestination(route.searchTerm, route.iata).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.slug]);

  if (!route) {
    return (
      <main className="tpwl-main">
        <section className="tl-page-top">
          <div className="tl-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <h1 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 10 }}>
              {t('flights.routeNotFound')}
            </h1>
            <Link to="/search" className="tl-btn-book" style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff' }}>
              {t('flights.backToSearch')}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const origin = t('flights.baku');
  const destination = t(`flightCities.${route.cityKey}`, route.cityKey);
  const duration = formatFlightDuration(route.durationMin, i18n.language);

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section" style={{ paddingBottom: 0 }}>
          <Breadcrumb
            items={[
              { name: t('breadcrumb.home'), to: '/' },
              { name: t('nav.flights'), to: '/search' },
              { name: t('flights.routeBreadcrumb', { origin, destination }) },
            ]}
          />
        </div>
      </section>
      <ToursSection />
      <section>
        <div className="tl-section">
          <SeoBodyText key={route.slug}>
            {route.status === 'suspended' && <p>{t('flights.bodySuspended', { origin, destination })}</p>}
            {route.status === 'direct' && (
              <p>
                {t('flights.bodyDirect', {
                  origin,
                  destination,
                  distance: route.distanceKm,
                  duration,
                  frequency: route.weeklyFrequency,
                  priceFrom: route.priceFromAzn,
                  priceTo: route.priceToAzn,
                })}
              </p>
            )}
            {route.status === 'seasonal' && (
              <p>
                {t('flights.bodySeasonal', {
                  origin,
                  destination,
                  duration,
                  priceFrom: route.priceFromAzn,
                  priceTo: route.priceToAzn,
                  connectingCities: route.connectingCityKeys.map((k) => t(`flightCities.${k}`, k)).join(', '),
                })}
              </p>
            )}
            {route.status === 'indirect' && (
              <p>
                {t('flights.bodyIndirect', {
                  origin,
                  destination,
                  connectingCities: route.connectingCityKeys.map((k) => t(`flightCities.${k}`, k)).join(', '),
                  airlines: route.connectingAirlines.join(', '),
                  duration,
                  priceFrom: route.priceFromAzn,
                  priceTo: route.priceToAzn,
                })}
              </p>
            )}
            {route.airlines && (
              <p>{t('flights.bodyAirlines', { destination, airlines: route.airlines.join(', ') })}</p>
            )}
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
