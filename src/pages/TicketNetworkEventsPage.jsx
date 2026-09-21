import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE, authFetch } from '../api/client';
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

// Whole-dollar display for marketing prices (card price range, ticket-row
// price) — matches Expedia's "From $89" style. Checkout totals use
// formatMoney below instead, which keeps cents.
function formatPrice(value, currency) {
  if (value == null) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency || ''}`.trim();
  }
}

function formatMoney(value, currency) {
  if (value == null) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ''}`.trim();
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

function EventCardSkeleton() {
  return (
    <div className="tl-pkg-card">
      <div className="tl-pkg-body">
        <div className="tl-evt-skel" style={{ height: 15, width: '80%', marginBottom: 10 }} />
        <div className="tl-evt-skel" style={{ height: 12, width: '60%', marginBottom: 14 }} />
        <div className="tl-evt-skel" style={{ height: 17, width: '40%' }} />
      </div>
    </div>
  );
}

function TicketRowSkeleton() {
  return (
    <div className="tl-evt-ticket-row" style={{ cursor: 'default' }}>
      <span style={{ flex: 1 }}>
        <div className="tl-evt-skel" style={{ height: 14, width: '50%', marginBottom: 8 }} />
        <div className="tl-evt-skel" style={{ height: 11, width: '35%' }} />
      </span>
      <div className="tl-evt-skel" style={{ height: 17, width: 60 }} />
    </div>
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

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketGroups, setTicketGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Asked upfront, the moment an event page opens — matches Expedia's
  // "how many tickets?" prompt before browsing the seat list. Narrows the
  // ticket list to groups that can actually fulfil that quantity (Mercury
  // groups only sell in specific bundle sizes, see purchasableQuantities)
  // instead of letting the visitor pick a group and find out afterward.
  const [showQuantityPopup, setShowQuantityPopup] = useState(false);
  const [desiredQuantity, setDesiredQuantity] = useState(null);

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
  //
  // A real full-page navigation (window.location), not React Router's
  // client-side navigate(): confirmed live, repeatedly, that Seatics'
  // framework script draws its seating-chart SVG hundreds of thousands
  // of pixels below the visible area specifically when the event page
  // is reached via a client-side route change — scrollTo(0,0) before
  // navigate() and delaying the map iframe's creation by increasing
  // amounts (two rAFs, then a flat 300ms) each measurably reduced the
  // bad offset without ever reaching zero, and it reproduced even in a
  // brand-new tab on the very first click, ruling out "leftover state
  // from a previous map load in this tab" too — whatever Seatics reads
  // to size itself, a client-side transition leaves it in a state a
  // full page load never does. A real navigation sidesteps the whole
  // question: every direct-URL/full-reload test this session, without
  // exception, rendered the map correctly.
  const openEvent = (event) => {
    window.location.href = `/events/${event.id}`;
  };
  const backToResults = () => navigate('/events');

  // Search-as-you-type, debounced — Catalog's dedicated /suggest endpoint
  // (lighter than a full /search), matches Expedia's autocomplete. Picking
  // a suggestion jumps straight to that event, skipping the search step.
  useEffect(() => {
    if (!keyword.trim() || keyword.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(API_BASE + '/tickets/events/suggest?keyword=' + encodeURIComponent(keyword.trim()))
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) setSuggestions(data || []);
        })
        .catch((err) => {
          console.error('ActionLog.ticketNetworkEvents.suggestFailed', err);
          if (!cancelled) setSuggestions([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [keyword]);

  const openSuggestion = (suggestion) => {
    window.location.href = `/events/${suggestion.id}`; // see the comment on openEvent
  };

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
    setDesiredQuantity(null);
    setShowQuantityPopup(true);
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
        // Cheapest first — matches Expedia's ticket-list ordering.
        setTicketGroups((groups || []).slice().sort((a, b) => (a.retailPrice ?? 0) - (b.retailPrice ?? 0)));
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
    const preferredQuantity = desiredQuantity && (group.purchasableQuantities || []).includes(desiredQuantity)
      ? desiredQuantity
      : (group.purchasableQuantities?.[0] || 1);
    setQuantity(preferredQuantity);
    setDeliveryMethod(group.deliveryMethods?.[0] || '');
    setResult(null);
  };

  useEffect(() => {
    if (!showQuantityPopup) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setShowQuantityPopup(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [showQuantityPopup]);

  const confirmQuantity = (q) => {
    setDesiredQuantity(q);
    setQuantity(q);
    setShowQuantityPopup(false);
  };

  // Groups that can't actually fulfil the requested quantity are hidden
  // rather than shown-then-disabled — Mercury only sells a group in
  // specific bundle sizes (purchasableQuantities), so a group that can't
  // match isn't a real option for this visitor at all.
  const visibleTicketGroups = desiredQuantity
    ? ticketGroups.filter((tg) => (tg.purchasableQuantities || []).includes(desiredQuantity))
    : ticketGroups;

  // Epoint is a redirect flow, not an inline mock charge — success here
  // means "the tickets are locked and a payment session is ready", not
  // "the purchase is done". A successful response takes the browser to
  // Epoint's hosted payment page; the actual outcome (paid + ticket
  // confirmed) is only known once the visitor lands back on
  // /events/payment/success and that page polls the order status (see
  // PaymentSuccessPage.jsx) — Epoint's webhook confirms it asynchronously.
  const submitPurchase = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !selectedGroup) return;
    setPurchasing(true);
    setResult(null);
    try {
      const res = await authFetch('/tickets/orders', {
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
      if (!res) {
        setResult({ success: false, failureReason: 'Sessiya bitib — yenidən daxil olun.' });
        return;
      }
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
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
                Ödəniş Epoint üzərindən aparılır. Yalnız sizin üçün açıqdır.
              </p>

              <form style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }} onSubmit={searchEvents}>
                <div className="tl-evt-search-wrap">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="Search events (e.g. Hamilton, Yankees, Madrid)"
                    className="tl-evt-input"
                    style={{ marginBottom: 0 }}
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="tl-evt-suggest">
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="tl-evt-suggest-item"
                          onMouseDown={() => openSuggestion(s)}
                        >
                          <span className="tl-evt-suggest-name">{s.name}</span>
                          <span className="tl-evt-suggest-meta">
                            {[s.date, [s.venue, s.city].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="tl-fbtn active" style={{ border: 'none', cursor: 'pointer' }}>
                  Axtar
                </button>
              </form>

              {loadingEvents && (
                <div className="tl-pkg-grid">
                  {Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}
                </div>
              )}
              {!loadingEvents && searched && events.length === 0 && (
                <p style={{ color: 'var(--tl-gray-400)', fontSize: 13 }}>Nəticə tapılmadı.</p>
              )}

              {!loadingEvents && events.length > 0 && (
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
                            {formatPrice(ev.lowPrice, ev.currencyCode)}-dən başlayaraq
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

          {selectedEvent && showQuantityPopup && (
            <div
              className="tl-evt-qty-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowQuantityPopup(false);
              }}
            >
              <div className="tl-evt-qty-box">
                <button type="button" className="tl-evt-qty-close" onClick={() => setShowQuantityPopup(false)}>×</button>
                <h3 className="tl-evt-sidebar-title" style={{ marginBottom: 4 }}>Neçə bilet lazımdır?</h3>
                <p className="tl-evt-tickets-sub" style={{ marginBottom: 20 }}>{selectedEvent.name}</p>
                <div className="tl-evt-qty-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((q) => (
                    <button key={q} type="button" className="tl-evt-qty-btn" onClick={() => confirmQuantity(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
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
                    <SeaticsSeatMap
                      eventId={selectedEvent.id}
                      ticketGroups={ticketGroups}
                      onBuyClick={(tgID, tgQuantity) => {
                        const group = ticketGroups.find((tg) => tg.ticketGroupId === tgID);
                        if (!group) return;
                        selectGroup(group);
                        if ((group.purchasableQuantities || []).includes(tgQuantity)) setQuantity(tgQuantity);
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                    <div>
                      <h2 className="tl-evt-tickets-head">Mövcud biletlər</h2>
                      <p className="tl-evt-tickets-sub" style={{ marginBottom: 0 }}>Bir seçim edin, sağdakı bölmədə davam edin.</p>
                    </div>
                    {desiredQuantity && (
                      <button type="button" className="tl-evt-qty-pill" onClick={() => setShowQuantityPopup(true)}>
                        {desiredQuantity} bilet · Dəyiş
                      </button>
                    )}
                  </div>

                  {loadingGroups && (
                    <div className="tl-evt-tickets" style={{ marginTop: 16 }}>
                      {Array.from({ length: 4 }).map((_, i) => <TicketRowSkeleton key={i} />)}
                    </div>
                  )}
                  {!loadingGroups && ticketGroups.length === 0 && (
                    <p style={{ color: 'var(--tl-gray-400)', fontSize: 13, marginTop: 16 }}>Bu tədbir üçün real bilet tapılmadı.</p>
                  )}
                  {!loadingGroups && ticketGroups.length > 0 && visibleTicketGroups.length === 0 && (
                    <p style={{ color: 'var(--tl-gray-400)', fontSize: 13, marginTop: 16 }}>
                      {desiredQuantity} bilet birlikdə mövcud deyil. <button type="button" className="tl-evt-inline-link" onClick={() => setShowQuantityPopup(true)}>Sayı dəyişin</button>
                    </p>
                  )}

                  {!loadingGroups && visibleTicketGroups.length > 0 && (
                    <div className="tl-evt-tickets" style={{ marginTop: 16 }}>
                      {visibleTicketGroups.map((tg) => {
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
                              <strong>{formatPrice(tg.retailPrice, tg.currencyCode)}</strong>
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
                          <strong>{formatPrice(selectedGroup.retailPrice, selectedGroup.currencyCode)}</strong>
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
                            <span className="tl-evt-sidebar-total-value">{formatMoney(selectedGroup.retailPrice * quantity, selectedGroup.currencyCode)}</span>
                          </div>

                          <button type="submit" className="tl-btn-book tl-evt-sidebar-cta" disabled={purchasing}>
                            {purchasing ? 'Yönləndirilir...' : 'Ödənişə keç'}
                          </button>
                        </form>
                      </>
                    )}

                    {/* A successful response redirects the browser to Epoint
                        immediately (see submitPurchase) — this only ever
                        renders the failure case, e.g. the tickets sold out
                        before the lock, or Epoint's session couldn't start. */}
                    {result && !result.success && (
                      <div className="tl-evt-result tl-evt-result-fail" style={{ marginTop: 16 }}>
                        <strong>Xəta: {result.failureReason}</strong>
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
