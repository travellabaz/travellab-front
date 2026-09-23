import { useEffect, useState } from 'react';
import { API_BASE } from '../api/client';

// Embeds TicketNetwork's Seatics/MapWidget interactive seat map for one
// event, per the official "Seatics Maps API Integration Guide" (v3.18,
// TicketNetwork — sent to us directly by their support, Yuliya, after
// everything below this comment had already been reverse-engineered the
// hard way): load jQuery, the framework script, then the MapAndLayout
// script with websiteConfigId/consumerKey/eventId, and place the result
// in the page.
//
// This is an old-style widget that renders itself via document.write from
// a <script src> tag it expects to be loaded at parse time — modern
// browsers silently ignore document.write() from a <script> appended
// dynamically after page load, so this can't just be a JS-created
// <script> tag on the page itself. An iframe with srcDoc sidesteps that:
// the markup (including its <script> tags) is parsed natively as that
// iframe's own document, exactly like a normal server-rendered page would
// be, so document.write works as the widget expects.
//
// Everything about wheel-scroll hijacking, a runaway/varying rendered
// height, and the seating chart silently repositioning itself in the
// background — the entire earlier history of this file, all of it spent
// reverse-engineering the widget's internal DOM to patch around each
// symptom individually — turned out to trace back to one documented
// setting: Seatics.config.mapContained defaults to false. The "modern"
// (uncontained) mode the widget ships with expects to be the page's own
// background, roaming and resizing itself freely — exactly the behavior
// we kept fighting. Setting it to true switches the widget into the
// "traditional" mode the guide describes as "wrapped in its own
// container" — actually sized to and contained by the box we give it,
// no JS-side measuring or locking required.
// Maps our own TicketGroupDto shape (see TicketNetworkEventsPage.jsx,
// GET /tickets/events/:id/ticketgroups — a thin, Mercury-backed DTO,
// deliberately retail-price-only) onto the Seatics addTicketData() input
// shape from the "Seatics Maps API Integration Guide" (v3.18). Without
// this, the widget's own ticket/price panel has nothing to show — it was
// never an OAuth-scope gap on TicketNetwork's side, just a call we'd
// never made. tgUserSeats (exact seat numbers) isn't included — our own
// DTO doesn't carry high/low seat numbers, and it's optional either way.
// tgType:1 (plain Event Ticket) is set explicitly even though the guide
// calls it optional and defaults untyped groups to Event Ticket anyway —
// every single example in the guide sets it regardless, and leaving it out
// was confirmed live to leave the Ticket Details Slide Out's own Quantity
// Selector blank (no 1/2/etc buttons), even though the ticket group itself
// still lists and prices correctly without it.
function toSeaticsTicketData(ticketGroups) {
  return (ticketGroups || []).map((tg) => {
    const entry = {
      tgUserSec: tg.section || '',
      tgUserRow: tg.row || '',
      tgQty: tg.availableQuantity ?? 0,
      tgPrice: tg.retailPrice ?? 0,
      tgID: tg.ticketGroupId,
      tgType: 1,
    };
    // tgSplitsBitmap — only the visitor-purchasable quantities Mercury
    // actually allows, not "any quantity up to tgQty" (the widget's own
    // default, split rule 1). Bit i (0-indexed) set means quantity i+1
    // is valid — see the guide's "Splits Bitmap" section.
    if (Array.isArray(tg.purchasableQuantities) && tg.purchasableQuantities.length > 0) {
      entry.tgSplitsBitmap = tg.purchasableQuantities.reduce((bits, qty) => bits | (1 << (qty - 1)), 0);
    }
    return entry;
  });
}

