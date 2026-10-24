import { API_BASE, authFetch, tokenStore } from './client';

// Tour package request → site-backend (TourRequestController), which
// saves it and notifies the Shop team's Telegram group. Fire-and-forget:
// the customer's WhatsApp to the tour manager opens regardless, so this
// never throws and nobody awaits it. Logged in → authFetch, so the
// backend can add the customer's phone; guest → plain fetch.
export function postTourRequest(request) {
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    keepalive: true,
  };
  const call = tokenStore.access ? authFetch('/tour-requests', opts) : fetch(API_BASE + '/tour-requests', opts);
  return Promise.resolve(call).catch(() => null);
}
