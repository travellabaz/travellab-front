// Same "no backend yet" pattern as storyLikes.js — comments are real and
// interactive (not just a decorative count), but per-visitor only: each
// person sees their own comments on a story, persisted in localStorage,
// not a shared/global comment thread. Good enough for the feature to
// feel real today; swapping in a real backend later only means changing
// where these two functions read/write, not how the UI calls them.
const KEY_PREFIX = 'story_comments_';
const MAX_TEXT_LENGTH = 300;

function readComments(storyId) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + storyId);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getComments(storyId) {
  return readComments(storyId);
}

export function addComment(storyId, text) {
  const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH);
  if (!trimmed) return readComments(storyId);
  const next = [...readComments(storyId), { text: trimmed, ts: Date.now() }];
  try {
    localStorage.setItem(KEY_PREFIX + storyId, JSON.stringify(next));
  } catch {
    // Private browsing / storage disabled — the comment still shows for
    // this view, it just won't persist across reloads.
  }
  return next;
}
