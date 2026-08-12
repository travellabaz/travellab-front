import { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Link from '../components/LocalizedLink';
import { getPostsForLocale } from '../data/blog';
import { BLOG_CATEGORIES } from '../data/blog/categories';
import { formatDateAz } from '../utils/date';
import { paginationItems } from '../utils/pagination';
import { getLocaleFromPathname } from '../utils/locale';

const POSTS_PER_PAGE = 8;

// Same photo set/rotation approach as HeroSearch.jsx's homepage hero —
// picked client-side after hydration so prerendered/JS-less crawlers get
// a stable fallback instead of whatever Math.random() picked at build time.
const HERO_PHOTOS = [
  '/images/hero/aurora.jpg',
  '/images/hero/balloons.jpg',
  '/images/hero/plane-wing.jpg',
  '/images/hero/mosque.jpg',
];

export default function BlogPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const lang = getLocaleFromPathname(location.pathname);
  const [heroPhoto, setHeroPhoto] = useState(HERO_PHOTOS[0]);
  useEffect(() => {
    setHeroPhoto(HERO_PHOTOS[Math.floor(Math.random() * HERO_PHOTOS.length)]);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const isKnownCategory = BLOG_CATEGORIES.some((c) => c.name === category);
  const localePosts = getPostsForLocale(lang);
  const filteredPosts = isKnownCategory ? localePosts.filter((p) => p.category === category) : localePosts;

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, parseInt(searchParams.get('page'), 10) || 1));
  const pagePosts = filteredPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

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
      <section className="tl-blog-hero tl-page-top">
        <div className="tl-blog-hero-photo" style={{ backgroundImage: `url('${heroPhoto}')` }} />
        <div className="tl-blog-hero-bg" />
        <div className="tl-blog-hero-content">
          <div className="tl-hero-badge">{t('blog.badge')}</div>
          <h1>{t('blog.title')}</h1>
          <p>{t('blog.subtitle')}</p>

          <div className="tl-blog-filter" role="tablist" aria-label="Blog categories">
            <button
              type="button"
              className={`tl-blog-filter-pill${category === '' ? ' active' : ''}`}
              onClick={() => selectCategory('')}
              aria-pressed={category === ''}
            >
              {t('blog.allPosts')}
            </button>
            {BLOG_CATEGORIES.map((c) => (
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
          </div>
        </div>
      </section>

      <section id="blog">
        <div className="tl-section">
          {pagePosts.length === 0 ? (
            <p className="tl-blog-empty">{t('blog.emptyCategory')}</p>
          ) : (
            <div className="tl-blog-grid">
              {pagePosts.map((post) => (
                <Link to={`/blog/${post.slug}`} key={post.slug} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <div className="tl-blog-card">
                    <div
                      className="tl-blog-img"
                      role="img"
                      aria-label={post.title}
                      style={{
                        backgroundImage: `url('${post.coverImage}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        fontSize: 0,
                      }}
                    />
                    <div className="tl-blog-body">
                      <span className={`tl-blog-cat ${post.categoryClass}`}>{post.category}</span>
                      <div className="tl-blog-date">{formatDateAz(post.date)}</div>
                      <h3 className="tl-blog-title">{post.title}</h3>
                      <div className="tl-blog-exc">{post.excerpt}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="tl-pagination" aria-label="Blog pages">
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
    </main>
  );
}
