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
        <div className="tl-partners">
          <div className="tl-partner">
            <div className="tl-partner-icon" style={{ color: '#8C8C8C' }}>
              <span style={{ width: 4, height: 20, background: '#C8102E', borderRadius: 2, display: 'inline-block' }} />
              Hotels.com
            </div>
          </div>
          <div className="tl-partner">
            <div style={{ color: '#5A5A5A' }}>agoda</div>
            <div className="tl-partner-dots">
              <span style={{ background: '#EA2829' }} />
              <span style={{ background: '#F5A623' }} />
              <span style={{ background: '#0C8A46' }} />
              <span style={{ background: '#8E44AD' }} />
              <span style={{ background: '#0C75BA' }} />
            </div>
          </div>
          <div className="tl-partner" style={{ color: '#1550A4', letterSpacing: 1 }}>AMADEUS</div>
          <div className="tl-partner">
            <div className="tl-partner-icon" style={{ color: '#FF385C' }}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="#FF385C"><path d="M16 2C12 9 6 16.5 6 22a10 10 0 0020 0c0-5.5-6-13-10-20z" /></svg>
              airbnb
            </div>
          </div>
          <div className="tl-partner">
            <div className="tl-partner-icon" style={{ color: 'var(--tl-navy)' }}>
              make<span style={{ background: '#EB2F96', color: '#fff', borderRadius: 5, padding: '1px 7px', fontStyle: 'italic' }}>my</span>trip
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
