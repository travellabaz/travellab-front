import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BLOG_POSTS, getPostBySlug } from '../data/blog';
import { BLOG_CATEGORIES } from '../data/blog/categories';
import { CATEGORY_SERVICE_LINKS } from '../data/blog/categoryServiceLinks';
import { formatDateAz } from '../utils/date';
import { slugify } from '../utils/slugify';
import Breadcrumb from '../components/Breadcrumb';

const TOC_MIN_WORDS = 800;
// [anchor text](/path) — only internal, relative paths render as real
// links; anything else (a hallucinated absolute/external URL, or just
// literal brackets in the text) falls back to plain text so a bad model
// output never becomes a stray link off the site.
const LINK_PATTERN = /\[([^\]]+)\]\((\/[^\s)]+)\)/g;

function renderParagraph(text) {
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  LINK_PATTERN.lastIndex = 0;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <Link key={`link-${key++}`} to={match[2]}>
        {match[1]}
      </Link>
    );
    lastIndex = LINK_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

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

  const wordCount = post.body
    .filter((b) => b.type === 'p')
    .reduce((sum, b) => sum + b.text.trim().split(/\s+/).length, 0);
  // Slug collisions (two identically-worded h2s in one post) are extremely
  // unlikely given these are long-form generated articles — not worth a
  // dedupe pass for a same-page anchor.
  const headings = post.body
    .map((b, i) => (b.type === 'h2' ? { id: slugify(b.text), text: b.text, index: i } : null))
    .filter(Boolean);
  const showToc = wordCount >= TOC_MIN_WORDS && headings.length > 1;

  const endCardPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2);
  const endServiceLink = CATEGORY_SERVICE_LINKS[post.category];

  // Plain <a href="#id"> doesn't reliably trigger the browser's native
  // scroll-to-anchor here (confirmed: the hash updates but scrollY stays
  // put) — driving it explicitly instead of depending on that.
  const jumpToHeading = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

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
          {showToc && (
            <nav className="tl-article-toc" aria-label="Məzmun">
              <div className="tl-article-toc-title">Məzmun</div>
              <ol>
                {headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} onClick={(e) => jumpToHeading(e, h.id)}>{h.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="tl-article-body">
            {post.body.map((block, i) => {
              if (block.type === 'h2') return <h2 key={i} id={slugify(block.text)}>{block.text}</h2>;
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
              return <p key={i}>{renderParagraph(block.text)}</p>;
            })}
          </div>

          {(endCardPosts.length > 0 || endServiceLink) && (
            <div className="tl-end-related">
              <h3 className="tl-end-related-title">Əlaqəli məzmun</h3>
              <div className="tl-end-related-grid">
                {endCardPosts.map((related) => (
                  <Link to={`/blog/${related.slug}`} key={related.slug} className="tl-related-card">
                    <div
                      className="tl-related-img"
                      role="img"
                      aria-label={related.title}
                      style={{ backgroundImage: `url('${related.coverImage}')` }}
                    />
                    <div className="tl-related-body">
                      <span className={`tl-blog-cat ${related.categoryClass}`}>{related.category}</span>
                      <h4 className="tl-related-title">{related.title}</h4>
                      <p className="tl-related-exc">{related.excerpt}</p>
                    </div>
                  </Link>
                ))}
                {endServiceLink && (
                  <Link to={endServiceLink.to} className="tl-end-service-card">
                    <span className="tl-end-service-label">Xidmət</span>
                    <span className="tl-end-service-cta">{endServiceLink.label} →</span>
                  </Link>
                )}
              </div>
            </div>
          )}
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
