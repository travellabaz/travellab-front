import PartnersLogos from './PartnersLogos';

export default function PartnersSection() {
  return (
    <section>
      <div className="tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">Partnyorlar</div>
            <h2 className="tl-title">Etibarlı Tərəfdaşlarımız</h2>
          </div>
        </div>
        <div className="tl-partners-row">
          <PartnersLogos />
        </div>
      </div>
    </section>
  );
}
