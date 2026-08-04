export const HOTELS_URL = 'https://backend.travellab-point.az/site-backend/v1/go/hotels';

// NOTE: RateHawk's White Label site sends X-Frame-Options / CSP
// frame-ancestors headers that block being embedded in an iframe from
// another origin. That can't be worked around from this page, so we link
// out to the White Label site directly instead of iframing it.
export default function HotelsSection() {
  return (
    <section id="hotels" className="tl-page-top">
      <div className="tl-section">
        <div className="tl-section-header" style={{ marginBottom: 20 }}>
          <div>
            <div className="tl-tag">Otel Bron</div>
            <h2 className="tl-title">Dünya üzrə Otellər</h2>
          </div>
          <a href={HOTELS_URL} className="tl-viewall">Tam ekranda aç →</a>
        </div>

        <div className="tl-hotel-card">
          <div>
            <div className="tl-lp-logo" style={{ fontSize: 28 }}>Travellab Hotels</div>
            <p className="tl-hotel-desc">
              Qlobal otel bazası ilə inteqrasiya olunmuş axtarış sistemimizdə dünyanın 220-dən çox ölkəsində
              2,6 milyondan artıq oteli müqayisə edin və ən sərfəli qiymətlə bron edin. Otel axtarışı
              təhlükəsizlik səbəbindən yeni pəncərədə açılır.
            </p>
            <div className="tl-hotel-feat-row">
              <div className="tl-hotel-feat">🌍 2.6M+ otel</div>
              <div className="tl-hotel-feat">💳 Ani təsdiq</div>
              <div className="tl-hotel-feat">🔒 Təhlükəsiz ödəniş</div>
            </div>
            <a href={HOTELS_URL} className="tl-outlink tl-outlink-blue">Otelləri axtar →</a>
          </div>
          <div className="tl-hotel-visual">
            <div className="tl-hotel-visual-emoji">🏨</div>
            <div className="tl-hotel-visual-title">Travellab Hotels</div>
            <div className="tl-hotel-visual-sub">
              White Label platforması ilə işləyir — Travellab brendi altında, beynəlxalq inventar üzərində.
            </div>
            <div className="tl-hotel-stats">
              <div className="tl-hotel-stat">
                <div className="tl-hotel-stat-n">220+</div>
                <div className="tl-hotel-stat-l">Ölkə</div>
              </div>
              <div className="tl-hotel-stat">
                <div className="tl-hotel-stat-n">2.6M+</div>
                <div className="tl-hotel-stat-l">Otel</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
