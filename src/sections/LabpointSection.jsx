import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TIERS = [
  { icon: '⭐', name: 'Standard', pts: '0–4,999' },
  { icon: '🥈', name: 'Silver', pts: '5,000+' },
  { icon: '🥇', name: 'Gold', pts: '20,000+' },
  { icon: '💎', name: 'VIP', pts: '50,000+' },
];

const DEMO_POINTS = '25 000';
const DEMO_AZN = '2500';

export default function LabpointSection() {
  const { isAuthenticated, profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const points = isAuthenticated ? Number(profile.points || 0).toLocaleString('en-US').replace(/,/g, ' ') : DEMO_POINTS;
  const azn = isAuthenticated ? profile.azn : DEMO_AZN;
  const shareUrl = (isAuthenticated && profile.referralLink) || 'https://travellab-point.az/';

  const share = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="labpoint" className="tl-page-top">
      <div className="tl-section">
        <div className="tl-lp-card">
          <div>
            <div className="tl-lp-logo">LabPoint by Travellab</div>
            <h2 className="tl-lp-headline">Səyahət edin və bonus qazanın!</h2>
            <p className="tl-lp-desc">
              Səfərləriniz zamanı pointlər qazanın və bonuslardan yararlanın. İndi LabPoint ilə daha çox
              səyahət edin!
            </p>
            <div className="tl-lp-actions">
              <a
                href="https://travellab-point.az/"
                target="_blank"
                rel="noopener noreferrer"
                className="tl-lp-btn tl-lp-btn-primary"
              >
                Kart yarat
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </a>
              <a href="#labpoint-tiers" className="tl-lp-btn tl-lp-btn-outline">
                Ətraflı Məlumat
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </div>

          <div className="tl-lp-visual">
            <div className="tl-lp-glow tl-lp-glow-blue" />
            <div className="tl-lp-glow tl-lp-glow-green" />
            <div className="tl-lp-cardvis">
              <div className="tl-lp-cv-head">
                <div className="tl-lp-cv-brand">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 2h6M10 2v6.2L5.4 17a2 2 0 0 0 1.8 3h9.6a2 2 0 0 0 1.8-3L14 8.2V2" />
                    <path d="M7.5 14h9" />
                  </svg>
                  LabPoint<sup>™</sup>
                </div>
                <button type="button" className="tl-lp-cv-share" onClick={share}>
                  {copied ? 'Kopyalandı' : 'Paylaş'}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M8 7h9v9" />
                  </svg>
                </button>
              </div>
              <div className="tl-lp-cv-bal-l">Balansınız:</div>
              <div className="tl-lp-cv-bal">
                {points} <span>LP</span>
              </div>
              <div className="tl-lp-cv-azn">
                ≈ {azn} ₼
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" title="1 LP ≈ 0.1 ₼ məzənnəsi ilə hesablanır">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
                </svg>
              </div>
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
