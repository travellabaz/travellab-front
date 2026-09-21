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
export default function SeaticsSeatMap({ eventId }) {
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
  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
<style>body{margin:0;font-family:sans-serif;}</style>
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
      style={{ width: '100%', height: 900, border: '1px solid var(--tl-gray-200)', borderRadius: 12, marginBottom: 24 }}
    />
  );
}
