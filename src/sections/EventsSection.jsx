import { useEffect, useState } from 'react';
import { truncate } from '../utils/text';

const API_BASE = 'https://backend.travellab-point.az/site-backend/v1';
const DEFAULT_EMPTY_TEXT = 'Hazırda göstəriləcək tədbir tapılmadı. Başqa şəhər və ya sənətçi ilə axtarın.';
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyun', 'İyul', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];

function formatEventDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const mi = parseInt(parts[1], 10) - 1;
  return parts[2] + ' ' + (MONTHS[mi] || parts[1]) + ' ' + parts[0];
}

// Backend proxies the events data provider server-side (keeps the
// provider's API key secret). "Bilet al" opens the provider's own site in
// a new tab to complete the purchase — browsing/search only, real in-site
// checkout needs a separate Partner API.
//
// asH1: true when this is the whole content of its own dedicated page
// (EventsPage.jsx) rather than a teaser embedded on HomePage.jsx — see the
// identical convention on HotelsSection.jsx.
export default function EventsSection({ asH1 = false }) {
  const Heading = asH1 ? 'h1' : 'h2';
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emptyText, setEmptyText] = useState(DEFAULT_EMPTY_TEXT);

  const fetchEvents = (keyword) => {
    setLoading(true);
    setEvents([]);
    let url = API_BASE + '/events';
    if (keyword) url += '?keyword=' + encodeURIComponent(keyword);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('events request failed: ' + res.status);
        return res.json();
      })
      .then((data) => {
        setEvents(data || []);
        setEmptyText(DEFAULT_EMPTY_TEXT);
        setLoading(false);
      })
      .catch((err) => {
        console.error('ActionLog.events.fetchFailed', err);
        setLoading(false);
        setEmptyText('Tədbirlər yüklənərkən xəta baş verdi. Bir az sonra yenidən cəhd edin.');
      });
  };

  useEffect(() => {
    fetchEvents('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empty = !loading && events.length === 0;

  return (
    <section id="events" className="tl-page-top">
      <div className="tl-section">
        <div className="tl-section-header">
          <div>
            <div className="tl-tag">Tədbirlər</div>
            <Heading className="tl-title">Tədbir Biletləri</Heading>
          </div>
        </div>

        <form
          style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}
          onSubmit={(e) => {
            e.preventDefault();
            fetchEvents(query.trim());
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Şəhər və ya sənətçi axtar (məs. İstanbul, Dubai)"
            style={{
              flex: 1,
              minWidth: 220,
              height: 44,
              borderRadius: 12,
              border: '1px solid var(--tl-gray-200)',
              padding: '0 16px',
              fontFamily: "'Geist Sans', sans-serif",
              fontSize: 14,
              color: 'var(--tl-navy)',
              outline: 'none',
            }}
          />
          <button type="submit" className="tl-fbtn active" style={{ border: 'none', cursor: 'pointer' }}>
            Axtar
          </button>
        </form>

        {loading && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>
            Tədbirlər yüklənir...
          </div>
        )}
        {empty && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--tl-gray-400)', fontSize: 13 }}>{emptyText}</div>
        )}

        {!loading && !empty && (
          <div className="tl-pkg-grid">
            {events.map((ev, idx) => {
              const name = truncate(ev.name, 60);
              const meta = truncate([formatEventDate(ev.date), ev.venue].filter(Boolean).join(' · '), 90);
              // No offers/price here — EventDto (site-backend) doesn't proxy
              // Ticketmaster's price data, and a fabricated price would be
              // actively wrong in a rich-result. Only real fields included.
              const eventLd = {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: ev.name,
                ...(ev.date ? { startDate: ev.date } : {}),
                ...(ev.venue ? { location: { '@type': 'Place', name: ev.venue } } : {}),
                ...(ev.imageUrl ? { image: ev.imageUrl } : {}),
                ...(ev.ticketUrl ? { url: ev.ticketUrl } : {}),
              };
              return (
                <div className="tl-pkg-card" key={idx}>
                  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
                  <div
                    className="tl-pkg-img"
                    role="img"
                    aria-label={name}
                    style={{
                      fontSize: 0,
                      ...(ev.imageUrl
                        ? { backgroundImage: `url('${ev.imageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : {}),
                    }}
                  />
                  <div className="tl-pkg-body">
                    <h3 className="tl-pkg-name">{name}</h3>
                    <div className="tl-pkg-meta" style={{ display: 'block', color: 'var(--tl-gray-600)', lineHeight: 1.5, marginBottom: 14 }}>
                      {meta}
                    </div>
                    <div className="tl-pkg-actions">
                      <a
                        href={ev.ticketUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tl-btn-book"
                        style={{
                          border: 'none',
                          cursor: 'pointer',
                          background: 'var(--tl-gray-100)',
                          color: 'var(--tl-navy)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        Bilet al →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
