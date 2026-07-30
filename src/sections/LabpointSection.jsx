const TIERS = [
  { icon: '⭐', name: 'Standard', pts: '0–4,999' },
  { icon: '🥈', name: 'Silver', pts: '5,000+' },
  { icon: '🥇', name: 'Gold', pts: '20,000+' },
  { icon: '💎', name: 'VIP', pts: '50,000+' },
];

export default function LabpointSection() {
  return (
    <section id="labpoint" className="tl-page-top">
      <div className="tl-section">
        <div className="tl-section-header" style={{ marginBottom: 28 }}>
          <div>
            <div className="tl-tag">Loyallıq Proqramı</div>
            <h2 className="tl-title">Labpoint ilə Qazanın</h2>
          </div>
        </div>
        <div className="tl-lp-card">
          <div>
            <div className="tl-lp-logo">Labpoint</div>
            <p className="tl-lp-desc">
              Hər sifarişdən bal qazanın. Ballarınızla növbəti səyahətinizə endirim alın. Travellab ilə hər
              yol bir bonus gətirir.
            </p>
            <div className="tl-tier-row">
              {TIERS.map((tier) => (
                <div className="tl-tier" key={tier.name}>
                  <div className="tl-tier-icon">{tier.icon}</div>
                  <div className="tl-tier-name">{tier.name}</div>
                  <div className="tl-tier-pts">{tier.pts}</div>
                </div>
              ))}
            </div>
            <a
              href="https://travellab-point.az/"
              target="_blank"
              rel="noopener noreferrer"
              className="tl-outlink tl-outlink-green"
              style={{ marginTop: 20 }}
            >
              Labpoint saytına keç →
            </a>
          </div>
          <div className="tl-lp-visual">
            <div className="tl-lp-cardvis">
              <div className="tl-lp-cv-label">Labpoint Kartı</div>
              <div className="tl-lp-cv-name">Əsəd Məmmədov</div>
              <div className="tl-lp-cv-bal-l">Balans</div>
              <div className="tl-lp-cv-bal">12,450</div>
              <div className="tl-lp-cv-tier">🥇 Gold üzv</div>
            </div>
            <div className="tl-lp-stats">
              <div className="tl-lp-stat">
                <div className="tl-lp-stat-n">10x</div>
                <div className="tl-lp-stat-l">Hər $1 = 10 bal</div>
              </div>
              <div className="tl-lp-stat">
                <div className="tl-lp-stat-n">$124</div>
                <div className="tl-lp-stat-l">Bal dəyəri</div>
              </div>
              <div className="tl-lp-stat">
                <div className="tl-lp-stat-n">4</div>
                <div className="tl-lp-stat-l">Aktiv sifariş</div>
              </div>
              <div className="tl-lp-stat">
                <div className="tl-lp-stat-n">Gold</div>
                <div className="tl-lp-stat-l">Cari səviyyə</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
