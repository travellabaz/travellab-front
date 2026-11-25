// Thin wrapper around the raw gtag.js loaded in index.html — nothing in
// src/ called window.gtag directly before this (confirmed by grep), so
// this is the first/only place custom GA4 events get fired from. Safe to
// call even before gtag has loaded (e.g. blocked by an ad blocker): a
// missing window.gtag is a no-op, not a thrown error.
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

// Google Tag Manager events (sign-ups, sent forms) for the marketing team.
// Called only after the action really succeeded, never on the click itself.
// Never put personal data (name, phone, e-mail) into the event.
export function pushDataLayer(event) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}
