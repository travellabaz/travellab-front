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
    </main>
  );
}
