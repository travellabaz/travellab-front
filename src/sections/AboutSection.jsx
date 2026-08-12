import { useTranslation } from 'react-i18next';
import LogoMark from '../components/LogoMark';
import SeoBodyText from '../components/SeoBodyText';

const PHOTO_SEEDS = [
  { seed: 'tl-ab1', rotate: -7 },
  { seed: 'tl-ab2', rotate: 4 },
  { seed: 'tl-ab3', rotate: -3 },
  { seed: 'tl-ab4', rotate: 6 },
  { seed: 'tl-ab5', rotate: -5 },
  { seed: 'tl-ab6', rotate: 3 },
  { seed: 'tl-ab7', rotate: -4 },
];

const SERVICE_ICONS = ['✈', '🛂', '🚐', '🏨', '🚢', '🛡️'];
const SERVICE_KEYS = ['Flights', 'Viza', 'Transfer', 'Hotels', 'Cruise', 'Insurance'];
const STAT_KEYS = [
  { n: '4+', key: 'statYears' },
  { n: '10K+', key: 'statCustomers' },
  { n: '100+', key: 'statDestinations' },
  { n: '10+', key: 'statTeam' },
];

// The extra stats/services/address block only appears on the standalone
// Haqqımızda page (see body.tl-subpage .tl-about-extra rule); on the
// homepage this section only shows the intro card.
export default function AboutSection() {
  const { t } = useTranslation();

  return (
    <section id="about" className="tl-section-full tl-about-bg tl-page-top">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 32px' }}>
        <div className="tl-tag">{t('about.tag')}</div>
        <h1 className="tl-title" style={{ marginBottom: 24 }}>{t('about.title')}</h1>

        <div className="tl-about-card">
          <LogoMark className="tl-about-logo-mark" />
          <div>
            <div className="tl-lp-logo" style={{ fontSize: 28, marginBottom: 10 }}>Travellab</div>
            <p className="tl-about-text" style={{ marginBottom: 0 }}>{t('about.intro')}</p>
            <div className="tl-about-photos">
              {PHOTO_SEEDS.map((p) => (
                <img
                  key={p.seed}
                  className="tl-about-photo"
                  style={{ transform: `rotate(${p.rotate}deg)` }}
                  src={`https://picsum.photos/seed/${p.seed}/160/210`}
                  alt="Travellab"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="tl-about-extra">
          <div className="tl-about-stats">
            {STAT_KEYS.map((s) => (
              <div className="tl-about-stat" key={s.key}>
                <div className="tl-about-stat-n">{s.n}</div>
                <div className="tl-about-stat-l">{t(`about.${s.key}`)}</div>
              </div>
            ))}
          </div>
          <div className="tl-about-services">
            <div className="tl-about-service-title">{t('about.servicesTitle')}</div>
            <div className="tl-about-service-grid">
              {SERVICE_KEYS.map((key, i) => (
                <div className="tl-about-service-item" key={key}>
                  <span>{SERVICE_ICONS[i]}</span>
                  <div>
                    <strong>{t(`about.service${key}`)}</strong>
                    <p>{t(`about.service${key}Desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <a
            className="tl-about-address"
            href="https://www.google.com/maps/search/?api=1&query=Travellab+S%C9%99yah%C9%99t+Agentliyi%2C+40+C%C9%99f%C9%99r+Cabbarl%C4%B1+k%C3%BC%C3%A7%C9%99si%2C+Bak%C4%B1"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>📍</span> {t('about.address')}
          </a>
          <div className="tl-about-map">
            <iframe
              title="Travellab — Google Maps"
              src="https://www.google.com/maps?q=Travellab+S%C9%99yah%C9%99t+Agentliyi,+40+C%C9%99f%C9%99r+Cabbarl%C4%B1+k%C3%BC%C3%A7%C9%99si,+Bak%C4%B1&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        <SeoBodyText>
          <p>{t('about.seoP1')}</p>
          <p>{t('about.seoP2')}</p>
          <p>{t('about.seoP3')}</p>
        </SeoBodyText>
      </div>
    </section>
  );
}