export default function SeaticsSeatMap({ eventId, ticketGroups, ticketGroupsLoading, onBuyClick }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API_BASE + '/tickets/mapwidget/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch((err) => console.error('ActionLog.seaticsSeatMap.configFailed', err));
    return () => {
      cancelled = true;
    };
  }, []);

  // The guide requires overriding Seatics.Presentation.redirectToCheckout
  // (called when the widget's own "Buy" button is clicked) — left
  // undefined, clicking Buy inside the map would throw rather than do
  // anything. Forwarded to the parent page instead of handled here: this
  // component doesn't have the actual purchase flow (the quantity modal,
  // the order form) — TicketNetworkEventsPage.jsx does, via onBuyClick.
  useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.type === 'seatics-buy') {
        onBuyClick?.(e.data.tgID, e.data.quantity);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onBuyClick]);

  // Wait for the parent's ticket-group fetch to finish before mounting the
  // iframe at all. srcDoc (below) bakes ticketDataJson into the widget's
  // one-time addTicketData() call — if ticketGroups arrived after the iframe
  // already mounted with stale (empty) data, the srcDoc string would change
  // and the browser would silently reload the entire iframe document to
  // apply it (confirmed live: the map flashed blank and rebuilt itself a few
  // seconds after first appearing, right as the real ticket data landed).
  // Mounting only once real data is in hand means the widget loads exactly
  // once, with the right data already baked in.
  if (!config || !eventId || ticketGroupsLoading) return null;

  const mapUrl = `${config.baseUrl}/MapAndLayout?websiteConfigId=${config.websiteConfigId}&consumerKey=${encodeURIComponent(config.consumerKey)}&eventId=${eventId}`;
  const ticketDataJson = JSON.stringify(toSeaticsTicketData(ticketGroups));

  // The Seatics framework script expects jQuery to already be on the page
  // (throws "jQuery is not defined" otherwise, confirmed live) — it's a
  // legacy widget, doesn't bundle its own copy.
  //
  // upgrade-insecure-requests: Seatics' own framework script pulls
  // several of its follow-up resources (Css/customUI, featureFlag,
  // trackingProcessing, etc.) over hardcoded http:// URLs — confirmed
  // live the same host serves all of them over https:// too, so this
  // has the browser silently rewrite those to https:// before sending,
  // avoiding the mixed-content block that otherwise broke the map in
  // Chrome/Edge.
  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
<style>
/* Per TicketNetwork support's own suggestion for the periodic
   pan/zoom-reset issue (already reported, see the email thread) — cap
   the iframe document's own height so an internal resize-driven redraw
   loop, if that's the cause, has nothing to keep growing into. Doesn't
   affect layout otherwise: this document is already sized by our fixed
   900px iframe, not by 100vh (100vh here means the iframe's own
   viewport, not the outer page's). */
