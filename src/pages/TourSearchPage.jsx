import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import OfferSearchFilters from '../components/OfferSearchFilters';
import OfferCard from '../components/OfferCard';
import Breadcrumb from '../components/Breadcrumb';
import FaqSection from '../components/FaqSection';
import { TOUR_SEARCH_COUNTRIES } from '../data/tourSearchCountries';
import { getDestinations, searchOffers } from '../api/offers';
import { getDestinationPhotos } from '../api/photos';
import { photoQueryForCountry } from '../utils/destinationPhotos';
import { paginationItems } from '../utils/pagination';
import HotelFilter from '../components/HotelFilter';

const RESULTS_PER_PAGE = 12;

// Results already come back price-ascending from the backend (see
// KompasSearchService.search) — this only re-sorts the already-fetched
// list client-side for the other options, no extra request needed.
function sortOffers(offers, sort) {
  const sorted = [...offers];
  if (sort === 'price_desc') {
    sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  } else if (sort === 'star_desc') {
    sorted.sort((a, b) => (b.star ?? 0) - (a.star ?? 0));
  } else if (sort === 'checkin_asc') {
    sorted.sort((a, b) => (a.checkIn ?? '').localeCompare(b.checkIn ?? ''));
  } else {
    sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  }
  return sorted;
}

// Same photo set/rotation approach as HeroSearch.jsx's homepage hero and
// BlogPage.jsx's — picked client-side after hydration so prerendered/JS-less
// crawlers get a stable fallback instead of whatever Math.random() picked
// at build time.
const HERO_PHOTOS = [
  '/images/hero/aurora.jpg',
  '/images/hero/balloons.jpg',
  '/images/hero/plane-wing.jpg',
  '/images/hero/mosque.jpg',
];

