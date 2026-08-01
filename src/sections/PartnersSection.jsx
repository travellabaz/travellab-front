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
          {/* Duplicated for a seamless CSS loop — the copy is decorative,
              the real one right before it is what screen readers get. */}
          <div className="tl-partners-track">
            <PartnersLogos />
            <PartnersLogos aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
