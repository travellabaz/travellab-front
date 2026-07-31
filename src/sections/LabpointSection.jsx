const TIERS = [
  { icon: '⭐', name: 'Standard', pts: '0–4,999' },
  { icon: '🥈', name: 'Silver', pts: '5,000+' },
  { icon: '🥇', name: 'Gold', pts: '20,000+' },
  { icon: '💎', name: 'VIP', pts: '50,000+' },
];

const STATS = [
  {
    n: '10x',
    l: 'Hər $1 = 10 bal',
    icon: (
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    ),
  },
  {
    n: '$124',
    l: 'Bal dəyəri',
    icon: (
      <>
        <rect x="2" y="6" width="20" height="14" rx="2.5" />
        <path d="M2 10h20M15.5 15h3" />
      </>
    ),
  },
  {
    n: '4',
    l: 'Aktiv sifariş',
    icon: (
      <>
        <path d="M4 8l1.5-4h13L20 8" />
        <path d="M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
        <path d="M9 12a3 3 0 0 0 6 0" />
      </>
    ),
  },
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
            <div className="tl-lp-actions">
              <a
                href="https://travellab-point.az/"
                target="_blank"
                rel="noopener noreferrer"
                className="tl-lp-btn tl-lp-btn-primary"
              >
                Labpoint saytına keç →
              </a>
              <a href="#labpoint-tiers" className="tl-lp-btn tl-lp-btn-outline">
                Səviyyələr →
              </a>
            </div>
          </div>

          <div className="tl-lp-visual">
            <div className="tl-lp-glow tl-lp-glow-blue" />
            <div className="tl-lp-glow tl-lp-glow-green" />
            <div className="tl-lp-cardvis">
              <div className="tl-lp-cv-head">
                <div className="tl-lp-cv-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 15.6l-5.2 2.9 1-5.8-4.3-4.1 5.9-.8L12 2.5Z" />
                  </svg>
                </div>
                <span className="tl-lp-cv-tierchip">🥇 Gold üzv</span>
              </div>
              <div className="tl-lp-cv-name">Əsəd Məmmədov</div>
              <div className="tl-lp-cv-bal-l">Balans</div>
              <div className="tl-lp-cv-bal">
                12,450 <span>bal</span>
              </div>
            </div>
            <div className="tl-lp-stats">
              {STATS.map((s) => (
                <div className="tl-lp-stat" key={s.l}>
                  <div className="tl-lp-stat-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {s.icon}
                    </svg>
                  </div>
                  <div className="tl-lp-stat-n">{s.n}</div>
                  <div className="tl-lp-stat-l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tl-tier-row" id="labpoint-tiers" style={{ marginTop: 28 }}>
          {TIERS.map((tier) => (
            <div className="tl-tier" key={tier.name}>
              <div className="tl-tier-icon">{tier.icon}</div>
              <div className="tl-tier-name">{tier.name}</div>
              <div className="tl-tier-pts">{tier.pts}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
