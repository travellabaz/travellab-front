import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blog';
import { formatDateAz } from '../utils/date';

export default function BlogPage() {
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
          <div className="tl-blog-grid">
            {BLOG_POSTS.map((post) => (
              <Link to={`/blog/${post.slug}`} key={post.slug} style={{ textDecoration: 'none' }}>
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
        </div>
      </section>
    </main>
  );
}
