import { Link, useSearchParams } from 'react-router-dom';
import { useTours } from '../context/ToursContext';
import { TOUR_CATEGORIES, getTourCategory } from '../utils/tourCategory';
import TourCard from '../components/TourCard';
import ReviewsSection from '../sections/ReviewsSection';
import FaqSection from '../components/FaqSection';
import { TOURS_FAQ } from '../data/toursFaq';

const TOURS_PER_PAGE = 12;

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
  const filteredTours = matchedCategory ? tours.filter((t) => getTourCategory(t).name === matchedCategory.name) : tours;

  const totalPages = Math.max(1, Math.ceil(filteredTours.length / TOURS_PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, parseInt(searchParams.get('page'), 10) || 1));
  const pageTours = filteredTours.slice((page - 1) * TOURS_PER_PAGE, page * TOURS_PER_PAGE);

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

      <section>
        <div className="tl-section">
          <div className="tl-article-body" style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2>Travellab Tur Paketləri Haqqında</h2>
            <p>
              Travellab səyahət agentliyi Dubay, Türkiyə, Gürcüstan və digər populyar istiqamətlərə hazır tur
              paketləri təklif edir. Hər tur paketinə aviabilet, otel gecələməsi və transfer daxildir — sərfəli
              qiymətlərlə, əlavə xərc olmadan.
            </p>
            <p>
              Tur paketlərimiz həm fərdi, həm qrup səyahətləri üçün uyğundur. Hər tur alışında Labpoint bonus
              xalları qazanır, növbəti səyahətinizdə istifadə edə bilərsiniz.
            </p>
          </div>
        </div>
      </section>

      <FaqSection tag="Suallar" title="Turlarla bağlı tez-tez verilən suallar" items={TOURS_FAQ} />
    </main>
  );
}