// Rendered both standalone (/tours/search) and embedded by
// TourSearchCountryPage.jsx (/tours/search/:country) — `countryLabel` (the
// AZ display name) switches the hero copy/breadcrumb/FAQ to the
// country-specific version instead of duplicating this whole page per
// country. `initialCountryName` is the matching Russian name, Kompas's own
// join key against the live destinations list (see OfferSearchFilters.jsx).
export default function TourSearchPage({ initialCountryName, countryLabel }) {
  const { t } = useTranslation();
  const translatedCountryLabel = countryLabel ? t(`countries.${countryLabel}`, countryLabel) : undefined;

  const SORT_OPTIONS = [
    { value: 'price_asc', label: t('tourSearch.sortCheapest') },
    { value: 'price_desc', label: t('tourSearch.sortExpensive') },
    { value: 'star_desc', label: t('tourSearch.sortStars') },
    { value: 'checkin_asc', label: t('tourSearch.sortDate') },
  ];

  const [heroPhoto, setHeroPhoto] = useState(HERO_PHOTOS[0]);
  const [destinations, setDestinations] = useState([]);
  const [offers, setOffers] = useState(null); // null = no search run yet
  const [photos, setPhotos] = useState([]); // real destination photos for the last search's country
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('price_asc');
  const [selectedHotels, setSelectedHotels] = useState([]);

  useEffect(() => {
    setHeroPhoto(HERO_PHOTOS[Math.floor(Math.random() * HERO_PHOTOS.length)]);
  }, []);

  useEffect(() => {
    getDestinations()
      .then(setDestinations)
      .catch((err) => console.error('ActionLog.offers.destinationsFailed', err));
  }, []);

  const runSearch = (criteria) => {
    setLoading(true);
    setFailed(false);
    setPage(1);
    setSelectedHotels([]);
    searchOffers(criteria)
      .then((data) => {
        setOffers(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('ActionLog.offers.searchFailed', err);
        setOffers([]);
        setFailed(true);
        setLoading(false);
      });

    // One photo pool per search (every result shares the same selected
    // country) rather than one Pexels lookup per card.
    const country = destinations.find((d) => String(d.state) === String(criteria.state));
    if (country) {
      getDestinationPhotos(photoQueryForCountry(country.name))
        .then(setPhotos)
        .catch((err) => {
          console.error('ActionLog.offers.photosFailed', err);
          setPhotos([]);
        });
    } else {
      setPhotos([]);
    }
  };

  // Resolved once `destinations` loads — the country page (TourSearchCountryPage.jsx)
  // only knows the Russian name (Kompas's own join key), not the numeric id.
  const initialState = initialCountryName
    ? destinations.find((d) => d.name === initialCountryName)?.state
    : undefined;

  // Built from whatever's actually in this search's results, not a
  // separate hotels lookup — matches Kompas's own agent widget's hotel
  // picker (see HotelFilter.jsx), just scoped to the current result set.
  const hotelNames = offers ? [...new Set(offers.map((o) => o.hotelName).filter(Boolean))].sort() : [];
  const hotelFilteredOffers = offers
    ? selectedHotels.length
      ? offers.filter((o) => selectedHotels.includes(o.hotelName))
      : offers
    : null;
  const sortedOffers = hotelFilteredOffers ? sortOffers(hotelFilteredOffers, sort) : null;
  const totalPages = sortedOffers ? Math.max(1, Math.ceil(sortedOffers.length / RESULTS_PER_PAGE)) : 1;
  const pageOffers = sortedOffers ? sortedOffers.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE) : [];

  const goToPage = (n) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectHotels = (names) => {
    setSelectedHotels(names);
    setPage(1);
  };

  const selectSort = (value) => {
    setSort(value);
    setPage(1);
  };

  return (
    <main className="tpwl-main">
      <section className="tl-blog-hero tl-page-top">
        <div className="tl-blog-hero-photo" style={{ backgroundImage: `url('${heroPhoto}')` }} />
        <div className="tl-blog-hero-bg tl-search-hero-bg" />
        <div className="tl-blog-hero-content">
          {translatedCountryLabel && (
            <div style={{ marginBottom: 10 }}>
              <Breadcrumb
                items={[
                  { name: t('tourSearch.home'), to: '/' },
                  { name: t('tourSearch.tourSearchCrumb'), to: '/tours/search' },
                  { name: t('tourSearch.countryTitle', { country: translatedCountryLabel }) },
                ]}
              />
            </div>
          )}
          <div className="tl-hero-badge">🔍 {translatedCountryLabel || t('tourSearch.liveSearchTag')}</div>
          <h1>{translatedCountryLabel ? t('tourSearch.countryTitle', { country: translatedCountryLabel }) : t('tourSearch.defaultTitle')}</h1>
          <p>
            {translatedCountryLabel
              ? t('tourSearch.countryDesc', { country: translatedCountryLabel })
              : t('tourSearch.defaultDesc')}
          </p>
        </div>
      </section>

      <section id="tour-search">
        <div className="tl-section">
          <OfferSearchFilters destinations={destinations} onSearch={runSearch} loading={loading} initialState={initialState} />

          {loading && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              {t('tourSearch.searching')}
            </div>
          )}
          {!loading && failed && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              {t('tourSearch.searchFailed')}
            </div>
          )}
          {!loading && !failed && offers && offers.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              {t('tourSearch.noOffers')}
            </div>
          )}

          {!loading && offers && offers.length > 0 && (
            <div className="tl-searchbar-extra-group" style={{ marginBottom: 20 }}>
              <span className="tl-searchbar-extra-label">{t('tourSearch.sortLabel')}</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`tl-blog-filter-pill${sort === opt.value ? ' active' : ''}`}
                  onClick={() => selectSort(opt.value)}
                  aria-pressed={sort === opt.value}
                >
                  {opt.label}
                </button>
              ))}
              {hotelNames.length > 1 && (
                <>
                  <span className="tl-searchbar-extra-label" style={{ marginLeft: 12 }}>{t('tourSearch.hotelLabel')}</span>
                  <HotelFilter hotels={hotelNames} selected={selectedHotels} onChange={selectHotels} />
                </>
              )}
            </div>
          )}

          {!loading && pageOffers.length > 0 && (
            <div className="tl-pkg-grid">
              {pageOffers.map((offer, i) => (
                <OfferCard key={i} offer={offer} photos={photos} />
              ))}
            </div>
          )}

          {totalPages > 1 && offers && offers.length > 0 && (
            <nav className="tl-pagination" aria-label="Result pages">
              <button type="button" className="tl-pagination-btn" onClick={() => goToPage(page - 1)} disabled={page === 1}>
                {t('common.previous')}
              </button>
              <div className="tl-pagination-pages">
                {paginationItems(page, totalPages).map((n, i) =>
                  n === '…' ? (
                    <span key={`ellipsis-${i}`} className="tl-pagination-ellipsis">…</span>
                  ) : (
                    <button
                      type="button"
                      key={n}
                      className={`tl-pagination-page${n === page ? ' active' : ''}`}
                      onClick={() => goToPage(n)}
                      aria-current={n === page ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  )
                )}
              </div>
              <button type="button" className="tl-pagination-btn" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>
                {t('common.next')}
              </button>
            </nav>
          )}

          {/* Crawlable links into every per-country page — sitemap.xml lists
              them too, but a real link path matters for discovery/PageRank,
              not just inclusion in the sitemap. */}
          <div style={{ marginTop: 40 }}>
            <div className="tl-searchbar-extra-label" style={{ marginBottom: 10 }}>{t('tourSearch.popularDestinations')}</div>
            <div className="tl-blog-filter" role="list" aria-label="Tours by country">
              {TOUR_SEARCH_COUNTRIES.map((c) => (
                <Link key={c.slug} to={`/tours/search/${c.slug}`} className="tl-blog-filter-pill">
                  {t(`countries.${c.nameAz}`, c.nameAz)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {translatedCountryLabel && (
        <FaqSection tag={t('toursFaq.tag')} title={t('tourSearch.faqTitle', { country: translatedCountryLabel })} items={t('toursFaq.items', { returnObjects: true })} />
      )}
    </main>
  );
}
