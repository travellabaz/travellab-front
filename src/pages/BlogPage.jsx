import { Link, useSearchParams } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blog';
import { BLOG_CATEGORIES } from '../data/blog/categories';
import { formatDateAz } from '../utils/date';

const POSTS_PER_PAGE = 8;

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const isKnownCategory = BLOG_CATEGORIES.some((c) => c.name === category);
  const filteredPosts = isKnownCategory ? BLOG_POSTS.filter((p) => p.category === category) : BLOG_POSTS;

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
      <section id="blog" className="tl-page-top">
        <div className="tl-section">
          <div className="tl-section-header">
            <div>
              <div className="tl-tag">Bloq</div>
              <h2 className="tl-title">Səyahət Məsləhətləri</h2>
            </div>
          </div>

          <div className="tl-blog-filter" role="tablist" aria-label="Bloq kateqoriyaları">
            <button
              type="button"
              className={`tl-blog-filter-pill${category === '' ? ' active' : ''}`}
              onClick={() => selectCategory('')}
              aria-pressed={category === ''}
            >
              Bütün Bloqlar
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

          {pagePosts.length === 0 ? (
            <p className="tl-blog-empty">Bu kateqoriyada hələ yazı yoxdur.</p>
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
            <nav className="tl-pagination" aria-label="Bloq səhifələri">
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
    </main>
  );
}
