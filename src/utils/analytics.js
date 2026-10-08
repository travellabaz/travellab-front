// Thin wrapper around the raw gtag.js loaded in index.html — nothing in
// src/ called window.gtag directly before this (confirmed by grep), so
// this is the first/only place custom GA4 events get fired from. Safe to
// call even before gtag has loaded (e.g. blocked by an ad blocker): a
// missing window.gtag is a no-op, not a thrown error.
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
