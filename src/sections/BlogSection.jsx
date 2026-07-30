import Reveal from '../components/Reveal';

const POSTS = [
  { seed: 'tl-blog-visa', alt: 'Şengen vizası üçün ipuçları', cat: 'Məsləhətlər', catClass: 'cat-a', date: '15 Sentyabr 2024', title: 'Şengen vizası üçün ipuçları', excerpt: 'Vizanızı asanlıqla almaq üçün bilməli olduğunuz hər şey.' },
  { seed: 'tl-blog-ux', alt: 'İstifadəçi təcrübəsi üçün ən yaxşı praktikalar', cat: 'Texniki', catClass: 'cat-t', date: '20 Noyabr 2024', title: 'İstifadəçi təcrübəsi üçün ən yaxşı praktikalar', excerpt: 'UX dizaynında müasir yanaşmalar.' },
  { seed: 'tl-blog-health', alt: 'Məşğul insanlar üçün sağlam qidalanma', cat: 'Xəbərlər', catClass: 'cat-n', date: '08 Fevral 2025', title: 'Məşğul insanlar üçün sağlam qidalanma', excerpt: 'Səyahət zamanı sağlam qalmağın sirləri.' },
  { seed: 'tl-blog-family', alt: 'Hər yaş üçün əyləncəli variantlar', cat: 'Macəralar', catClass: 'cat-m', date: '14 İyul 2025', title: 'Hər yaş üçün əyləncəli variantlar', excerpt: 'Ailə ilə səyahət planlaşdırmaq üçün bələdçi.' },
];

export default function BlogSection() {
  return (
    <section id="blog" className="tl-page-top">
      <div className="tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">Əlaqəli Bloglar</div>
            <h2 className="tl-title">Səyahət Məsləhətləri</h2>
          </div>
          <a href="#" className="tl-viewall">Bütün bloglar →</a>
        </div>
        <div className="tl-blog-grid">
          {POSTS.map((post) => (
            <Reveal className="tl-blog-card" key={post.seed}>
              <div
                className="tl-blog-img"
                role="img"
                aria-label={post.alt}
                style={{
                  backgroundImage: `url('https://picsum.photos/seed/${post.seed}/400/300')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  fontSize: 0,
                }}
              />
              <div className="tl-blog-body">
                <span className={`tl-blog-cat ${post.catClass}`}>{post.cat}</span>
                <div className="tl-blog-date">{post.date}</div>
                <h3 className="tl-blog-title">{post.title}</h3>
                <div className="tl-blog-exc">{post.excerpt}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
