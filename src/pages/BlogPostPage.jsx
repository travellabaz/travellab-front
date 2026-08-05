import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BLOG_POSTS, getPostBySlug } from '../data/blog';
import { BLOG_CATEGORIES } from '../data/blog/categories';
import { formatDateAz } from '../utils/date';
import Breadcrumb from '../components/Breadcrumb';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  // Picking a category in the sidebar filters "Əlaqəli Bloqlar" in place —
  // it doesn't navigate away. Resets to the current post's own category
  // whenever the post changes (e.g. clicking a related-post link doesn't
  // remount this component, just changes the slug param).
  const [relatedCategory, setRelatedCategory] = useState(post?.category);
  useEffect(() => {
    setRelatedCategory(post?.category);
  }, [slug]);

  if (!post) {
    return (
      <main className="tpwl-main">
        <div className="tl-section" style={{ textAlign: 'center', padding: '80px 32px' }}>
          <h1 className="tl-title">Yazı tapılmadı</h1>
          <Link to="/blog" className="tl-viewall">← Bütün bloqlara qayıt</Link>
        </div>
      </main>
    );
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category === relatedCategory).slice(0, 3);

  return (
    <main className="tpwl-main">
      <div className="tl-article-layout tl-page-top">
        <article className="tl-article">
          <div className="tl-article-head">
            <Breadcrumb
              items={[
                { name: 'Ana səhifə', to: '/' },
                { name: 'Bloq', to: '/blog' },
                { name: post.title },
              ]}
            />
            <span className={`tl-blog-cat ${post.categoryClass}`}>{post.category}</span>
            <div className="tl-blog-date">{formatDateAz(post.date)} · {post.author || 'Travellab Komandası'}</div>
            <h1 className="tl-article-title">{post.title}</h1>
            <p className="tl-article-lead">{post.excerpt}</p>
          </div>
          <div
            className="tl-article-cover"
            role="img"
            aria-label={post.title}
            style={{ backgroundImage: `url('${post.coverImage}')` }}
          />
          {post.coverCredit && (
            <div className="tl-article-photo-credit">
              Foto: <a href={post.coverCredit.url} target="_blank" rel="noopener noreferrer">{post.coverCredit.name}</a> / Pexels
            </div>
          )}
          <div className="tl-article-body">
            {post.body.map((block, i) => {
              if (block.type === 'h2') return <h2 key={i}>{block.text}</h2>;
              if (block.type === 'img') {
                return (
                  <figure className="tl-article-inline-img" key={i}>
                    <img src={block.src} alt={block.alt} loading="lazy" />
                    {block.credit && (
                      <figcaption>
                        Foto: <a href={block.creditUrl} target="_blank" rel="noopener noreferrer">{block.credit}</a> / Pexels
                      </figcaption>
                    )}
                  </figure>
                );
              }
              return <p key={i}>{block.text}</p>;
            })}
          </div>
        </article>

        <aside className="tl-article-sidebar">
          <div className="tl-sidebar-block">
            <label className="tl-sidebar-label" htmlFor="blog-category-select">Kateqoriya</label>
            <select
              id="blog-category-select"
              className="tl-sidebar-select"
              value={relatedCategory}
              onChange={(e) => setRelatedCategory(e.target.value)}
            >
              {BLOG_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="tl-sidebar-block">
            <h3 className="tl-sidebar-title">Əlaqəli Bloqlar</h3>
            <p className="tl-sidebar-subtitle">Bu mövzu ilə bağlı digər yazılar.</p>
            {relatedPosts.length === 0 ? (
              <p className="tl-blog-empty" style={{ padding: 0 }}>Bu kateqoriyada başqa yazı yoxdur.</p>
            ) : (
              <div className="tl-related-list">
                {relatedPosts.map((related) => (
                  <Link to={`/blog/${related.slug}`} key={related.slug} className="tl-related-card">
                    <div
                      className="tl-related-img"
                      role="img"
                      aria-label={related.title}
                      style={{ backgroundImage: `url('${related.coverImage}')` }}
                    />
                    <div className="tl-related-body">
                      <span className={`tl-blog-cat ${related.categoryClass}`}>{related.category}</span>
                      <div className="tl-blog-date">{formatDateAz(related.date)}</div>
                      <h4 className="tl-related-title">{related.title}</h4>
                      <p className="tl-related-exc">{related.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
