const STORAGE_KEY = 'tl_referral_id';

// Captured once when a visitor lands on /r/:code (see ReferralRedirect.jsx)
// and kept until an actual signup consumes it — a visitor might browse the
// site for a while before registering, so this can't just live in memory.
export function setReferralId(code) {
  if (code) localStorage.setItem(STORAGE_KEY, code);
}

export function getReferralId() {
  return localStorage.getItem(STORAGE_KEY) || null;
}

export function clearReferralId() {
  localStorage.removeItem(STORAGE_KEY);
}
