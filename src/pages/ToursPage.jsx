import { useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import { useTours } from '../context/ToursContext';
import { getLocaleFromPathname } from '../utils/locale';
import { TOUR_CATEGORIES, getTourCategory } from '../utils/tourCategory';
import { tourParentSlug, tourSubSlug, getActiveSubcategories } from '../data/tourSubcategories';
import TourCard from '../components/TourCard';
import ReviewsSection from '../sections/ReviewsSection';
import FaqSection from '../components/FaqSection';
import { paginationItems } from '../utils/pagination';
import { sortTours } from '../utils/sortTours';
import SeoBodyText from '../components/SeoBodyText';

const TOURS_PER_PAGE = 12;

export default function ToursPage() {
  const { t } = useTranslation();
  const { tours, loading, empty } = useTours();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = getLocaleFromPathname(useLocation().pathname);

  const SORT_OPTIONS = [
    { value: '', label: t('offerSearchFilters.categoryAll') },
    { value: 'price_asc', label: t('toursPage.sortCheapest') },
    { value: 'price_desc', label: t('toursPage.sortExpensive') },
    { value: 'date_asc', label: t('toursPage.sortDate') },
  ];

  const categoryParam = searchParams.get('category') || '';
  // Case-insensitive: the pill buttons always send an exact TOUR_CATEGORIES
  // name, but a hand-typed or externally-linked URL might not match case.
  const matchedCategory = TOUR_CATEGORIES.find(
    (c) => c.name.toLocaleLowerCase('az') === categoryParam.toLocaleLowerCase('az')
  );
  const category = matchedCategory ? matchedCategory.name : '';
  const categoryMetaKey = category || 'all';
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
              <div className="tl-tag">{t('toursPage.tag')}</div>
              <h1 className="tl-title">{t('toursPage.title')}</h1>
            </div>
          </div>

          <div className="tl-blog-filter" role="tablist" aria-label="Tour categories">
            <button
              type="button"
              className={`tl-blog-filter-pill${category === '' ? ' active' : ''}`}
              onClick={() => selectCategory('')}
              aria-pressed={category === ''}
            >
              {t('toursPage.allTours')}
            </button>
            {TOUR_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.name}
                className={`tl-blog-filter-pill${category === c.name ? ' active' : ''}`}
                onClick={() => selectCategory(c.name)}
                aria-pressed={category === c.name}
              >
                {t(`tourCategoryLabels.${c.name}`)}
              </button>
            ))}
            <Link to="/tours/search" className="tl-search-cta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
                <path d="M21 21L16.5 16.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              {t('toursPage.liveSearch')}
            </Link>
          </div>

          {tourParentSlug(category, lang) && (() => {
            const subs = getActiveSubcategories(tours, category);
            if (subs.length === 0) return null;
            return (
              <div className="tl-blog-filter tl-tour-subfilter" aria-label="Tour sub-categories">
                {subs.map((s) => (
                  <Link
                    key={s.slug}
                    to={`/tours/${tourParentSlug(category, lang)}/${tourSubSlug(s, lang)}`}
                    className="tl-blog-filter-pill"
                  >
                    {t(`tourSubcategoryLabels.${s.name}`, s.name)}
                  </Link>
                ))}
              </div>
            );
          })()}

          {!loading && !empty && (
            <div className="tl-searchbar-extra-group" style={{ marginBottom: 20 }}>
              <span className="tl-searchbar-extra-label">{t('toursPage.sortLabel')}</span>
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
              {t('toursSection.loading')}
            </div>
          )}
          {!loading && empty && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
              {t('toursSection.empty')}
            </div>
          )}
          {!loading && !empty && pageTours.length === 0 && (
            <p className="tl-blog-empty">{t('toursPage.emptyCategory')}</p>
          )}

          {!loading && pageTours.length > 0 && (
            <div className="tl-pkg-grid">
              {pageTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="tl-pagination" aria-label="Tour pages">
              <button
                type="button"
                className="tl-pagination-btn"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
              >
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
              <button
                type="button"
                className="tl-pagination-btn"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
              >
                {t('common.next')}
              </button>
            </nav>
          )}
        </div>
      </section>

      <ReviewsSection />

      <FaqSection tag={t('toursFaq.tag')} title={t('toursFaq.title')} items={t('toursFaq.items', { returnObjects: true })} />

      <section>
        <div className="tl-section">
          <SeoBodyText key={category}>
            <p>{t(`tourCategoryMeta.${categoryMetaKey}.p1`)}</p>
            <p>{t(`tourCategoryMeta.${categoryMetaKey}.p2`)}</p>
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
