import { Link, useParams } from 'react-router-dom';
import { getPostBySlug } from '../data/blog';
import { formatDateAz } from '../utils/date';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

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

  return (
    <main className="tpwl-main">
      <article className="tl-article tl-page-top">
        <div className="tl-article-head">
          <Link to="/blog" className="tl-viewall">← Bütün bloqlara qayıt</Link>
          <span className={`tl-blog-cat ${post.categoryClass}`}>{post.category}</span>
          <div className="tl-blog-date">{formatDateAz(post.date)}</div>
          <h1 className="tl-article-title">{post.title}</h1>
          <p className="tl-article-lead">{post.excerpt}</p>
        </div>
        <div
          className="tl-article-cover"
          role="img"
          aria-label={post.title}
          style={{ backgroundImage: `url('${post.coverImage}')` }}
        />
        <div className="tl-article-body">
          {post.body.map((block, i) =>
            block.type === 'h2' ? (
              <h2 key={i}>{block.text}</h2>
            ) : (
              <p key={i}>{block.text}</p>
            )
          )}
        </div>
      </article>
    </main>
  );
}
