import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { API_BASE, authFetch } from '../api/client';
import SeaticsSeatMap from '../components/SeaticsSeatMap';
import { useLocalizedNavigate } from '../components/LocalizedLink';
import { getLocaleFromPathname } from '../utils/locale';
import { formatDateTimeAz, formatDayMonthAz, formatDateOnlyAz } from '../utils/date';

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
  return formatDateTimeAz(iso);
}

// selectedEvent.scheduleStatus is TicketNetwork's raw Catalog value.
// Confirmed live that a perfectly normal, on-sale event's real value is
// "On Schedule" — not "Active"/"OnSale" as originally guessed without API
// access, which meant EVERY normal event was wrongly matching the
// fallback "status changed" message and hiding real, purchasable
// inventory (see the EmptyState in the "seats" tab below). Matching
// against a whitelist of "known good" values is exactly what broke this
// the first time a real but unanticipated value showed up, so this is a
// blacklist instead: only specific bad-known values trigger a message,
// anything else (this or any future unrecognized status) is treated as
// on sale — ticketGroups.length===0 is what actually protects against
// showing a broken/empty purchase flow, this is purely informational.
const EVENT_STATUS_MESSAGES = {
  postponed: 'Bu tədbir təxirə salınıb. Yeni tarix açıqlandıqda bu səhifə yenilənəcək.',
  cancelled: 'Bu tədbir ləğv edilib.',
  canceled: 'Bu tədbir ləğv edilib.',
  rescheduled: 'Bu tədbirin tarixi dəyişdirilib — aktual tarixi yuxarıda yoxlayın.',
  soldout: 'Bu tədbir üçün biletlər satılıb qurtarıb.',
};

function getEventStatusMessage(scheduleStatus) {
  if (!scheduleStatus) return null;
  const key = scheduleStatus.trim().toLowerCase().replace(/\s+/g, '');
  return EVENT_STATUS_MESSAGES[key] || null;
}

