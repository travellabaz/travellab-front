// Like counts are decorative for now — no backend tracks them yet (see
// StoryViewer.jsx's comment on the redesign this came from: real,
// shared counts are explicitly a later step). This still makes the
// button feel real rather than purely cosmetic: a deterministic base
// count per story (so it's stable across reloads and visitors without
// needing any stored data) plus a per-visitor +1, remembered in
// localStorage, once they actually tap it — same "no accounts needed"
// pattern as storyViewed.js.
const KEY_PREFIX = 'story_liked_';

// Simple string hash (no crypto needed, just needs to be stable and
// reasonably spread) — same count every time for the same story id, so
// it doesn't visibly jump around on every reload.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function baseLikeCount(storyId) {
  return 60 + (hash(storyId + '_likes') % 380); // 60-439
}

export function isStoryLiked(storyId) {
  try {
    return localStorage.getItem(KEY_PREFIX + storyId) === '1';
  } catch {
    return false;
  }
}

export function setStoryLiked(storyId, liked) {
  try {
    if (liked) localStorage.setItem(KEY_PREFIX + storyId, '1');
    else localStorage.removeItem(KEY_PREFIX + storyId);
  } catch {
    // Private browsing / storage disabled — the tap still visually
    // registers for this view, it just won't persist across reloads.
  }
}
