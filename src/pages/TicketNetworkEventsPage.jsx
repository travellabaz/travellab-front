import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api/client';
import SeaticsSeatMap from '../components/SeaticsSeatMap';
import { useLocalizedNavigate } from '../components/LocalizedLink';

// Internal test page for the TicketNetwork integration (Catalog search ->
// Mercury ticket groups -> mock-paid purchase -> Ticket Vault e-ticket) —
// not linked from Nav, and gated to one phone number while the payment
// gateway is still a mock. This is a soft/UI-only gate: the backend
// endpoints themselves don't enforce auth yet (see TicketNetworkOrderController),
// so it only hides the page from casual browsing, not a real access
// control boundary.
const ALLOWED_PHONE = '994555060402';

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

function formatEventDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function TicketNetworkEventsPage() {
  const { profile, isAuthenticated, loading: authLoading } = useAuth();
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

  // The event stays in the URL (/tickets/:eventId) so it's a real,
  // shareable/bookmarkable page on travellab.az — not just React state.
  const openEvent = (event) => navigate(`/tickets/${event.id}`);

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

  if (authLoading) return null;
  if (!isAuthenticated || normalizePhone(profile?.phone) !== ALLOWED_PHONE) {
    return <Navigate to="/" replace />;
  }

  const inputStyle = {
    width: '100%',
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--tl-gray-200)',
    padding: '0 16px',
    fontFamily: "'Geist Sans', sans-serif",
    fontSize: 14,
    color: 'var(--tl-navy)',
    outline: 'none',
    marginBottom: 12,
  };

  return (
    <main className="tpwl-main">
      <section className="tl-page-top">
        <div className="tl-section">
          <div className="tl-tag">Daxili test</div>
          <h1 className="tl-title">Tədbir biletləri — TEST</h1>
          <p style={{ color: 'var(--tl-gray-500)', fontSize: 13, marginBottom: 20 }}>
            Ödəniş MOCK rejimindədir — real pul köçürülmür. Yalnız sizin üçün açıqdır.
          </p>

          <form style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }} onSubmit={searchEvents}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search events (e.g. Hamilton, Yankees, Madrid)"
              style={{ ...inputStyle, flex: 1, minWidth: 220, marginBottom: 0 }}
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
            <div className="tl-pkg-grid" style={{ marginBottom: 32 }}>
              {events.map((ev) => (
                <div
                  className="tl-pkg-card"
                  key={ev.id}
                  onClick={() => openEvent(ev)}
                  style={{ cursor: 'pointer', border: selectedEvent?.id === ev.id ? '2px solid var(--tl-green)' : undefined }}
                >
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

          {selectedEvent && (
            <div style={{ borderTop: '1px solid var(--tl-gray-200)', paddingTop: 24 }}>
              <h2 className="tl-title" style={{ fontSize: 20, marginBottom: 12 }}>{selectedEvent.name}</h2>

              <SeaticsSeatMap eventId={selectedEvent.id} />

              {loadingGroups && <p style={{ color: 'var(--tl-gray-400)', fontSize: 13 }}>Biletlər yüklənir...</p>}
              {!loadingGroups && ticketGroups.length === 0 && (
                <p style={{ color: 'var(--tl-gray-400)', fontSize: 13 }}>Bu tədbir üçün Mercury-də real bilet tapılmadı.</p>
              )}

              {ticketGroups.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {ticketGroups.map((tg) => (
                    <button
                      key={tg.ticketGroupId}
                      type="button"
                      onClick={() => selectGroup(tg)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        border: selectedGroup?.ticketGroupId === tg.ticketGroupId ? '1.5px solid var(--tl-green)' : '1.5px solid var(--tl-gray-200)',
                        borderRadius: 12,
                        background: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span>
                        <strong>{tg.section || 'Section n/a'}</strong>
                        {tg.row ? `, Row ${tg.row}` : ''}
                        <span style={{ color: 'var(--tl-gray-500)', display: 'block', fontSize: 12 }}>
                          {tg.availableQuantity} available · {(tg.deliveryMethods || []).join(', ')}
                        </span>
                      </span>
                      <strong>{tg.retailPrice} {tg.currencyCode}</strong>
                    </button>
                  ))}
                </div>
              )}

              {selectedGroup && (
                <form onSubmit={submitPurchase} style={{ maxWidth: 420 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Checkout (mock payment)</h3>

                  {(selectedGroup.purchasableQuantities || []).length > 1 && (
                    <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={inputStyle}>
                      {selectedGroup.purchasableQuantities.map((q) => (
                        <option key={q} value={q}>{q} ticket{q > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  )}

                  {(selectedGroup.deliveryMethods || []).length > 1 && (
                    <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} style={inputStyle}>
                      {selectedGroup.deliveryMethods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}

                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ad Soyad" required style={inputStyle} />
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email" required style={inputStyle} />
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Telefon" required style={inputStyle} />

                  <div style={{ fontWeight: 700, marginBottom: 12 }}>
                    Cəmi: {(selectedGroup.retailPrice * quantity).toFixed(2)} {selectedGroup.currencyCode}
                  </div>

                  <button type="submit" className="tl-btn-book" disabled={purchasing} style={{ background: 'var(--tl-green)', color: '#fff', border: 'none', cursor: 'pointer', padding: '13px 26px' }}>
                    {purchasing ? 'İşlənir...' : 'Al (mock ödəniş)'}
                  </button>
                </form>
              )}

              {result && (
                <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: result.success ? '#ecfdf5' : '#fef2f2', border: `1px solid ${result.success ? '#a7f3d0' : '#fecaca'}` }}>
                  {result.success ? (
                    <>
                      <strong style={{ color: '#065f46' }}>Sifariş uğurlu! Mercury Transaction ID: {result.mercuryTransactionId}</strong>
                      {result.eticketPdfBase64 && (
                        <p style={{ fontSize: 13, marginTop: 8 }}>E-ticket PDF alındı ({Math.round(result.eticketPdfBase64.length / 1024)} KB, base64).</p>
                      )}
                      {result.mobileTransferUrls?.length > 0 && (
                        // No raw link out to TicketNetwork/the transfer
                        // domain — everything stays on travellab.az. This
                        // just confirms the transfer is ready; getting it
                        // to the customer without exposing that URL
                        // directly (proxy it, embed it, email it, etc.) is
                        // still open — see the note below.
                        <p style={{ fontSize: 13, marginTop: 8 }}>Mobil transfer bileti hazırdır.</p>
                      )}
                    </>
                  ) : (
                    <strong style={{ color: '#991b1b' }}>Xəta: {result.failureReason}</strong>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
