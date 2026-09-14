import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api/client';
import SeaticsSeatMap from '../components/SeaticsSeatMap';
import { useLocalizedNavigate } from '../components/LocalizedLink';

// The TicketNetwork integration (Catalog search -> Mercury ticket groups
// -> mock-paid purchase -> Ticket Vault e-ticket), rendered inside the
// public /events route — see EventsPage.jsx, which decides whether to
// show this or the existing Ticketmaster-based EventsSection, gated to
// one phone number while the payment gateway is still a mock. Purely a
// content component now (no <main> wrapper, no gate/redirect of its own —
// EventsPage.jsx owns both), since it shares the /events URL with the
// original page rather than living at its own route.
//
// Event-detail layout follows Expedia's event-tickets pattern (seat map +
// ticket list on the left, a sticky order-summary/checkout card on the
// right) dressed in Travellab's own design tokens — see the "Event ticket
// detail" block in global.css.
function formatEventDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10H21M8 3V6M16 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function TicketNetworkEventsPage() {
  const { profile } = useAuth();
  const { eventId } = useParams();
  const navigate = useLocalizedNavigate();

  const [keyword, setKeyword] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [searched, setSearched] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketGroups, setTicketGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');

  const [purchasing, setPurchasing] = useState(false);
  const [result, setResult] = useState(null);

  const searchEvents = async (e) => {
    e.preventDefault();
    setLoadingEvents(true);
    setSearched(true);
    try {
      const url = API_BASE + '/tickets/events' + (keyword.trim() ? '?keyword=' + encodeURIComponent(keyword.trim()) : '');
      const res = await fetch(url);
      const data = res.ok ? await res.json() : [];
      setEvents(data || []);
    } catch (err) {
      console.error('ActionLog.ticketNetworkEvents.searchFailed', err);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // The event stays in the URL (/events/:eventId) so it's a real,
  // shareable/bookmarkable page on travellab.az — not just React state.
  const openEvent = (event) => navigate(`/events/${event.id}`);
  const backToResults = () => navigate('/events');

  // Loads whichever event is currently in the URL — reached either by
  // clicking a search result (openEvent navigates here) or by a direct
  // link/refresh, in which case there's no `events` list yet to look the
  // name up in, so the single-event endpoint is fetched directly.
  useEffect(() => {
    if (!eventId) {
      setSelectedEvent(null);
      return;
    }

    let cancelled = false;
    setSelectedGroup(null);
    setQuantity(1);
    setResult(null);
    setLoadingGroups(true);
    setCustomerName(profile ? `${profile.name} ${profile.surname}`.trim() : '');
    setCustomerEmail(profile?.mail || '');
    setCustomerPhone(profile?.phone || '');

    const fromList = events.find((ev) => String(ev.id) === eventId);
    if (fromList) setSelectedEvent(fromList);

    Promise.all([
      fromList ? Promise.resolve(fromList) : fetch(API_BASE + `/tickets/events/${eventId}`).then((res) => (res.ok ? res.json() : null)),
      fetch(API_BASE + `/tickets/events/${eventId}/ticketgroups`).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([event, groups]) => {
        if (cancelled) return;
        if (event) setSelectedEvent(event);
        setTicketGroups(groups || []);
      })
      .catch((err) => {
        console.error('ActionLog.ticketNetworkEvents.openEventFailed', err);
        if (!cancelled) setTicketGroups([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingGroups(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const selectGroup = (group) => {
    setSelectedGroup(group);
    setQuantity(group.purchasableQuantities?.[0] || 1);
    setDeliveryMethod(group.deliveryMethods?.[0] || '');
    setResult(null);
  };

  const submitPurchase = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !selectedGroup) return;
    setPurchasing(true);
    setResult(null);
    try {
      const res = await fetch(API_BASE + '/tickets/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          ticketGroupId: selectedGroup.ticketGroupId,
          quantity,
          deliveryMethod,
          customerName,
          customerEmail,
          customerPhone,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('ActionLog.ticketNetworkEvents.purchaseFailed', err);
      setResult({ success: false, failureReason: 'Network error' });
    } finally {
      setPurchasing(false);
    }
  };

  return (
      <section className="tl-page-top">
        <div className="tl-section">
          {!selectedEvent && (
            <>
              <div className="tl-tag">Daxili test</div>
              <h1 className="tl-title">Tədbir biletləri — TEST</h1>
              <p style={{ color: 'var(--tl-gray-500)', fontSize: 13, marginTop: 8, marginBottom: 20 }}>
                Ödəniş MOCK rejimindədir — real pul köçürülmür. Yalnız sizin üçün açıqdır.
              </p>

              <form style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }} onSubmit={searchEvents}>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search events (e.g. Hamilton, Yankees, Madrid)"
                  className="tl-evt-input"
                  style={{ flex: 1, minWidth: 220, marginBottom: 0 }}
                />
                <button type="submit" className="tl-fbtn active" style={{ border: 'none', cursor: 'pointer' }}>
                  Axtar
                </button>
              </form>

              {loadingEvents && <p style={{ color: 'var(--tl-gray-400)', fontSize: 13 }}>Yüklənir...</p>}
              {!loadingEvents && searched && events.length === 0 && (
                <p style={{ color: 'var(--tl-gray-400)', fontSize: 13 }}>Nəticə tapılmadı.</p>
              )}

              {events.length > 0 && (
                <div className="tl-pkg-grid">
                  {events.map((ev) => (
                    <div className="tl-pkg-card" key={ev.id} onClick={() => openEvent(ev)} style={{ cursor: 'pointer' }}>
                      <div className="tl-pkg-body">
                        <h3 className="tl-pkg-name">{ev.name}</h3>
                        <div style={{ color: 'var(--tl-gray-600)', fontSize: 13, marginBottom: 8 }}>
                          {formatEventDate(ev.date)}
                          {ev.venue ? ` · ${ev.venue}` : ''}
                          {ev.city ? `, ${ev.city}` : ''}
                        </div>
                        {ev.lowPrice != null && (
                          <div style={{ fontWeight: 700, color: 'var(--tl-navy)' }}>
                            {ev.lowPrice} – {ev.highPrice} {ev.currencyCode}
                          </div>
                        )}
                        {!ev.mercuryEligible && (
                          <div style={{ color: '#b45309', fontSize: 12, marginTop: 6 }}>Mercury ilə satılmır</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedEvent && (
            <>
              <button type="button" className="tl-evt-back" onClick={backToResults}>
                <BackArrowIcon /> Axtarışa qayıt
              </button>

              <h1 className="tl-title">{selectedEvent.name}</h1>
              <div className="tl-evt-meta">
                {selectedEvent.date && (
                  <span className="tl-evt-meta-item"><CalendarIcon /> {formatEventDate(selectedEvent.date)}</span>
                )}
                {(selectedEvent.venue || selectedEvent.city) && (
                  <span className="tl-evt-meta-item">
                    <PinIcon /> {[selectedEvent.venue, selectedEvent.city].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>

              <div className="tl-evt-trust">
                <span className="tl-evt-trust-item"><ShieldIcon /> Rəsmi tərəfdaş</span>
                <span className="tl-evt-trust-item"><ShieldIcon /> Təhlükəsiz ödəniş</span>
                <span className="tl-evt-trust-item"><ShieldIcon /> Ani e-bilet</span>
              </div>

              <div className="tl-evt-layout">
                <div className="tl-evt-main">
                  <div className="tl-evt-map-card">
                    <SeaticsSeatMap eventId={selectedEvent.id} />
                  </div>

                  <h2 className="tl-evt-tickets-head">Mövcud biletlər</h2>
                  <p className="tl-evt-tickets-sub">Bir seçim edin, sağdakı bölmədə davam edin.</p>

                  {loadingGroups && <p style={{ color: 'var(--tl-gray-400)', fontSize: 13 }}>Biletlər yüklənir...</p>}
                  {!loadingGroups && ticketGroups.length === 0 && (
                    <p style={{ color: 'var(--tl-gray-400)', fontSize: 13 }}>Bu tədbir üçün real bilet tapılmadı.</p>
                  )}

                  {ticketGroups.length > 0 && (
                    <div className="tl-evt-tickets">
                      {ticketGroups.map((tg) => {
                        const isSelected = selectedGroup?.ticketGroupId === tg.ticketGroupId;
                        return (
                          <button
                            key={tg.ticketGroupId}
                            type="button"
                            onClick={() => selectGroup(tg)}
                            className={`tl-evt-ticket-row${isSelected ? ' tl-evt-ticket-row-selected' : ''}`}
                          >
                            <span>
                              <span className="tl-evt-ticket-section">{tg.section || 'Section n/a'}{tg.row ? `, Row ${tg.row}` : ''}</span>
                              <span className="tl-evt-ticket-sub">
                                {tg.availableQuantity} available · {(tg.deliveryMethods || []).join(', ')}
                              </span>
                            </span>
                            <span className="tl-evt-ticket-price">
                              <strong>{tg.retailPrice} {tg.currencyCode}</strong>
                              <span>bilet başına</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="tl-evt-sidebar-col">
                  <div className="tl-evt-sidebar">
                    {!selectedGroup && (
                      <div className="tl-evt-sidebar-empty">Davam etmək üçün soldakı siyahıdan bilet seçin.</div>
                    )}

                    {selectedGroup && (
                      <>
                        <h3 className="tl-evt-sidebar-title">Sifariş xülasəsi</h3>

                        <div className="tl-evt-sidebar-selection">
                          <span>
                            <strong>{selectedGroup.section || 'Section n/a'}{selectedGroup.row ? `, Row ${selectedGroup.row}` : ''}</strong>
                            <span className="tl-evt-ticket-sub">{deliveryMethod}</span>
                          </span>
                          <strong>{selectedGroup.retailPrice} {selectedGroup.currencyCode}</strong>
                        </div>

                        <form onSubmit={submitPurchase}>
                          {(selectedGroup.purchasableQuantities || []).length > 1 && (
                            <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="tl-evt-select">
                              {selectedGroup.purchasableQuantities.map((q) => (
                                <option key={q} value={q}>{q} ticket{q > 1 ? 's' : ''}</option>
                              ))}
                            </select>
                          )}

                          {(selectedGroup.deliveryMethods || []).length > 1 && (
                            <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} className="tl-evt-select">
                              {selectedGroup.deliveryMethods.map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          )}

                          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ad Soyad" required className="tl-evt-input" />
                          <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email" required className="tl-evt-input" />
                          <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Telefon" required className="tl-evt-input" />

                          <div className="tl-evt-sidebar-total">
                            <span className="tl-evt-sidebar-total-label">Cəmi ({quantity} bilet)</span>
                            <span className="tl-evt-sidebar-total-value">{(selectedGroup.retailPrice * quantity).toFixed(2)} {selectedGroup.currencyCode}</span>
                          </div>

                          <button type="submit" className="tl-btn-book tl-evt-sidebar-cta" disabled={purchasing}>
                            {purchasing ? 'İşlənir...' : 'Al (mock ödəniş)'}
                          </button>
                        </form>
                      </>
                    )}

                    {result && (
                      <div className={`tl-evt-result ${result.success ? 'tl-evt-result-ok' : 'tl-evt-result-fail'}`} style={{ marginTop: 16 }}>
                        {result.success ? (
                          <>
                            <strong>Sifariş uğurlu! Mercury Transaction ID: {result.mercuryTransactionId}</strong>
                            {result.eticketPdfBase64 && (
                              <p style={{ marginTop: 8 }}>E-ticket PDF alındı ({Math.round(result.eticketPdfBase64.length / 1024)} KB, base64).</p>
                            )}
                            {result.mobileTransferUrls?.length > 0 && (
                              // No raw link out to TicketNetwork/the transfer
                              // domain — everything stays on travellab.az. This
                              // just confirms the transfer is ready; getting it
                              // to the customer without exposing that URL
                              // directly (proxy it, embed it, email it, etc.) is
                              // still open — see the note below.
                              <p style={{ marginTop: 8 }}>Mobil transfer bileti hazırdır.</p>
                            )}
                          </>
                        ) : (
                          <strong>Xəta: {result.failureReason}</strong>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
  );
}
