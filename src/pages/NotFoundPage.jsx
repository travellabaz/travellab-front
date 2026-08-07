import { Link } from 'react-router-dom';

// Wired to App.jsx's catch-all route ("*") — previously any unknown URL
// silently rendered HomePage, so a broken/mistyped link looked like a real
// page instead of a real 404. Note: since this is a client-rendered SPA
// route, the prerendered static fallback for an arbitrary unknown path
// still responds with an HTTP 200 (there's no server-side routing to
// return a real 404 status from) — this fixes what the visitor/crawler
// *sees*, not the HTTP status code.
export default function NotFoundPage() {
  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div className="tl-tag">404</div>
          <h1 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 10 }}>
            Bu səhifə tapılmadı
          </h1>
          <p style={{ fontSize: 14, color: 'var(--tl-gray-600)', marginBottom: 24 }}>
            Axtardığınız səhifə silinmiş və ya köçürülmüş ola bilər. Ana səhifəyə qayıdın və ya axtardığınızı
            başqa yerdən tapın.
          </p>
          <Link to="/" className="tl-btn-book" style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--tl-green)', color: '#fff', padding: '13px 26px' }}>
            Ana səhifəyə qayıt
          </Link>
        </div>
      </section>
    </main>
  );
}
