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

// sign_up goes out at most once per browser session: a page reload, a second
// Google callback or a re-render never sends it again. The flag lives in
// sessionStorage; where the storage is blocked, a module flag still keeps it
// to one per page.
const SIGN_UP_FLAG = 'tl_signup_sent';
let signUpSent = false;

export function trackSignUp(method) {
  if (typeof window === 'undefined' || signUpSent) return;
  try {
    if (window.sessionStorage.getItem(SIGN_UP_FLAG)) return;
    window.sessionStorage.setItem(SIGN_UP_FLAG, '1');
  } catch {
    // no storage: the module flag below is the guard
  }
  signUpSent = true;
  pushDataLayer({ event: 'sign_up', method });
}
