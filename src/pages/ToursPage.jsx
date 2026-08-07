import { Link, useSearchParams } from 'react-router-dom';
import { useTours } from '../context/ToursContext';
import { TOUR_CATEGORIES, getTourCategory } from '../utils/tourCategory';
import TourCard from '../components/TourCard';
import ReviewsSection from '../sections/ReviewsSection';
import FaqSection from '../components/FaqSection';
import { TOURS_FAQ } from '../data/toursFaq';
import { paginationItems } from '../utils/pagination';
import { extractMinPrice } from '../utils/price';
import { extractLatestTourDate } from '../utils/tourDate';
import SeoBodyText from '../components/SeoBodyText';
import { getTourCategoryMeta } from '../data/tourCategoryMeta';

const TOURS_PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: '', label: 'Hamısı' },
  { value: 'price_asc', label: 'Ən ucuz' },
  { value: 'price_desc', label: 'Ən bahalı' },
  { value: 'date_asc', label: 'Tarixə görə' },
];

// Price/date aren't structured fields (see utils/price.js and
// utils/tourDate.js — both mined out of free-form Instagram captions), so
// sorting re-parses the caption per comparison rather than caching a sort
// key — tour counts here are small (dozens, not thousands), so the extra
// regex work per compare is cheap. Tours with no parseable date sink to
// the bottom of a date sort instead of clustering unpredictably.
function sortTours(tours, sort) {
  if (!sort) return tours;
  const sorted = [...tours];
  if (sort === 'price_asc' || sort === 'price_desc') {
    sorted.sort((a, b) => {
      const pa = extractMinPrice(a.description)?.amount ?? 0;
      const pb = extractMinPrice(b.description)?.amount ?? 0;
      return sort === 'price_asc' ? pa - pb : pb - pa;
    });
  } else if (sort === 'date_asc') {
    sorted.sort((a, b) => {
      const da = extractLatestTourDate(a.description);
      const db = extractLatestTourDate(b.description);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });
  }
  return sorted;
}

export default function ToursPage() {
  const { tours, loading, empty } = useTours();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get('category') || '';
  // Case-insensitive: the pill buttons always send an exact TOUR_CATEGORIES
  // name, but a hand-typed or externally-linked URL might not match case.
  const matchedCategory = TOUR_CATEGORIES.find(
    (c) => c.name.toLocaleLowerCase('az') === categoryParam.toLocaleLowerCase('az')
  );
  const category = matchedCategory ? matchedCategory.name : '';
  const categoryMeta = getTourCategoryMeta(category);
  const filteredTours = matchedCategory ? tours.filter((t) => getTourCategory(t).name === matchedCategory.name) : tours;

  const sort = searchParams.get('sort') || '';
  const sortedTours = sortTours(filteredTours, sort);

  const totalPages = Math.max(1, Math.ceil(sortedTours.length / TOURS_PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, parseInt(searchParams.get('page'), 10) || 1));
  const pageTours = sortedTours.slice((page - 1) * TOURS_PER_PAGE, page * TOURS_PER_PAGE);

  const goToPage = (n) => {
    if (n === 1) {
      searchParams.delete('page');
    } else {
      searchParams.set('page', String(n));
    }
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectCategory = (name) => {
    const next = new URLSearchParams(searchParams);
    if (name) {
      next.set('category', name);
    } else {
      next.delete('category');
    }
    next.delete('page');
    setSearchParams(next);
  };

  const selectSort = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('sort', value);
    } else {
      next.delete('sort');
    }
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <main className="tpwl-main">
      <section id="tours" className="tl-page-top">
        <div className="tl-section">
          <div className="tl-section-header">
            <div>
              <div className="tl-tag">Xüsusi Təkliflər</div>
              <h1 className="tl-title">Tur Paketləri — Hazır Turlar</h1>
            </div>
          </div>

          <div className="tl-blog-filter" role="tablist" aria-label="Tur kateqoriyaları">
            <button
              type="button"
              className={`tl-blog-filter-pill${category === '' ? ' active' : ''}`}
              onClick={() => selectCategory('')}
              aria-pressed={category === ''}
            >
              Bütün Turlar
            </button>
            {TOUR_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.name}
                className={`tl-blog-filter-pill${category === c.name ? ' active' : ''}`}
                onClick={() => selectCategory(c.name)}
                aria-pressed={category === c.name}
              >
                {c.name}
              </button>
            ))}
            <Link to="/tours/search" className="tl-search-cta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
                <path d="M21 21L16.5 16.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              Canlı qiymətlərlə axtar
            </Link>
          </div>

          {!loading && !empty && (
            <div className="tl-searchbar-extra-group" style={{ marginBottom: 20 }}>
              <span className="tl-searchbar-extra-label">Sırala:</span>
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
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              Turlar yüklənir...
            </div>
          )}
          {!loading && empty && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              Hazırda göstəriləcək tur yoxdur.
            </div>
          )}
          {!loading && !empty && pageTours.length === 0 && (
            <p className="tl-blog-empty">Bu kateqoriyada hələ tur yoxdur.</p>
          )}

          {!loading && pageTours.length > 0 && (
            <div className="tl-pkg-grid">
              {pageTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="tl-pagination" aria-label="Tur səhifələri">
              <button
                type="button"
                className="tl-pagination-btn"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
              >
                ← Əvvəlki
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
              <button
                type="button"
                className="tl-pagination-btn"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
              >
                Növbəti →
              </button>
            </nav>
          )}
        </div>
      </section>

      <ReviewsSection />

      <FaqSection tag="Suallar" title="Turlarla bağlı tez-tez verilən suallar" items={TOURS_FAQ} />

      <section>
        <div className="tl-section">
          <SeoBodyText key={category}>
            {categoryMeta.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
