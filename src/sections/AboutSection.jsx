import LogoMark from '../components/LogoMark';

const PHOTOS = [
  { seed: 'tl-ab1', rotate: -7, alt: 'Travellab müştərisinin səyahət anı — səhra' },
  { seed: 'tl-ab2', rotate: 4, alt: 'Travellab müştərisinin səyahət anı — qış meşəsi' },
  { seed: 'tl-ab3', rotate: -3, alt: 'Travellab müştərisinin səyahət anı — gün batımı' },
  { seed: 'tl-ab4', rotate: 6, alt: 'Travellab müştərisinin səyahət anı — portret' },
  { seed: 'tl-ab5', rotate: -5, alt: 'Travellab komandası ilə səyahət anı' },
  { seed: 'tl-ab6', rotate: 3, alt: 'Travellab müştərisinin səyahət anı' },
  { seed: 'tl-ab7', rotate: -4, alt: 'Travellab müştərisinin səyahət anı' },
];

const STATS = [
  { n: '4+', l: 'İl təcrübə' },
  { n: '10K+', l: 'Məmnun müştəri' },
  { n: '100+', l: 'Destinasiya' },
  { n: '10+', l: 'Komanda üzvü' },
];

const SERVICES = [
  { icon: '✈', title: 'Uçuş biletləri', desc: 'Yerli və beynəlxalq reyslər üzrə sərfəli qiymətlərlə aviabiletlər' },
  { icon: '🛂', title: 'Viza dəstəyi', desc: 'Müxtəlif ölkələrə viza məsləhəti və sənədləşmə prosesində tam dəstək' },
  { icon: '🚐', title: 'Transfer xidmətləri', desc: 'Hava limanından otelə təhlükəsiz, komfortlu transfer həlləri' },
  { icon: '🏨', title: 'Otel rezervasiyası', desc: 'Dünyanın müxtəlif ölkələrində fərqli kateqoriyalarda otellərin bronlaşdırılması' },
  { icon: '🚢', title: 'Kruiz & Tur paketləri', desc: 'Büdcəyə uyğun xüsusi hazırlanmış kruiz və qrup turları' },
  { icon: '🛡️', title: 'Səyahət sığortası', desc: 'Gözlənilməz hallara qarşı təminat verən sığorta xidmətləri' },
];

// The extra stats/services/address block only appears on the standalone
// Haqqımızda page (see body.tl-subpage .tl-about-extra rule); on the
// homepage this section only shows the intro card.
export default function AboutSection() {
  return (
    <section id="about" className="tl-section-full tl-about-bg tl-page-top">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 32px' }}>
        <div className="tl-tag">Biz kimik?</div>
        <h2 className="tl-title" style={{ marginBottom: 24 }}>Travellab – Səyahətinizi biz yaradaq!</h2>

        <div className="tl-about-card">
          <LogoMark className="tl-about-logo-mark" />
          <div>
            <div className="tl-lp-logo" style={{ fontSize: 28, marginBottom: 10 }}>Travellab</div>
            <p className="tl-about-text" style={{ marginBottom: 0 }}>
              Travellab – Azərbaycanın aparıcı turizm şirkətlərindən biri olaraq, həm xarici, həm də daxili
              turizm sahəsində geniş spektrli və keyfiyyətli xidmətlər təklif edir. Gənc, enerjili və
              təcrübəli komandamızla fərdi ehtiyaclara uyğun səyahət planlaması apararaq hər bir müştəriyə
              özəl və yadda qalan təcrübə təqdim edirik.
            </p>
            <div className="tl-about-photos">
              {PHOTOS.map((p) => (
                <img
                  key={p.seed}
                  className="tl-about-photo"
                  style={{ transform: `rotate(${p.rotate}deg)` }}
                  src={`https://picsum.photos/seed/${p.seed}/160/210`}
                  alt={p.alt}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="tl-about-extra">
          <div className="tl-about-stats">
            {STATS.map((s) => (
              <div className="tl-about-stat" key={s.l}>
                <div className="tl-about-stat-n">{s.n}</div>
                <div className="tl-about-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="tl-about-services">
            <div className="tl-about-service-title">Xidmətlərimiz</div>
            <div className="tl-about-service-grid">
              {SERVICES.map((s) => (
                <div className="tl-about-service-item" key={s.title}>
                  <span>{s.icon}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="tl-about-address">
            <span>📍</span> 40 Cəfər Cabbarlı küçəsi, Caspian Business Center, Bakı
          </div>
        </div>
      </div>
    </section>
  );
}
