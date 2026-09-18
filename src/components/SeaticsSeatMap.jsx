import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../api/client';

// Embeds TicketNetwork's Seatics/MapWidget interactive seat map for one
// event, per "Guide - Updating to the MapWidget3 API v2.1" (TicketNetwork,
// 2017) and the MapWidgetAPI swagger spec: load jQuery, the framework
// script, then the MapAndLayout script with websiteConfigId/consumerKey/
// eventId, and place the result in the page — "Remove any previous
// references to the MapWidget stylesheet. The API will automatically add
// the styles needed for the map and its components." No custom sizing,
// no click bridge back to our own ticket list — the widget is meant to be
// fully self-contained, and everything beyond this minimal embed was
// us guessing at behavior the docs never described.
//
// This is an old-style widget that renders itself via document.write from
// a <script src> tag it expects to be loaded at parse time — modern
// browsers silently ignore document.write() from a <script> appended
// dynamically after page load, so this can't just be a JS-created
// <script> tag on the page itself. An iframe with srcDoc sidesteps that:
// the markup (including its <script> tags) is parsed natively as that
// iframe's own document, exactly like a normal server-rendered page would
// be, so document.write works as the widget expects.
export default function SeaticsSeatMap({ eventId }) {
  const [config, setConfig] = useState(null);
  // A generous default, not a small one — every venue seen so far (ours
  // and, checked live, Expedia's own Seatics embed) settles between
  // ~750-1100px, so starting near the top of that range means growing
  // past it is rare, and the growth-jump when it does is small. Tried
  // measuring the real height off-screen first and revealing at the
  // final size in one step instead of guessing — worse on both counts:
  // confirmed live the map sometimes never rendered at all for tens of
  // seconds (browsers deprioritize rendering work for off-screen
  // elements), and when it did, the "measured" height came back as
  // exactly the off-screen iframe's own oversized ceiling rather than
  // the real content height. Simple and visible beats clever and hidden.
  const [height, setHeight] = useState(1100);
  const heightLockedRef = useRef(false);

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

  // Registered unconditionally (ahead of the early return below) — the map
  // isn't mounted until config loads, but the postMessage listener needs to
  // exist before it does so no wheel-scroll or height message from the
  // iframe's very first frame gets missed.
  //
  // Only the FIRST height report is ever applied (heightLockedRef) —
  // confirmed live that later ones do keep arriving as the widget's own
  // (permanently-loading, since our OAuth scope doesn't cover its ticket
  // panel) right-hand list keeps re-laying-out, and applying every one of
  // those would resize the iframe — and reflow everything below it on the
  // page — repeatedly under the visitor, which read as the exact same
  // "running away" complaint the sizing fix was meant to solve.
  useEffect(() => {
    const onMessage = (e) => {
      if (!e.data) return;
      if (e.data.type === 'seatics-wheel') {
        window.scrollBy(0, e.data.deltaY);
      } else if (e.data.type === 'seatics-height' && !heightLockedRef.current) {
        heightLockedRef.current = true;
        // max, not a plain set — never shrink below the safe default even
        // if a report somehow comes back smaller than it.
        setHeight((h) => Math.max(h, e.data.height));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!config || !eventId) return null;

  const mapUrl = `${config.baseUrl}/MapAndLayout?websiteConfigId=${config.websiteConfigId}&consumerKey=${encodeURIComponent(config.consumerKey)}&eventId=${eventId}`;

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
  // The widget opens on a "fly out" animation — starts zoomed in on the
  // stage, pans/scales out to the full venue over a couple of seconds
  // (its own CSS transitions, e.g. .venue-map's transition:.3s and
  // similar rules in light-desktop.css). Disabling all transitions/
  // animations inside the iframe skips straight to the settled final
  // view instead.
  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
<style>body{margin:0;font-family:sans-serif;}*{transition:none!important;animation:none!important;}</style>
<script>
// Seatics treats any wheel/trackpad scroll over the map as a zoom/pan
// command (confirmed against their own QA docs — expected behavior on
// their side, not something websiteConfigId can turn off). Since the
// iframe sits inline in the page, a visitor scrolling the page with the
// cursor resting over the map gets that scroll hijacked into the map
// zooming/panning out from under them instead — confirmed live via
// screen recording: the view silently pans from the full venue to the
// balcony section with the cursor motionless, nothing else on the page
// changing. Capturing wheel events here, before Seatics' own handler
// (registered on document in the capture phase, ahead of anything its
// own scripts add below), and forwarding the delta to the parent page
// turns that into a normal page scroll instead.
document.addEventListener('wheel', function (e) {
  e.preventDefault();
  e.stopPropagation();
  window.parent.postMessage({ type: 'seatics-wheel', deltaY: e.deltaY }, '*');
}, { passive: false, capture: true });

// Confirmed live: at Seatics' own minimum zoom (its "Zoom Out" control was
// already disabled — this is its full, uncropped venue view, not a
// "recommended section" focus), the rendered map is well over 1000px tall
// for this venue, while our iframe was a fixed 480px. With nothing telling
// visitors they could pan inside that cropped box, the wheel fix above
// (scroll-over-map now scrolls the page) left them unable to see the rest
// of the map at all. Reporting the real content height here and resizing
// the iframe to match — instead of guessing a fixed px value — means the
// whole venue renders at once, so there's nothing left to pan or crop.
function reportHeight() {
  var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  window.parent.postMessage({ type: 'seatics-height', height: h }, '*');
}
setInterval(reportHeight, 500);
</script>
</head>
<body>
<div id="seatics-map"></div>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="${config.frameworkUrl}"></script>
<script src="${mapUrl}"></script>
</body>
</html>`;

  return (
    <iframe
      title="Seat map"
      srcDoc={srcDoc}
      style={{ width: '100%', height, border: '1px solid var(--tl-gray-200)', borderRadius: 12, marginBottom: 24 }}
    />
  );
}
