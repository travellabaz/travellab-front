import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { API_BASE, authFetch } from '../api/client';
import SeaticsSeatMap from '../components/SeaticsSeatMap';
import { useLocalizedNavigate } from '../components/LocalizedLink';
import { getLocaleFromPathname } from '../utils/locale';

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

// Day + short month for the search-result card's date badge (e.g. "24"/"AVQ").
function formatCardDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return {
      day: d.toLocaleString('az-AZ', { day: 'numeric' }),
      month: d.toLocaleString('az-AZ', { month: 'short' }).replace('.', ''),
    };
  } catch {
    return null;
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
    <div className="tl-evt-card">
      <div className="tl-evt-card-cover" />
      <div className="tl-evt-card-body">
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
  const { profile, isAuthenticated } = useAuth();
  const { openAuth } = useModals();
  const { eventId } = useParams();
  const navigate = useLocalizedNavigate();

  const [keyword, setKeyword] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [searched, setSearched] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Detail-page tabs (Ümumi məlumat / Yer seçimi / Qiymətlər / Qaydalar),
  // matching the reference mockup's structure — "Yer seçimi" holds the
  // existing map + ticket-list + checkout flow unchanged, the other three
  // are light read-only panels built from data we already have (event
  // fields, ticketGroups) rather than new content/API surface.
  const [activeTab, setActiveTab] = useState('seats');

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
    setActiveTab('seats');
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
    // Ticket orders now require an account (POST /v1/tickets/orders is no
    // longer in the security allowlist's public set) — catch this before
    // even making the request rather than letting it fail and showing a
    // buried error, so a logged-out visitor gets the login/register modal
    // directly off their "Ödənişə keç" click.
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    setPurchasing(true);
    setResult(null);
    try {
      const res = await authFetch('/tickets/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': getLocaleFromPathname(window.location.pathname) },
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
        // Session expired between page load and this click (stale/expired
        // token) — same recovery as the logged-out case above.
        openAuth('login');
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

  // A direct link (/events/:id) fetches that one event before anything
  // else exists to show — without this, the brief window before the
  // fetch resolves fell through to the generic search UI below, which
  // reads as "nothing here" to anyone opening the link fresh (confirmed
  // this is exactly what TicketNetwork support saw testing a shared
  // link). Split into "still loading" vs. "genuinely not found" so a
  // slow network doesn't get misread as a dead link, and a truly
  // expired/removed event says so instead of silently showing the
  // unrelated search page.
  const awaitingDeepLink = !!eventId && !selectedEvent && loadingGroups;
  const deepLinkNotFound = !!eventId && !selectedEvent && !loadingGroups;

  return (
      <section className="tl-page-top">
        <div className="tl-section tl-evt-page">
          {awaitingDeepLink && (
            <div className="tl-evt-tickets" style={{ marginTop: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => <TicketRowSkeleton key={i} />)}
            </div>
          )}

          {deepLinkNotFound && (
            <>
              <div className="tl-tag">Daxili test</div>
              <h1 className="tl-title">Bu tədbir artıq mövcud deyil</h1>
              <p style={{ color: 'var(--tl-gray-500)', fontSize: 13, marginTop: 8, marginBottom: 20 }}>
                Tədbir satışdan çıxıb və ya linkin müddəti bitib. Aşağıdakı axtarışdan aktual bir tədbir seçin.
              </p>
            </>
          )}

          {!selectedEvent && !awaitingDeepLink && (
            <>
              <div className="tl-evt-hero">
                <div className="tl-tag">Daxili test</div>
                <h1 className="tl-title">Tədbir biletləri — TEST</h1>
                <p style={{ color: 'rgba(244, 247, 250, 0.78)', fontSize: 13, marginTop: 8, marginBottom: 20 }}>
                  Ödəniş Epoint üzərindən aparılır. Yalnız sizin üçün açıqdır.
                </p>

                <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} onSubmit={searchEvents}>
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
              </div>

              {loadingEvents && (
                <div className="tl-evt-grid">
                  {Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}
                </div>
              )}
              {!loadingEvents && searched && events.length === 0 && (
                <p style={{ color: 'var(--tl-gray-400)', fontSize: 13 }}>Nəticə tapılmadı.</p>
              )}

              {!loadingEvents && events.length > 0 && (
                <div className="tl-evt-grid">
                  {events.map((ev) => {
                    const cardDate = formatCardDate(ev.date);
                    return (
                      <div className="tl-evt-card" key={ev.id} onClick={() => openEvent(ev)}>
                        <div className="tl-evt-card-cover">
                          {cardDate && (
                            <div className="tl-evt-card-date">
                              <span className="tl-evt-card-date-day">{cardDate.day}</span>
                              <span className="tl-evt-card-date-month">{cardDate.month}</span>
                            </div>
                          )}
                        </div>
                        <div className="tl-evt-card-body">
                          <h3 className="tl-evt-card-name">{ev.name}</h3>
                          <div className="tl-evt-card-meta">
                            {[ev.venue, ev.city].filter(Boolean).join(', ')}
                          </div>
                          {ev.lowPrice != null && (
                            <div className="tl-evt-card-price">
                              {formatPrice(ev.lowPrice, ev.currencyCode)}-dən başlayaraq
                            </div>
                          )}
                          {!ev.mercuryEligible && (
                            <div className="tl-evt-card-ineligible">Mercury ilə satılmır</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
              <div className="tl-evt-hero">
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
              </div>

              <div className="tl-evt-tabs">
                {[
                  { key: 'info', label: 'Ümumi məlumat' },
                  { key: 'seats', label: 'Yer seçimi' },
                  { key: 'prices', label: 'Qiymətlər' },
                  { key: 'rules', label: 'Qaydalar' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`tl-evt-tab${activeTab === tab.key ? ' tl-evt-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'info' && (
                <div className="tl-evt-tabpanel">
                  <p>
                    <strong>{selectedEvent.name}</strong>
                    {selectedEvent.date ? ` — ${formatEventDate(selectedEvent.date)}` : ''}
                    {selectedEvent.venue ? `, ${selectedEvent.venue}` : ''}
                    {selectedEvent.city ? `, ${selectedEvent.city}` : ''}.
                  </p>
                  <p>Biletlər rəsmi tərəfdaşımız TicketNetwork vasitəsilə təqdim olunur — bu, ilkin bilet satıcısı deyil, üçüncü tərəf satıcıların yerlərini təklif edən bir bazardır. Qiymətlər nominal dəyərdən yuxarı və ya aşağı ola bilər və satıcı tərəfindən müəyyən edilir.</p>
                  <p>Ödəniş Travellab-ın Epoint təhlükəsiz ödəniş sistemi üzərindən AZN ilə aparılır. Sifariş təsdiqləndikdən sonra bilet(lər) seçdiyiniz çatdırılma üsulu ilə (adətən e-bilet) təqdim olunur.</p>
                </div>
              )}

              {activeTab === 'prices' && (
                <div className="tl-evt-tabpanel">
                  {ticketGroups.length === 0 ? (
                    <p style={{ color: 'var(--tl-gray-400)' }}>Qiymət məlumatı hazırda mövcud deyil.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="tl-evt-price-table">
                        <thead>
                          <tr>
                            <th>Sektor</th>
                            <th>Sıra</th>
                            <th>Mövcud</th>
                            <th>Qiymət</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ticketGroups.map((tg) => (
                            <tr key={tg.ticketGroupId}>
                              <td>{tg.section || '—'}</td>
                              <td>{tg.row || '—'}</td>
                              <td>{tg.availableQuantity}</td>
                              <td><strong>{formatPrice(tg.retailPrice, tg.currencyCode)}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="tl-evt-tabpanel">
                  <p>Bütün satışlar yekundur — bilet(lər) geri qaytarılmır və ya dəyişdirilmir, tədbirin ləğvi halları istisna olmaqla.</p>
                  <p>Ödəniş uğurla aparıldıqdan sonra sifariş TicketNetwork Mercury sistemi vasitəsilə real vaxtda təsdiqlənir; təsdiqdən sonra bilet(lər) seçdiyiniz çatdırılma üsulu ilə təqdim olunur.</p>
                  <p>Əgər sifariş texniki səbəbdən təsdiqlənə bilməzsə, ödənişiniz avtomatik olaraq kartınıza geri qaytarılır.</p>
                </div>
              )}

              <div className="tl-evt-layout" style={{ display: activeTab === 'seats' ? 'flex' : 'none' }}>
                <div className="tl-evt-main">
                  <div className="tl-evt-map-card">
                    <SeaticsSeatMap
                      eventId={selectedEvent.id}
                      ticketGroups={ticketGroups}
                      ticketGroupsLoading={loadingGroups}
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
                              {/* Checkout charges AZN (Epoint doesn't take USD) — shown
                                  here so the amount on Epoint's own payment page isn't
                                  a surprise. */}
                              {tg.retailPriceAzn != null && <span className="tl-evt-ticket-price-azn">≈ {formatMoney(tg.retailPriceAzn, 'AZN')}</span>}
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
                          {/* What Ödənişə keç actually charges — Epoint is AZN-only,
                              so the USD total above isn't what gets billed. Shown
                              explicitly rather than leaving that discovery for
                              Epoint's own payment page. */}
                          {selectedGroup.retailPriceAzn != null && (
                            <div className="tl-evt-sidebar-total tl-evt-sidebar-total-azn">
                              <span className="tl-evt-sidebar-total-label">Kartdan tutulacaq (AZN)</span>
                              <span className="tl-evt-sidebar-total-value">{formatMoney(selectedGroup.retailPriceAzn * quantity, 'AZN')}</span>
                            </div>
                          )}

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
