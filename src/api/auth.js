import { API_BASE, authFetch } from './client';
import { getReferralId } from '../utils/referral';
import { getLocaleFromPathname } from '../utils/locale';

// Backend error/response messages (e.g. "Yanlış telefon və ya şifrə")
// are localized server-side by Accept-Language — read straight from the
// URL rather than threaded through every call site as a parameter, same
// self-computing pattern as LocalizedLink.
function acceptLanguageHeader() {
  return { 'Accept-Language': getLocaleFromPathname(window.location.pathname) };
}

export function toApiPhone(localDigits) {
  return '994' + localDigits.replace(/\D/g, '');
}

export async function register({ name, surname, phone, mail, password, passwordConfirm }) {
  const res = await fetch(API_BASE + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...acceptLanguageHeader() },
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
    headers: { 'Content-Type': 'application/json', ...acceptLanguageHeader() },
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
    headers: { 'Content-Type': 'application/json', ...acceptLanguageHeader() },
    body: JSON.stringify({ idToken, referralId: getReferralId() }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function otpCheck(sessionId, otp) {
  const res = await fetch(API_BASE + '/auth/otp/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'session-id': sessionId, ...acceptLanguageHeader() },
    body: JSON.stringify({ otp }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function resendOtp(sessionId) {
  try {
    await fetch(API_BASE + '/auth/otp/resend', {
      method: 'POST',
      headers: { 'session-id': sessionId, ...acceptLanguageHeader() },
    });
  } catch {
    /* best-effort, matches original behaviour */
  }
}

export async function forgotPassword(phone) {
  const res = await fetch(API_BASE + '/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...acceptLanguageHeader() },
    body: JSON.stringify({ phone: toApiPhone(phone) }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function setPassword({ phone, password, passwordConfirm }) {
  const res = await fetch(API_BASE + '/auth/set-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...acceptLanguageHeader() },
    body: JSON.stringify({ phone, password, passwordConfirm }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

// Links a phone onto the CURRENTLY authenticated client (Google/mail
// sign-ups have none) — see AddPhoneModal.jsx. Distinct from register()'s
// OTP session: this one requires a bearer token, hence authFetch.
export async function requestPhoneLink(phone, onSessionExpired) {
  const res = await authFetch(
    '/clients/phone-link/request',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...acceptLanguageHeader() },
      body: JSON.stringify({ phone: toApiPhone(phone) }),
    },
    onSessionExpired
  );
  const data = res ? await res.json().catch(() => ({})) : {};
  return { ok: !!res && res.ok, data };
}

export async function confirmPhoneLink(sessionId, otp, onSessionExpired) {
  const res = await authFetch(
    '/clients/phone-link/confirm',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'session-id': sessionId, ...acceptLanguageHeader() },
      body: JSON.stringify({ otp }),
    },
    onSessionExpired
  );
  const data = res ? await res.json().catch(() => ({})) : {};
  return { ok: !!res && res.ok, data };
}

export async function fetchProfile(onSessionExpired) {
  const [cardsRes, detailsRes] = await Promise.all([
    authFetch('/lab-cards', { headers: { 'Content-Type': 'application/json', ...acceptLanguageHeader() } }, onSessionExpired),
    authFetch('/clients/details', { headers: acceptLanguageHeader() }, onSessionExpired),
  ]);
  let cards = {};
  let details = {};
  if (cardsRes && cardsRes.ok) cards = await cardsRes.json();
  if (detailsRes && detailsRes.ok) details = await detailsRes.json();
  return { cards, details };
}
