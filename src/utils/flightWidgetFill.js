// Pre-fills the persistent Travelpayouts search widget's destination field
// on /ucuslar/:route landing pages, so a visitor arriving from
// "Bakı-İstanbul aviabiletləri" lands with İstanbul already selected
// instead of an empty form.
//
// There's no documented URL-param pre-fill for this widget (checked both
// Travelpayouts' "Widget type" and "Page type" white-label docs — pre-fill
// is a dashboard-level default for the whole widget instance, not a
// per-page/per-URL feature) and origin/destination_iata query params are
// silently ignored. This instead drives the widget's own UI exactly the
// way a visitor would: type into its real <input>, let its own
// autocomplete (#tpwl-modals, a sibling shadow host) return suggestions,
// then click the one matching the route's IATA code — confirmed live that
// this reaches the same internal state a manual selection would (the
// field shows the picked city+code, not just typed text).
//
// Fragile by nature (undocumented DOM, hashed CSS-module class names that
// can change on any Travelpayouts widget update) — see the two-tier
// selector below for how failures degrade instead of silently doing
// nothing.

const SEARCH_HOST_ID = 'tpwl-search';
const MODALS_HOST_ID = 'tpwl-modals';
const INPUT_WAIT_MS = 6000;
const SUGGESTIONS_WAIT_MS = 4000;
const POLL_INTERVAL_MS = 100;

function waitFor(getValue, timeoutMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const value = getValue();
      if (value) return resolve(value);
      if (Date.now() - start >= timeoutMs) return resolve(null);
      setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();
  });
}

// The widget is a React app of its own — setting .value directly (as a
// plain DOM write) doesn't touch its internal state, so its own onChange
// handler never fires. Going through the native setter first, then
// dispatching a real "input" event, is what tricks React (or whatever
// the widget uses) into seeing it exactly like a real keystroke.
function setNativeInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function findDestinationInput() {
  const host = document.getElementById(SEARCH_HOST_ID);
  const root = host?.shadowRoot;
  if (!root) return null;
  return Array.from(root.querySelectorAll('input')).find((i) => i.name === 'destination') || null;
}

// Picks the suggestion button matching the route's own IATA code
// (data-testid="place-option-<CODE>", set by the widget itself) when
// present; otherwise falls back to the first non-"related airport" entry,
// which is consistently the city-level suggestion Travelpayouts puts
// first (e.g. "Paris, Fransa" before "Paris Orli") — better than doing
// nothing if this route's code doesn't match what the widget calls it.
function pickSuggestionButton(modalsRoot, iataCode) {
  const exact = modalsRoot.querySelector(`[data-testid="place-option-${iataCode}"]`);
  if (exact) return exact.closest('button');
  const buttons = Array.from(modalsRoot.querySelectorAll('button[class*="PlaceOption-module__root"]'));
  return buttons.find((b) => !/relatedAirport/.test(b.className)) || buttons[0] || null;
}

// destinationTerm: the plain city name typed into the field (e.g.
// "Istanbul") — what actually drives the widget's own autocomplete
// lookup. destinationIata: the code used to pick the right suggestion
// once the list appears (see pickSuggestionButton above).
export async function fillFlightWidgetDestination(destinationTerm, destinationIata) {
  const input = await waitFor(findDestinationInput, INPUT_WAIT_MS);
  if (!input) return false;

  input.focus();
  setNativeInputValue(input, destinationTerm);

  const modalsRoot = await waitFor(() => document.getElementById(MODALS_HOST_ID)?.shadowRoot, SUGGESTIONS_WAIT_MS);
  if (!modalsRoot) return false;

  const button = await waitFor(() => pickSuggestionButton(modalsRoot, destinationIata), SUGGESTIONS_WAIT_MS);
  if (!button) return false;

  button.click();
  return true;
}
