import { Link } from 'react-router-dom';

export default function CtaSection() {
  return (
    <div className="tl-cta-wrap">
      <div className="tl-cta">
        <div className="tl-cta-text">
          <h2>Növbəti səyahətinizi indi planlaşdırın</h2>
          <p>Bilet, otel və tur — hamısı bir yerdə, bir səyahət agentliyində. Labpoint ilə hər sifarişdən bonus qazanın.</p>
          <div className="tl-cta-tags">
            <span className="tl-cta-tag">✈ Uçuş biletləri</span>
            <span className="tl-cta-tag">🏨 Otellər</span>
            <span className="tl-cta-tag">🧳 Hazır turlar</span>
          </div>
        </div>
        <Link to="/tours" className="tl-cta-btn">Turları kəşf et →</Link>
      </div>
    </div>
  );
}
