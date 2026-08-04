import { API_BASE, authFetch } from './client';
import { getReferralId } from '../utils/referral';

export function toApiPhone(localDigits) {
  return '994' + localDigits.replace(/\D/g, '');
}

export async function register({ name, surname, phone, mail, password, passwordConfirm }) {
  const res = await fetch(API_BASE + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      surname,
      clientType: 'PHYSICAL',
      phone: toApiPhone(phone),
      mail,
      password,
      passwordConfirm,
      referralId: getReferralId(),
    }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function login({ phone, password }) {
  const res = await fetch(API_BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: toApiPhone(phone), password }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

// idToken comes from Google Identity Services (see AuthModal.jsx /
// GoogleOneTap.jsx). Returns the same { clientType, tokens } shape as
// login()/register()+otpCheck(), so callers feed it into loginSuccess() the
// same way. referralId only actually matters the first time this email
// signs up — the backend ignores it when linking/logging into an existing
// account.
export async function googleLogin(idToken) {
  const res = await fetch(API_BASE + '/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, referralId: getReferralId() }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function otpCheck(sessionId, otp) {
  const res = await fetch(API_BASE + '/auth/otp/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'session-id': sessionId },
    body: JSON.stringify({ otp }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function resendOtp(sessionId) {
  try {
    await fetch(API_BASE + '/auth/otp/resend', {
      method: 'POST',
      headers: { 'session-id': sessionId },
    });
  } catch {
    /* best-effort, matches original behaviour */
  }
}

export async function forgotPassword(phone) {
  const res = await fetch(API_BASE + '/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: toApiPhone(phone) }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function setPassword({ phone, password, passwordConfirm }) {
  const res = await fetch(API_BASE + '/auth/set-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, passwordConfirm }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function fetchProfile(onSessionExpired) {
  const [cardsRes, detailsRes] = await Promise.all([
    authFetch('/lab-cards', { headers: { 'Content-Type': 'application/json' } }, onSessionExpired),
    authFetch('/clients/details', {}, onSessionExpired),
  ]);
  let cards = {};
  let details = {};
  if (cardsRes && cardsRes.ok) cards = await cardsRes.json();
  if (detailsRes && detailsRes.ok) details = await detailsRes.json();
  return { cards, details };
}
