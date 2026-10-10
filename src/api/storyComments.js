import { API_BASE, authFetch } from './client';
import { getLocaleFromPathname } from '../utils/locale';

function acceptLanguageHeader() {
  return { 'Accept-Language': getLocaleFromPathname(window.location.pathname) };
}

// Real, backend-shared comments (see StoryCommentController) — no
// decorative/local content anywhere in this module.
export async function fetchStoryComments(storyId) {
  const res = await fetch(API_BASE + '/story-comments/' + encodeURIComponent(storyId));
  if (!res.ok) return [];
  return res.json();
}

// Returns { ok: true, comment } on success, or { ok: false, message } on
// a 400 (too long/short, profanity, rate-limited) so the caller can show
// the backend's own localized reason — or { ok: false, sessionExpired:
// true } if the token died between page load and this call.
export async function postStoryComment(storyId, text, onSessionExpired) {
  const res = await authFetch(
    '/story-comments/' + encodeURIComponent(storyId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...acceptLanguageHeader() },
      body: JSON.stringify({ text }),
    },
    onSessionExpired
  );
  if (!res) return { ok: false, sessionExpired: true };
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data.message };
  }
  return { ok: true, comment: await res.json() };
}