body{margin:0;font-family:sans-serif;max-height:100vh;overflow:hidden;}
#seatics-map{max-height:100vh;overflow:hidden;}
</style>
<script>
// Pre-declared before the framework script loads — its own bootstrap is
// "var Seatics = Seatics || {}", so whatever we set here survives and
// gets built on rather than overwritten.
// - mapContained: see the file-level comment — the actual fix.
// - mouseWheelZoomEnabled: false is the guide's own documented default,
//   but confirmed live our config had it active, hijacking page-scroll
//   into map zoom/pan whenever the cursor happened to rest over the map.
//   Setting it explicitly guarantees the documented (off) behavior
//   regardless of whatever our websiteConfigId currently has stored.
window.Seatics = { config: { mapContained: true, mouseWheelZoomEnabled: false } };
</script>
<script>
// Workaround for a bug in the widget itself, confirmed live via DevTools
// (not something mapContained above fixes): div.sea-map-inner's own
// height keeps growing without bound — 300px at load, ~4000px within a
// couple seconds, tens of thousands of px if left running, triggered by
// resize/scroll events feeding what looks like a "current + delta"
// calculation instead of an absolute one. The visible symptom (the map
// going blank / seeming to "reset") isn't the container collapsing —
// it's that the map's own <svg class="venue-map-svg"> picks up a stale,
// huge inline transform: translate(...) as a side effect of that same
// runaway calculation, physically rendering the map thousands of pixels
// below the visible area. Reported to TicketNetwork support; this is a
// client-side mitigation, not a real fix — it can't correct their
// internal click/hit-testing state, only what's visibly on screen.
//
// Runs before jQuery/the framework script below so it's observing from
// the very first mutation, not reacting after growth has already
// compounded — capping only after the fact does nothing (confirmed
// live: the stale transform on the SVG doesn't get recalculated just
// because the container's height is reset afterward).
(function () {
  var HEIGHT_CAP = 900; // matches this iframe's own fixed height
  var TRANSLATE_CAP = 400; // generous headroom over any legitimate pan

  function clampHeight(el) {
    var h = parseFloat(el.style.height);
    if (h > HEIGHT_CAP) el.style.setProperty('height', HEIGHT_CAP + 'px', 'important');
  }

  function clampTransform(el) {
    var t = el.style.transform;
    if (!t) return;
    var m = /translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/.exec(t);
    if (!m) return;
    var tx = parseFloat(m[1]), ty = parseFloat(m[2]);
    if (Math.abs(tx) > TRANSLATE_CAP || Math.abs(ty) > TRANSLATE_CAP) {
      el.style.setProperty('transform', t.replace(/translate\\([^)]*\\)/, 'translate(0px, 0px)'), 'important');
    }
  }

  function watch(el) {
    if (el.classList && el.classList.contains('sea-map-inner')) {
      clampHeight(el);
      new MutationObserver(function () { clampHeight(el); }).observe(el, { attributes: true, attributeFilter: ['style'] });
    }
    if (el.tagName === 'svg' || el.tagName === 'SVG') {
      clampTransform(el);
      new MutationObserver(function () { clampTransform(el); }).observe(el, { attributes: true, attributeFilter: ['style'] });
    }
  }

  new MutationObserver(function (records) {
    records.forEach(function (r) {
      r.addedNodes && r.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        watch(n);
        if (n.querySelectorAll) {
          n.querySelectorAll('.sea-map-inner, svg').forEach(watch);
        }
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
</script>
</head>
<body>
<div id="seatics-map"></div>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="${config.frameworkUrl}"></script>
<script>
// Seatics.SmallScreenMapOptions is defined by the framework bootstrap
// above, so this can't be set in the pre-declared config block — it has
// to run after the framework script but before the Maps script below
// actually renders anything. Without this, the guide's own documented
// default (HiddenWithPreview) applies on narrow screens: only a thin
// sliver of the map shows, behind a "Show Venue Map" tap target — on
// this site that left mobile visitors seeing just the ticket list with
// no visible map at all. FullyShown matches what desktop already gets.
Seatics.config.smallScreenMapLayout = Seatics.SmallScreenMapOptions.FullyShown;
</script>
<script src="${mapUrl}"></script>
<script>
// Below the Maps script, per the guide — feeds the widget's own
// ticket/price panel our real inventory instead of leaving it to
// skeleton-load forever waiting for data nothing was ever going to send.
Seatics.addTicketData(${ticketDataJson});

// Required override per the guide — without it, clicking the widget's
// own "Buy" button throws instead of doing anything. tgID round-trips
// the ticketGroupId we passed into addTicketData above, so the parent
// page can find the matching row in its own list and continue the real
// purchase flow there (this component has no order form of its own).
Seatics.Presentation.redirectToCheckout = function (ticketGroup, quantity) {
  window.parent.postMessage({ type: 'seatics-buy', tgID: ticketGroup.tgID, quantity: quantity }, '*');
};
</script>
</body>
</html>`;

  return (
    <iframe
      title="Seat map"
      srcDoc={srcDoc}
      style={{ width: '100%', height: 900, border: '1px solid var(--tl-gray-200)', borderRadius: 12, marginBottom: 24 }}
    />
  );
}
