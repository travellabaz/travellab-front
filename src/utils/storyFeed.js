// Feed ordering for StoryViewer. Opening a category no longer just drops
// the visitor into the flat, fixed-order list of every story — instead
// the feed is built around the category they tapped:
//
//   1. Its own stories first, freshly ordered on every open (see
//      orderCategoryStories): new ones pinned/boosted to the top, the
//      rest shuffled, so a returning visitor doesn't get the same
//      sequence every time.
//   2. Every INTERLEAVE_EVERY of those, one story from a random other
//      category is slotted in (never the same category twice in a row),
//      so they mostly stay in what they chose but also see other
//      offers/services along the way.
//   3. Once the opened category runs out, the remaining categories follow
//      in their normal order (starting after the opened one, wrapping),
//      each ordered the same way, minus whatever was already shown as an
//      interleaved story — the feed still covers everything and still
//      loops (StoryViewer's clone trick) like before.

const INTERLEAVE_EVERY = 4;

// A story with an explicit "added_at": "YYYY-MM-DD" newer than this is
// pinned to the very top of its category, newest first (see
// public/stories/README.md).
const NEW_STORY_DAYS = 14;

// Stories without a date still get a head start: the last few entries in
// a category's array (new files are always appended there) are weighted
// this many times heavier in the shuffle, so they tend to surface early
// without always being in the exact same spot.
const RECENT_TAIL_SIZE = 5;
const RECENT_TAIL_WEIGHT = 4;

// Endirimlər is the live, backend-generated list sorted by nearest
// departure (see StoriesSection.jsx) — that order is meaningful, so it's
// never shuffled.
const FIXED_ORDER_CATEGORIES = new Set(['endirimler']);

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Weighted random order (Efraimidis–Spirakis): sort by u^(1/w) — heavier
// items tend to come first, but any order is still possible.
function weightedShuffle(items, weightOf) {
  return items
    .map((item) => ({ item, key: Math.random() ** (1 / weightOf(item)) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}

function addedAtTime(story) {
  if (!story.added_at) return null;
  const time = new Date(story.added_at).getTime();
  return Number.isNaN(time) ? null : time;
}

// Returns [{ story, storyIdxInCat }] — storyIdxInCat stays the story's
// original array index (GA4's story_view position relies on it).
export function orderCategoryStories(category) {
  const entries = category.stories.map((story, storyIdxInCat) => ({ story, storyIdxInCat }));
  if (FIXED_ORDER_CATEGORIES.has(category.id)) return entries;

  const cutoff = Date.now() - NEW_STORY_DAYS * 24 * 60 * 60 * 1000;
  const pinned = [];
  const rest = [];
  entries.forEach((e) => {
    const added = addedAtTime(e.story);
    if (added !== null && added >= cutoff) pinned.push({ ...e, added });
    else rest.push(e);
  });
  pinned.sort((a, b) => b.added - a.added);

  const tailStart = category.stories.length - RECENT_TAIL_SIZE;
  const shuffled = weightedShuffle(rest, (e) => (e.storyIdxInCat >= tailStart ? RECENT_TAIL_WEIGHT : 1));

  return [...pinned.map(({ added, ...e }) => e), ...shuffled];
}

// Returns the flat slide list StoryViewer renders:
// [{ story, category, catIdx, storyIdxInCat, logicalIndex, lastOfCategory }].
// startStoryId (opened from a "Son storilər" card or a ?story= link) goes
// first, ahead of the rest of its category.
export function buildStoryFeed(categories, primaryCatIdx, startStoryId = null) {
  const ordered = categories.map((cat) => orderCategoryStories(cat));
  const used = new Set();
  const flat = [];

  const push = (catIdx, entry) => {
    used.add(entry.story.id);
    flat.push({ ...entry, category: categories[catIdx], catIdx, logicalIndex: flat.length });
  };

  if (startStoryId) {
    const startIdx = ordered[primaryCatIdx]?.findIndex((e) => e.story.id === startStoryId) ?? -1;
    if (startIdx > 0) {
      const [start] = ordered[primaryCatIdx].splice(startIdx, 1);
      ordered[primaryCatIdx].unshift(start);
    }
  }

  // Interleave pools: every other category's stories in their freshly
  // shuffled order, consumed from the front.
  const pools = new Map();
  categories.forEach((cat, i) => {
    if (i !== primaryCatIdx && ordered[i].length > 0) pools.set(i, [...ordered[i]]);
  });
  let lastInterleaveCat = null;

  const primary = ordered[primaryCatIdx] || [];
  primary.forEach((entry, n) => {
    push(primaryCatIdx, entry);
    const isLastPrimary = n === primary.length - 1;
    if ((n + 1) % INTERLEAVE_EVERY !== 0 || isLastPrimary) return;
    const candidates = [...pools.keys()].filter((i) => pools.get(i).length > 0 && i !== lastInterleaveCat);
    if (candidates.length === 0) return;
    const catIdx = shuffle(candidates)[0];
    push(catIdx, pools.get(catIdx).shift());
    lastInterleaveCat = catIdx;
  });

  for (let step = 1; step < categories.length; step++) {
    const catIdx = (primaryCatIdx + step) % categories.length;
    ordered[catIdx].forEach((entry) => {
      if (!used.has(entry.story.id)) push(catIdx, entry);
    });
  }

  // A category counts as "viewed" (storyViewed.js) once the visitor
  // reaches its last appearance in this feed — with shuffling, that's no
  // longer simply its last array entry.
  const seenCats = new Set();
  for (let i = flat.length - 1; i >= 0; i--) {
    flat[i].lastOfCategory = !seenCats.has(flat[i].catIdx);
    seenCats.add(flat[i].catIdx);
  }
  return flat;
}
