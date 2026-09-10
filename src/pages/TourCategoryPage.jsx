import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import { useTours } from '../context/ToursContext';
import { getLocaleFromPathname } from '../utils/locale';
import {
  tourParentSlug,
  tourSubSlug,
  getParentBySlug,
  getSubcategory,
  getActiveSubcategories,
  filterToursForSubcategory,
} from '../data/tourSubcategories';
import TourCard from '../components/TourCard';
import ReviewsSection from '../sections/ReviewsSection';
import FaqSection from '../components/FaqSection';
import { paginationItems } from '../utils/pagination';
import { sortTours } from '../utils/sortTours';
import SeoBodyText from '../components/SeoBodyText';

const TOURS_PER_PAGE = 12;

export default function TourCategoryPage() {
  const { t } = useTranslation();
  const { category: parentSlug, subcategory: subSlug } = useParams();
  const { tours, loading, empty } = useTours();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = getLocaleFromPathname(useLocation().pathname);

  const parentName = getParentBySlug(parentSlug);
  const sub = parentName ? getSubcategory(parentName, subSlug) : null;

  const SORT_OPTIONS = [
    { value: '', label: t('offerSearchFilters.categoryAll') },
    { value: 'price_asc', label: t('toursPage.sortCheapest') },
    { value: 'price_desc', label: t('toursPage.sortExpensive') },
    { value: 'date_asc', label: t('toursPage.sortDate') },
  ];

  if (!parentName || !sub) {
    return (
      <main className="tpwl-main">
        <section className="tl-page-top">
          <div className="tl-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <h1 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 10 }}>
              {t('toursPage.emptyCategory')}
            </h1>
            <Link
              to="/tours"
              className="tl-btn-book"
              style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff' }}
            >
              {t('toursSection.viewAll')}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const place = t(`tourSubcategoryLabels.${sub.name}`, sub.name);
  const parentLabel = t(`tourCategoryLabels.${parentName}`);
  const parentSlugSeg = tourParentSlug(parentName, lang);

  const siblings = getActiveSubcategories(tours, parentName);
  const matchedTours = filterToursForSubcategory(tours, parentName, sub);

  const sort = searchParams.get('sort') || '';
  const sortedTours = sortTours(matchedTours, sort);

  const totalPages = Math.max(1, Math.ceil(sortedTours.length / TOURS_PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, parseInt(searchParams.get('page'), 10) || 1));
  const pageTours = sortedTours.slice((page - 1) * TOURS_PER_PAGE, page * TOURS_PER_PAGE);

  const goToPage = (n) => {
    if (n === 1) searchParams.delete('page');
    else searchParams.set('page', String(n));
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectSort = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('sort', value);
    else next.delete('sort');
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <main className="tpwl-main">
      <section id="tours" className="tl-page-top">
        <div className="tl-section">
          <nav className="tl-crumbs" aria-label="Breadcrumb">
            <Link to="/tours">{t('nav.tours')}</Link>
            <span aria-hidden="true"> › </span>
            <Link to={`/tours?category=${encodeURIComponent(parentName)}`}>{parentLabel}</Link>
            <span aria-hidden="true"> › </span>
            <span aria-current="page">{place}</span>
          </nav>

          <div className="tl-section-header">
            <div>
              <div className="tl-tag">{t('toursPage.tag')}</div>
              <h1 className="tl-title">{t('tourSubcategory.h1', { place })}</h1>
            </div>
          </div>

          <div className="tl-blog-filter tl-tour-subfilter" aria-label="Tour sub-categories">
            <Link to={`/tours?category=${encodeURIComponent(parentName)}`} className="tl-blog-filter-pill">
              {t('tourSubcategory.backToParent', { parent: parentLabel })}
            </Link>
            {siblings.map((s) => (
              <Link
                key={s.slug}
                to={`/tours/${parentSlugSeg}/${tourSubSlug(s, lang)}`}
                className={`tl-blog-filter-pill${s.slug === sub.slug ? ' active' : ''}`}
                aria-current={s.slug === sub.slug ? 'page' : undefined}
              >
                {t(`tourSubcategoryLabels.${s.name}`, s.name)}
              </Link>
            ))}
          </div>

          {!loading && !empty && matchedTours.length > 0 && (
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
          {!loading && matchedTours.length === 0 && (
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
        </div>
      </section>

      <ReviewsSection />

      <FaqSection tag={t('toursFaq.tag')} title={t('toursFaq.title')} items={t('toursFaq.items', { returnObjects: true })} />

      <section>
        <div className="tl-section">
          <SeoBodyText key={`${parentSlugSeg}/${sub.slug}`}>
            <p>{t('tourSubcategory.intro1', { place, parent: parentLabel })}</p>
            <p>{t('tourSubcategory.intro2', { place })}</p>
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
