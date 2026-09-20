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
  // A generous default — confirmed live this event's own real height
  // alone ranges from ~1400px to ~2300px across different loads (its
  // internal ticket panel never finishes loading, since our OAuth scope
  // doesn't cover it, and how far that gets before settling seems to
  // vary per load), so "generous" has to mean comfortably above the
  // worst case seen, not just above a typical one. Even so this is a
  // starting point, not a promise — see the growth window below, the
  // real backstop for whatever this default doesn't cover. Tried
  // measuring the real height off-screen first and revealing at the
  // final size in one step instead of guessing — worse: confirmed live
  // the map sometimes never rendered at all for tens of seconds
  // (browsers deprioritize rendering work for off-screen elements), and
  // when it did, the "measured" height came back as exactly the
  // off-screen iframe's own oversized ceiling rather than the real
  // content height. Simple and visible beats clever and hidden.
  const [height, setHeight] = useState(2400);
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
  // Height reports are only accepted for a short window after mount, not
  // forever, then locked — confirmed live both extremes are real bugs:
  // accepting only the very first one locked in a too-small height, since
  // the widget's content keeps growing for a couple of seconds after its
  // first report (its real height came back as 1924px while body/
  // documentElement briefly under-reported it well after that first
  // message had already locked things in); accepting every report forever
  // resizes the iframe — and reflows everything below it — indefinitely,
  // since the widget's own (permanently-loading, our OAuth scope doesn't
  // cover its ticket panel) right-hand list keeps re-laying-out for as
  // long as the map stays mounted. Growing (never shrinking) for the
  // first few seconds, then freezing, gets the real settled size without
  // chasing that indefinitely.
  useEffect(() => {
    const growUntil = Date.now() + 8000;
    const onMessage = (e) => {
      if (!e.data) return;
      if (e.data.type === 'seatics-wheel') {
        window.scrollBy(0, e.data.deltaY);
      } else if (e.data.type === 'seatics-height' && !heightLockedRef.current) {
        if (Date.now() >= growUntil) {
          heightLockedRef.current = true;
          return;
        }
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
// body/documentElement.scrollHeight alone isn't enough — confirmed live
// the widget's own root (.seatics) can be taller than either of those
// while they stay unchanged, since an absolutely-positioned element
// doesn't grow its own parent's scrollHeight. Checking .seatics directly
// (when it exists yet) catches that case too.
function reportHeight() {
  var seatics = document.querySelector('.seatics');
  var h = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    seatics ? seatics.getBoundingClientRect().height : 0
  );
  window.parent.postMessage({ type: 'seatics-height', height: h }, '*');
}
setInterval(reportHeight, 500);

// Confirmed live via screen recording (repeatedly, in a clean Incognito
// window too — not an extension conflict): the map doesn't just settle
// once and stay put. Its own JS keeps recalculating and rewriting the
// seating chart's transform in the background — frame to frame, the
// same load cycled through the full venue, the stage area, and a blank/
// off-screen position, with nothing the visitor did in between. Most
// likely tied to its internal ticket-price panel retrying forever (our
// OAuth scope doesn't cover it, see TicketNetwork email), each retry
// apparently re-triggering a fit/resize pass that doesn't always land
// somewhere sane. We can't stop that retry loop from here, but we can
// stop it from being visible: lock the chart's transform to the first
// value it settles on, and revert anything that changes it afterward
// unless it follows an actual click/touch inside the iframe (the +/-
// zoom buttons, a drag) within the last half second — genuine
// interaction still works, the widget's own unprompted rewrites don't.
// Also confirmed live, tracing the actual DOM: the huge container wasn't
// the seating chart needing that much room at all. .sea-map-inner (the
// SVG's direct parent) gets an explicit inline height set by the
// widget's own JS — 2599px in one load — while the two <svg> children it
// actually contains are a fixed ~670px tall. That mismatched inline
// height is what our earlier "measure the real content" fix was
// faithfully matching and growing the iframe to fit, not a genuine
// content requirement. Freezing it to the chart's real size (plus a
// little room for the zoom controls/branding link that sit alongside
// the SVG in the same container) removes that dead space instead of
// reserving it.
(function () {
  var lastGesture = 0;
  function markGesture() { lastGesture = Date.now(); }
  document.addEventListener('mousedown', markGesture, true);
  document.addEventListener('touchstart', markGesture, true);

  var svg = null;
  var lockedTransform = null;
  var guarding = false;
  var svgObserver = null;
  var zoomedOut = false;
  // Elements whose inline height we've capped, and what we've capped
  // each one to — a plain array since more than one needs this (see
  // finalizeLock: .sea-map-inner AND .list-ctn, the ticket-price panel
  // sitting next to the map, both need to stop being tall for the whole
  // row to actually shrink).
  var cappedHeights = [];

  function onTransformChanged() {
    if (guarding || !svg) return;
    var current = svg.style.transform;
    if (current === lockedTransform) return;
    if (Date.now() - lastGesture < 500) {
      // Real interaction (a zoom button, a drag) — accept the new state
      // as the new baseline to protect.
      lockedTransform = current;
      return;
    }
    guarding = true;
    svg.style.transform = lockedTransform;
    guarding = false;
  }

  function capHeight(el, px) {
    if (!el) return;
    var value = Math.ceil(px) + 'px';
    guarding = true;
    el.style.height = value;
    guarding = false;
    var entry = { el: el, value: value };
    cappedHeights.push(entry);
    var obs = new MutationObserver(function () {
      if (guarding) return;
      if (el.style.height === entry.value) return;
      guarding = true;
      el.style.height = entry.value;
      guarding = false;
    });
    obs.observe(el, { attributes: true, attributeFilter: ['style'] });
  }

  // Same scale, translate pinned to the top instead of wherever the
  // widget happened to place it — see zeroOutTranslateY's job here isn't
  // sizing (that's handled by capping .sea-map-inner below), just
  // getting the chart to actually sit inside the space we keep for it
  // instead of starting hundreds of pixels down and running off the
  // bottom.
  function zeroOutTranslateY(transform) {
    return transform.replace(/translate\(([^,]+),\s*[^)]+\)/, function (_, x) {
      return 'translate(' + x + ', 0px)';
    });
  }

  function finalizeLock() {
    lockedTransform = zeroOutTranslateY(svg.style.transform);
    guarding = true;
    svg.style.transform = lockedTransform;
    guarding = false;

    var mapInner = svg.closest('.sea-map-inner') || svg.parentElement;
    var targetHeight = Math.max(svg.getBoundingClientRect().height, 1) + 120; // +120: zoom controls/branding link room
    if (mapInner) capHeight(mapInner, targetHeight);

    // Confirmed live: .list-ctn (the widget's own ticket-price panel,
    // permanently stuck on a skeleton placeholder since it never
    // receives real ticket data — see addTicketData() in the
    // integration guide, a separate follow-up) sits in a flex row next
    // to the map and stretches to match whichever sibling is taller.
    // With .sea-map-inner now small, that stretch runs the other way —
    // .list-ctn's own runaway skeleton height was what the whole row
    // (and everything above it) was actually inheriting. Capping it
    // too, not just the map side, is what actually shrinks the block.
    var listCtn = document.querySelector('.list-ctn');
    if (listCtn) capHeight(listCtn, targetHeight);
  }

  function clickZoomOutThenLock(attemptsLeft) {
    var btn = document.getElementById('venue-map-zoom-out');
    var disabled = !btn || btn.classList.contains('sea-disabled');
    if (disabled || attemptsLeft <= 0) {
      finalizeLock();
      return;
    }
    markGesture();
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    setTimeout(function () { clickZoomOutThenLock(attemptsLeft - 1); }, 150);
  }

  function findAndWatchSvg() {
    var found = document.querySelector('.seatics svg') || document.querySelector('svg');
    if (!found) {
      requestAnimationFrame(findAndWatchSvg);
      return;
    }
    if (found !== svg) {
      if (svgObserver) svgObserver.disconnect();
      svg = found;
      lockedTransform = svg.style.transform;
      svgObserver = new MutationObserver(onTransformChanged);
      svgObserver.observe(svg, { attributes: true, attributeFilter: ['style'] });
      if (!zoomedOut) {
        zoomedOut = true;
        // A beat for the zoom-out button itself to exist/attach its own
        // handlers before the first simulated click.
        setTimeout(function () { clickZoomOutThenLock(20); }, 300);
      }
    }
    // Keep checking — confirmed live the widget can also swap in a whole
    // new <svg> element (not just restyle the old one) partway through a
    // retry cycle, which would silently orphan an observer bound to the
    // original node.
    setTimeout(findAndWatchSvg, 1000);
  }
  findAndWatchSvg();
})();
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
      // scrolling="no" — if the height guess above ever falls short of the
      // real content again despite the growth window, this keeps that a
      // clean crop instead of leaving the iframe with its own scrollbar
      // and scroll position, which anything inside it (an autofocus, a
      // scrollIntoView the widget does on load) could then move on its
      // own, under the visitor, independent of the page's own scroll —
      // another way to produce the same "the map moved by itself" report.
      scrolling="no"
      style={{ width: '100%', height, border: '1px solid var(--tl-gray-200)', borderRadius: 12, marginBottom: 24, overflow: 'hidden' }}
    />
  );
}
