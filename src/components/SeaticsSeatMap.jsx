import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../api/client';

// Embeds TicketNetwork's Seatics/MapWidget interactive seat map for one
// event. This is an old-style widget that renders itself via
// document.write from a <script src> tag it expects to be loaded at parse
// time — modern browsers silently ignore document.write() from a <script>
// appended dynamically after page load, so this can't just be a JS-created
// <script> tag on the page itself. An iframe with srcDoc sidesteps that:
// the markup (including its <script> tags) is parsed natively as that
// iframe's own document, exactly like a normal server-rendered page would
// be, so document.write works as the widget expects.
//
// Seatics doesn't expose any postMessage/callback API for section clicks
// (checked their framework/js2 bundles — no postMessage, no
// window.parent calls anywhere), so onSectionSelect is wired up entirely
// on our side: the injected <script> below finds each section's <path
// id="sec_..."> once the map draws it (a MutationObserver, since those
// paths are added asynchronously by the widget's own scripts, well after
// this srcDoc first parses) and posts its id to the parent window on
// click. TicketNetworkEventsPage.jsx matches that id against ticketGroup
// section names to update the sidebar price, the same way Expedia's own
// embed of this widget drives its ticket list from map clicks.
export default function SeaticsSeatMap({ eventId, onSectionSelect }) {
  const [config, setConfig] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!onSectionSelect) return undefined;
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.source !== 'tl-seatics-map' || event.data?.type !== 'section-click') return;
      onSectionSelect(event.data.sectionId);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSectionSelect]);

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
  // Seatics' own framework script pulls several of its follow-up
  // resources (Css/customUI, Javascript/featureFlag, trackingProcessing,
  // riskified, etc.) over hardcoded http:// URLs — confirmed live that
  // the same host serves all of them over https:// too, so instead of
  // waiting on TicketNetwork to fix their SDK, upgrade-insecure-requests
  // has the browser silently rewrite those to https:// before sending,
  // avoiding the mixed-content block that was breaking the map in
  // Chrome/Edge (Brave doesn't enforce it as strictly, which is why the
  // map loaded there but nowhere else during testing).
  // Wires clicks on each section shape to the parent page without
  // touching Seatics' own click handling — it keeps whatever built-in
  // hover/select behavior it already has, this just adds a second
  // listener alongside it. Runs as a MutationObserver rather than a
  // one-shot querySelectorAll because the widget's own scripts draw
  // these <path> elements well after this document first parses.
  const clickBridgeScript = `
<style>path[id^="sec_"].tl-selected{stroke:#059669!important;stroke-width:3px!important;}</style>
<script>
(function(){
  function normalize(id){ return id.replace(/^sec_/,'').replace(/_/g,'').toLowerCase(); }
  var lastSelected = null;
  function wire(){
    var paths = document.querySelectorAll('path[id^="sec_"]');
    if (!paths.length) return false;
    paths.forEach(function(p){
      if (p.dataset.tlWired) return;
      p.dataset.tlWired = '1';
      p.style.cursor = 'pointer';
      p.addEventListener('click', function(){
        if (lastSelected) lastSelected.classList.remove('tl-selected');
        p.classList.add('tl-selected');
        lastSelected = p;
        window.parent.postMessage({ source: 'tl-seatics-map', type: 'section-click', sectionId: normalize(p.id) }, '*');
      });
    });
    return true;
  }
  if (wire()) return;
  // Coalesced via rAF rather than scanning on every single mutation —
  // a busy arena map (Seatics redrawing hover tooltips, zoom, etc.)
  // fires childList mutations continuously, and re-running
  // querySelectorAll on the whole document for each one froze the page
  // solid during testing. requestAnimationFrame batches any number of
  // mutations within a frame into one scan. The 20s hard timeout is a
  // second safety net independent of that: some venue/skin combos may
  // never draw a <path id="sec_..."> at all, and without it the
  // observer would keep running, and keep costing a scan per frame,
  // for the lifetime of the page.
  var scheduled = false;
  var obs = new MutationObserver(function(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function(){
      scheduled = false;
      if (wire()) obs.disconnect();
    });
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(function(){ obs.disconnect(); }, 20000);
})();
</script>`;

  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
<style>body{margin:0;font-family:sans-serif;}</style>
</head>
<body>
<div id="seatics-map"></div>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="${config.frameworkUrl}"></script>
<script src="${mapUrl}"></script>
${clickBridgeScript}
</body>
</html>`;

  return (
    <iframe
      ref={iframeRef}
      title="Seat map"
      srcDoc={srcDoc}
      style={{ width: '100%', height: 480, border: '1px solid var(--tl-gray-200)', borderRadius: 12, marginBottom: 24 }}
    />
  );
}