// Caps the rendered page-number buttons so paging far forward doesn't
// eventually render hundreds of them — always keeps 1, the current page
// +/-1, and the highest known page, collapsing the rest behind '…'.
function getPageWindow(current, max) {
  if (max <= 7) return Array.from({ length: max }, (_, i) => i + 1);
  const pages = new Set([1, max, current - 1, current, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= max).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
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

// Day + short month for the search-result card's date badge (e.g. "24"/"Avq").
function formatCardDate(iso) {
  return formatDayMonthAz(iso);
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

function ForwardArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OfficialBadgeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l2.4 2.4 3.3-.5.6 3.3 3 1.6-1.6 3 1.6 3-3 1.6-.6 3.3-3.3-.5L12 22l-2.4-2.4-3.3.5-.6-3.3-3-1.6 1.6-3-1.6-3 3-1.6.6-3.3 3.3.5L12 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SecurePaymentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="10" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 10V7a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MobileAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 18h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

// Shared with both the main search grid and EmptyState's "Oxşar tədbirlər"
// suggestions, so the two never drift into two different card designs.
function EventCard({ event, onClick }) {
  const cardDate = formatCardDate(event.date);
  return (
    <div className="tl-evt-card" onClick={onClick}>
      <div className="tl-evt-card-cover">
        {cardDate && (
          <div className="tl-evt-card-date">
            <span className="tl-evt-card-date-day">{cardDate.day}</span>
            <span className="tl-evt-card-date-month">{cardDate.month}</span>
          </div>
        )}
      </div>
      <div className="tl-evt-card-body">
        <h3 className="tl-evt-card-name">{event.name}</h3>
        <div className="tl-evt-card-meta">
          {[formatDateOnlyAz(event.date), [event.venue, event.city].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
        </div>
        {event.lowPrice != null && (
          <div className="tl-evt-card-price">
            {formatPrice(event.lowPrice, event.currencyCode)}-dən başlayaraq
          </div>
        )}
        {!event.mercuryEligible && (
          <div className="tl-evt-card-ineligible">Mercury ilə satılmır</div>
        )}
      </div>
    </div>
  );
}

function EmptyStateIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7l1-4h14l1 4M4 7v11a2 2 0 002 2h12a2 2 0 002-2V7M4 7h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Reused for every "nothing to show" case (no search results, a specific
// event with no purchasable tickets, a postponed/cancelled/sold-out
// event) — a plain one-line text message used to just dead-end the
// visitor there; this always gives them a next step (browse everything)
// plus, when we have them on hand, a few other real events to consider
// instead of leaving the page empty.
function EmptyState({ title, message, onBrowseAll, suggestions }) {
  return (
    <div className="tl-evt-empty">
      <div className="tl-evt-empty-icon"><EmptyStateIcon /></div>
      <h3 className="tl-evt-empty-title">{title}</h3>
      <p className="tl-evt-empty-text">{message}</p>
      {onBrowseAll && (
        <button type="button" className="tl-btn-book tl-evt-empty-cta" onClick={onBrowseAll}>
          Digər tədbirlərə bax
        </button>
      )}
      {suggestions && suggestions.length > 0 && (
        <div className="tl-evt-empty-suggestions">
          <div className="tl-evt-empty-suggestions-title">Oxşar tədbirlər</div>
          <div className="tl-evt-grid">
            {suggestions.map((ev) => (
              <EventCard key={ev.id} event={ev} onClick={() => { window.location.href = `/events/${ev.id}`; }} />
            ))}
          </div>
        </div>
      )}
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // Highest page number we know for sure exists (a real 1/2/3... pagination
  // bar, not just Prev/Next) — grows as the visitor pages forward, since
  // the backend's ?page= endpoint never returns a total count to size the
  // bar up front (see runSearch).
  const [maxPage, setMaxPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // "Oxşar tədbirlər" suggestions for EmptyState — a handful of other
  // real, on-sale events, fetched lazily (only once something actually
  // needs to show them: a dead-end search, or an event with no
  // purchasable tickets/non-active status) rather than on every page load.
  const [otherEvents, setOtherEvents] = useState([]);
  const fetchOtherEvents = (excludeId) => {
    fetch(API_BASE + '/tickets/events')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOtherEvents((data || []).filter((ev) => String(ev.id) !== String(excludeId)).slice(0, 4)))
      .catch((err) => console.error('ActionLog.ticketNetworkEvents.otherEventsFailed', err));
  };

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Landing-page sections (hero carousel, "Seçilmiş tədbirlər", "Yaxın
  // tarixlərdə") — one shared fetch of the same default (no-keyword)
  // event list events.js also uses, sliced two different ways client-side
  // rather than two separate API calls. Only loaded once, before the
  // visitor has searched for anything.
  const [landingEvents, setLandingEvents] = useState([]);
  const [landingLoaded, setLandingLoaded] = useState(false);
  useEffect(() => {
    if (eventId) return; // only the /events list view needs this
    fetch(API_BASE + '/tickets/events')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLandingEvents(data || []))
      .catch((err) => console.error('ActionLog.ticketNetworkEvents.landingFailed', err))
      .finally(() => setLandingLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Catalog has no category/genre field at all (confirmed — not just
  // unmapped), so these chips can't be a real taxonomy filter. Each one
  // instead runs a real keyword search using a representative term —
  // honest (real search results, not a fake filter) even though it's not
  // the per-event category system the design implies. Revisit if
  // TicketNetwork ever exposes real classification data.
  const CATEGORY_SHORTCUTS = [
    { key: 'all', label: 'Bütün tədbirlər', kw: '' },
    { key: 'concerts', label: 'Konsertlər', kw: 'concert' },
    { key: 'sports', label: 'İdman oyunları', kw: 'sports' },
    { key: 'festivals', label: 'Festivallar', kw: 'festival' },
    { key: 'theatre', label: 'Teatr', kw: 'theatre' },
    { key: 'shows', label: 'Şou proqram', kw: 'show' },
    { key: 'expos', label: 'Sərgilər', kw: 'expo' },
    { key: 'other', label: 'Digər', kw: 'event' },
  ];
  const runCategorySearch = (kw) => {
    setKeyword(kw);
    setMaxPage(1);
    setCityFilter('');
    runSearch(kw, 1);
  };

  // Featured hero carousel + "Seçilmiş tədbirlər" — sorted by Catalog's
  // own salesRank (lower = more popular, per TicketNetwork's naming;
  // events Catalog didn't rank sort last). "Yaxın tarixlərdə" is the
  // same fetch sorted by date instead, deduped against whatever's
  // already shown as featured so the two sections don't just repeat
  // each other.
  const featuredEvents = [...landingEvents]
    .sort((a, b) => (a.salesRank ?? Infinity) - (b.salesRank ?? Infinity))
    .slice(0, 5);
  const featuredIds = new Set(featuredEvents.map((ev) => ev.id));
  const upcomingEvents = [...landingEvents]
    .filter((ev) => !featuredIds.has(ev.id))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 8);

  const [heroSlide, setHeroSlide] = useState(0);
  useEffect(() => {
    if (featuredEvents.length < 2) return undefined;
    const timer = setInterval(() => setHeroSlide((s) => (s + 1) % featuredEvents.length), 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredEvents.length]);

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

  // Backend supports ?page= (1-indexed, fixed page size server-side, see
  // TicketNetworkEventService.searchPageSize) but doesn't return a total
  // count — "hasNextPage" is a simple heuristic: enabled as long as the
  // page we just fetched came back full-looking (non-empty); if a click
  // on "Növbəti" ever lands on a genuinely empty page, that page is
  // simply shown empty with Next disabled rather than guessed in advance.
  const runSearch = async (kw, pageNum) => {
    setLoadingEvents(true);
    setSearched(true);
    try {
      const url = API_BASE + '/tickets/events?' + [
        kw.trim() ? 'keyword=' + encodeURIComponent(kw.trim()) : null,
        'page=' + pageNum,
        dateFrom ? 'dateFrom=' + dateFrom : null,
        dateTo ? 'dateTo=' + dateTo : null,
      ].filter(Boolean).join('&');
      const res = await fetch(url);
      const data = res.ok ? await res.json() : [];
      const gotMore = (data || []).length > 0;
      setEvents(data || []);
      setPage(pageNum);
      setHasMore(gotMore);
      setMaxPage((m) => Math.max(m, gotMore ? pageNum + 1 : pageNum));
      if ((data || []).length === 0) fetchOtherEvents();
    } catch (err) {
      console.error('ActionLog.ticketNetworkEvents.searchFailed', err);
      setEvents([]);
      setHasMore(false);
    } finally {
      setLoadingEvents(false);
    }
  };

  const searchEvents = (e) => {
    e.preventDefault();
    setMaxPage(1);
    setCityFilter('');
    runSearch(keyword, 1);
  };

  const goToPage = (pageNum) => {
    if (pageNum < 1) return;
    runSearch(keyword, pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setKeyword('');
    setDateFrom('');
    setDateTo('');
    setCityFilter('');
    setMaxPage(1);
    runSearch('', 1);
  };

  // City/venue narrowing — client-side only. Catalog has no confirmed
  // filter clause for this (no local API reference to verify a field
  // path against, and guessing one risks silently returning wrong
  // results server-side, same class of mistake as the scheduleStatus
  // value guess earlier). Instead the dropdown only ever lists cities
  // that are actually present in the current real result set, and
  // narrows what's shown from data already fetched — real data, no
  // fabricated venue list, no unverified server-side filter.
  const availableCities = [...new Set(events.map((ev) => ev.city).filter(Boolean))].sort();
  const visibleEvents = cityFilter ? events.filter((ev) => ev.city === cityFilter) : events;

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

  const eventStatusMessage = selectedEvent ? getEventStatusMessage(selectedEvent.scheduleStatus) : null;
  const noTicketsAvailable = !loadingGroups && (!!eventStatusMessage || ticketGroups.length === 0);

  // Once it's clear there's really nothing to sell here (non-active
  // status, or Mercury simply has no ticket groups for this event),
  // fetch a few other real events so EmptyState below can suggest them
  // instead of just dead-ending the visitor — and skip mounting
  // SeaticsSeatMap at all, since Seatics' own widget shows its own
  // (English, unbranded) "no results"/"postponed" messaging in exactly
  // this situation, which this replaces.
  useEffect(() => {
    if (!selectedEvent || loadingGroups) return undefined;
    if (getEventStatusMessage(selectedEvent.scheduleStatus) || ticketGroups.length === 0) {
      fetchOtherEvents(selectedEvent.id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent, loadingGroups, ticketGroups.length]);

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
              <h1 className="tl-title">Bu tədbir artıq mövcud deyil</h1>
              <p style={{ color: 'var(--tl-gray-500)', fontSize: 13, marginTop: 8, marginBottom: 20 }}>
                Tədbir satışdan çıxıb və ya linkin müddəti bitib. Aşağıdakı axtarışdan aktual bir tədbir seçin.
              </p>
            </>
          )}

          {!selectedEvent && !awaitingDeepLink && (
            <>
              <div className="tl-evt-hero tl-evt-hero-landing">
                <div className="tl-evt-hero-main">
                  <div className="tl-evt-hero-eyebrow">Bilet al, dünyanı yaşa</div>
                  <h1 className="tl-title">Konsertlər və Tədbirlər</h1>
                  <p className="tl-evt-hero-sub">
                    Sevdiyin artistlər, unudulmaz anlar. Dünyanın ən böyük konsertləri, idman oyunları və festivalları bir klik uzaqlığında.
                  </p>

                  <form className="tl-evt-hero-search-form" onSubmit={searchEvents}>
                    <div className="tl-evt-search-wrap">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder="Tədbir, artist, şəhər və ya məkan"
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
                    <div className="tl-evt-hero-date-wrap">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="tl-evt-input tl-evt-date-input"
                        style={{ marginBottom: 0 }}
                        aria-label="Tarixdən"
                        min={new Date().toISOString().slice(0, 10)}
                      />
                      <span className="tl-evt-date-sep">—</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="tl-evt-input tl-evt-date-input"
                        style={{ marginBottom: 0 }}
                        aria-label="Tarixədək"
                        min={dateFrom || new Date().toISOString().slice(0, 10)}
                      />
                    </div>
                    <button type="submit" className="tl-evt-cta-btn" style={{ border: 'none', cursor: 'pointer' }}>
                      Axtar
                    </button>
                  </form>
                </div>

                {landingLoaded && featuredEvents.length > 0 && (
                  <div className="tl-evt-hero-feature">
                    {featuredEvents.map((ev, i) => {
                      const d = formatCardDate(ev.date);
                      return (
                        <div
                          key={ev.id}
                          className={`tl-evt-hero-feature-card${i === heroSlide ? ' tl-evt-hero-feature-active' : ''}`}
                          onClick={() => openEvent(ev)}
                        >
                          <div className="tl-evt-hero-feature-img">
                            {d && (
                              <div className="tl-evt-card-date">
                                <span className="tl-evt-card-date-day">{d.day}</span>
                                <span className="tl-evt-card-date-month">{d.month}</span>
                              </div>
                            )}
                          </div>
                          <div className="tl-evt-hero-feature-body">
                            <h3 className="tl-evt-hero-feature-name">{ev.name}</h3>
                            <div className="tl-evt-hero-feature-meta">{[ev.venue, ev.city].filter(Boolean).join(', ')}</div>
                            <button type="button" className="tl-evt-cta-btn tl-evt-hero-feature-btn" onClick={(e) => { e.stopPropagation(); openEvent(ev); }}>
                              Biletləri əldə et
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {featuredEvents.length > 1 && (
                      <div className="tl-evt-hero-dots">
                        {featuredEvents.map((ev, i) => (
                          <button
                            key={ev.id}
                            type="button"
                            className={`tl-evt-hero-dot${i === heroSlide ? ' tl-evt-hero-dot-active' : ''}`}
                            aria-label={`Slayd ${i + 1}`}
                            onClick={() => setHeroSlide(i)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!searched && (
                <>
                  <div className="tl-evt-categories">
                    {CATEGORY_SHORTCUTS.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        className={`tl-evt-cat-chip${keyword === cat.kw ? ' tl-evt-cat-chip-active' : ''}`}
                        onClick={() => runCategorySearch(cat.kw)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {landingLoaded && featuredEvents.length > 0 && (
                    <div className="tl-evt-section">
                      <div className="tl-evt-section-head">
                        <h2 className="tl-evt-section-title">Seçilmiş tədbirlər</h2>
                        <button type="button" className="tl-evt-section-link" onClick={() => runCategorySearch('')}>Hamısına bax</button>
                      </div>
                      <div className="tl-evt-grid">
                        {featuredEvents.map((ev) => (
                          <EventCard key={ev.id} event={ev} onClick={() => openEvent(ev)} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="tl-evt-promo">
                    <div className="tl-evt-promo-main">
                      <h2 className="tl-evt-promo-title">Daha çox tədbir, daha çox an</h2>
                      <p className="tl-evt-promo-text">Dünyanın ən yaxşı konsertləri, festivalları və idman oyunları Travellab-da!</p>
                      <button type="button" className="tl-evt-promo-cta" onClick={() => runCategorySearch('')}>Tədbirlərə bax</button>
                    </div>
                    <div className="tl-evt-promo-cats">
                      {[
                        { label: 'İdman oyunları', sub: 'Futbol, Basketbol, Tennis və daha çox', kw: 'sports' },
                        { label: 'Festivallar', sub: 'Musiqi, rəng, azadlıq', kw: 'festival' },
                        { label: 'Teatr və şoular', sub: 'Ən yaxşı səhnə tamaşaları', kw: 'theatre' },
                      ].map((c) => (
                        <button key={c.kw} type="button" className="tl-evt-promo-cat" onClick={() => runCategorySearch(c.kw)}>
                          <span>
                            <strong>{c.label}</strong>
                            <span className="tl-evt-promo-cat-sub">{c.sub}</span>
                          </span>
                          <ForwardArrowIcon />
                        </button>
                      ))}
                    </div>
                  </div>

                  {landingLoaded && upcomingEvents.length > 0 && (
                    <div className="tl-evt-section">
                      <div className="tl-evt-section-head">
                        <h2 className="tl-evt-section-title">Yaxın tarixlərdə</h2>
                        <button type="button" className="tl-evt-section-link" onClick={() => runCategorySearch('')}>Hamısına bax</button>
                      </div>
                      <div className="tl-evt-grid">
                        {upcomingEvents.map((ev) => (
                          <EventCard key={ev.id} event={ev} onClick={() => openEvent(ev)} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="tl-evt-trust-strip">
                    <div className="tl-evt-trust-strip-item"><OfficialBadgeIcon /> <span>Rəsmi satıcı<small>100% orijinal biletlər</small></span></div>
                    <div className="tl-evt-trust-strip-item"><SecurePaymentIcon /> <span>Təhlükəsiz ödəniş<small>Epoint ilə etibarlı</small></span></div>
                    <div className="tl-evt-trust-strip-item"><SupportIcon /> <span>Dəstək<small>24/7 müştəri xidməti</small></span></div>
                    <div className="tl-evt-trust-strip-item"><MobileAppIcon /> <span>Mobil tətbiq<small>Səfərinizin hər anında</small></span></div>
                  </div>
                </>
              )}

              {loadingEvents && (
                <div className="tl-evt-grid">
                  {Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}
                </div>
              )}

              {!loadingEvents && searched && events.length === 0 && (
                <EmptyState
                  title="Nəticə tapılmadı"
                  message="Axtarışınıza uyğun tədbir tapılmadı. Başqa açar söz sınayın və ya bütün tədbirlərə baxın."
                  onBrowseAll={clearSearch}
                  suggestions={otherEvents}
                />
              )}

              {!loadingEvents && events.length > 0 && (
                <>
                  {availableCities.length > 1 && (
                    <div className="tl-evt-city-filter">
                      <label htmlFor="tl-evt-city-select">Şəhər:</label>
                      <select id="tl-evt-city-select" className="tl-evt-select" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                        <option value="">Bütün şəhərlər</option>
                        {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                  {visibleEvents.length === 0 ? (
                    <p style={{ color: 'var(--tl-gray-400)', fontSize: 13 }}>
                      Bu şəhərdə nəticə yoxdur. <button type="button" className="tl-evt-inline-link" onClick={() => setCityFilter('')}>Bütün şəhərləri göstər</button>
                    </p>
                  ) : (
                    <div className="tl-evt-grid">
                      {visibleEvents.map((ev) => (
                        <EventCard key={ev.id} event={ev} onClick={() => openEvent(ev)} />
                      ))}
                    </div>
                  )}
                  {(maxPage > 1 || page > 1) && (
                    <div className="tl-evt-pagination">
                      <button type="button" className="tl-evt-page-arrow" onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label="Əvvəlki">
                        <BackArrowIcon />
                      </button>
                      {getPageWindow(page, maxPage).map((n, i) => (
                        n === '…' ? (
                          <span key={`ellipsis-${i}`} className="tl-evt-page-ellipsis">…</span>
                        ) : (
                          <button
                            key={n}
                            type="button"
                            className={`tl-evt-page-num-btn${n === page ? ' tl-evt-page-num-btn-active' : ''}`}
                            onClick={() => goToPage(n)}
                          >
                            {n}
                          </button>
                        )
                      ))}
                      <button type="button" className="tl-evt-page-arrow" onClick={() => goToPage(page + 1)} disabled={!hasMore} aria-label="Növbəti">
                        <span className="tl-evt-page-next-arrow">›</span>
                      </button>
                    </div>
                  )}
                </>
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

              {eventStatusMessage && (
                <div className="tl-evt-status-banner">{eventStatusMessage}</div>
              )}

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
                {noTicketsAvailable ? (
                  <div className="tl-evt-main">
                    <EmptyState
                      title={eventStatusMessage ? 'Bu tədbir hazırda satışda deyil' : 'Bilet tapılmadı'}
                      message={eventStatusMessage || 'Bu tədbir üçün hazırda satılan real bilet yoxdur. Bir az sonra yenidən yoxlayın və ya digər tədbirlərə baxın.'}
                      onBrowseAll={backToResults}
                      suggestions={otherEvents}
                    />
                  </div>
                ) : (
                <>
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
                  {!loadingGroups && visibleTicketGroups.length === 0 && (
                    <p style={{ color: 'var(--tl-gray-400)', fontSize: 13, marginTop: 16 }}>
                      {desiredQuantity} bilet birlikdə mövcud deyil. <button type="button" className="tl-evt-inline-link" onClick={() => setShowQuantityPopup(true)}>Sayı dəyişin</button>
                    </p>
                  )}

                  {!loadingGroups && visibleTicketGroups.length > 0 && (
                    <div className="tl-evt-tickets" style={{ marginTop: 16 }}>
                      {visibleTicketGroups.map((tg) => {
                        const isSelected = selectedGroup?.ticketGroupId === tg.ticketGroupId;
                        return (
                          <div
                            key={tg.ticketGroupId}
                            role="button"
                            tabIndex={0}
                            onClick={() => selectGroup(tg)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectGroup(tg); }}
                            className={`tl-evt-ticket-row${isSelected ? ' tl-evt-ticket-row-selected' : ''}`}
                          >
                            <span className="tl-evt-ticket-label">
                              <span className="tl-evt-ticket-section">{tg.section || 'Section n/a'}{tg.row ? `, Row ${tg.row}` : ''}</span>
                              <span className="tl-evt-ticket-sub">
                                {tg.availableQuantity} available · {(tg.deliveryMethods || []).join(', ')}
                              </span>
                            </span>
                            <span className="tl-evt-ticket-price-col">
                              <span className="tl-evt-ticket-price">
                                <strong>{formatPrice(tg.retailPrice, tg.currencyCode)}</strong>
                                {/* Checkout charges AZN (Epoint doesn't take USD) — shown
                                    here so the amount on Epoint's own payment page isn't
                                    a surprise. */}
                                {tg.retailPriceAzn != null && <span className="tl-evt-ticket-price-azn">≈ {formatMoney(tg.retailPriceAzn, 'AZN')}</span>}
                                <span>bilet başına</span>
                              </span>
                              {/* Explicit CTA per row, matching Expedia's own ticket-list
                                  pattern (separate "Buy" column) — same action as clicking
                                  the row itself (selectGroup), just a more obvious "do
                                  this now" target than relying on the whole row being
                                  clickable. */}
                              <button
                                type="button"
                                className="tl-evt-ticket-buy"
                                onClick={(e) => { e.stopPropagation(); selectGroup(tg); }}
                              >
                                Al
                              </button>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedGroup && (
                <div className="tl-evt-sidebar-col">
                  <div className="tl-evt-sidebar">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h3 className="tl-evt-sidebar-title" style={{ marginBottom: 0 }}>Sifariş xülasəsi</h3>
                          <button type="button" className="tl-evt-sidebar-close" onClick={() => setSelectedGroup(null)} aria-label="Bağla">×</button>
                        </div>

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
                )}
                </>
                )}
              </div>
            </>
          )}
        </div>
      </section>
  );
}
