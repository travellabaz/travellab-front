// Viewed/unviewed ring state lives in localStorage, not a backend — no
// user accounts needed for this. Key format is story_viewed_{category_id}
// per spec, value is the id of the last story in that category the
// visitor has actually reached. A category's ring goes gradient
// (unviewed) again once new stories get added past whatever id is
// stored, matching how Instagram's own highlight rings behave — "viewed"
// specifically means "caught up with everything currently there", not a
// one-time flag.
const KEY_PREFIX = 'story_viewed_';

function readLastViewedId(categoryId) {
  try {
    return localStorage.getItem(KEY_PREFIX + categoryId);
  } catch {
    return null;
  }
}

function writeLastViewedId(categoryId, storyId) {
  try {
    localStorage.setItem(KEY_PREFIX + categoryId, storyId);
  } catch {
    // Private browsing / storage disabled / quota — viewed-state just
    // won't persist across reloads; not worth surfacing an error for.
  }
}

export function isCategoryViewed(category) {
  if (!category.stories.length) return true;
  const lastStoryId = category.stories[category.stories.length - 1].id;
  return readLastViewedId(category.id) === lastStoryId;
}

export function markCategoryViewed(category) {
  if (!category.stories.length) return;
  writeLastViewedId(category.id, category.stories[category.stories.length - 1].id);
}
