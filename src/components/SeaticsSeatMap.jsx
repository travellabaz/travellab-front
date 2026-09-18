import { useEffect, useState } from 'react';
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
      style={{ width: '100%', height: 480, border: '1px solid var(--tl-gray-200)', borderRadius: 12, marginBottom: 24 }}
    />
  );
}
