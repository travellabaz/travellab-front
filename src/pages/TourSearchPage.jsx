import { useEffect, useState } from 'react';
import OfferSearchFilters from '../components/OfferSearchFilters';
import OfferCard from '../components/OfferCard';
import { getDestinations, searchOffers } from '../api/offers';

const RESULTS_PER_PAGE = 12;

export default function TourSearchPage() {
  const [destinations, setDestinations] = useState([]);
  const [offers, setOffers] = useState(null); // null = no search run yet
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getDestinations()
      .then(setDestinations)
      .catch((err) => console.error('ActionLog.offers.destinationsFailed', err));
  }, []);

  const runSearch = (criteria) => {
    setLoading(true);
    setFailed(false);
    setPage(1);
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
  };

  const totalPages = offers ? Math.max(1, Math.ceil(offers.length / RESULTS_PER_PAGE)) : 1;
  const pageOffers = offers ? offers.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE) : [];

  const goToPage = (n) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="tpwl-main">
      <section id="tour-search" className="tl-page-top">
        <div className="tl-section">
          <div className="tl-section-header">
            <div>
              <div className="tl-tag">Canlı Axtarış</div>
              <h2 className="tl-title">Tur axtarışı</h2>
            </div>
          </div>

          <OfferSearchFilters destinations={destinations} onSearch={runSearch} loading={loading} />

          {loading && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              Axtarılır...
            </div>
          )}
          {!loading && failed && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              Axtarış zamanı xəta baş verdi, yenidən cəhd edin.
            </div>
          )}
          {!loading && !failed && offers && offers.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              Bu filtrlərə uyğun təklif tapılmadı.
            </div>
          )}

          {!loading && pageOffers.length > 0 && (
            <div className="tl-offer-grid">
              {pageOffers.map((offer, i) => (
                <OfferCard key={i} offer={offer} />
              ))}
            </div>
          )}

          {totalPages > 1 && offers && offers.length > 0 && (
            <nav className="tl-pagination" aria-label="Nəticə səhifələri">
              <button type="button" className="tl-pagination-btn" onClick={() => goToPage(page - 1)} disabled={page === 1}>
                ← Əvvəlki
              </button>
              <div className="tl-pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`tl-pagination-page${n === page ? ' active' : ''}`}
                    onClick={() => goToPage(n)}
                    aria-current={n === page ? 'page' : undefined}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button type="button" className="tl-pagination-btn" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>
                Növbəti →
              </button>
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}
