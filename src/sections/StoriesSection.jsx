import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StoryIcon from '../utils/storyIcons.jsx';
import StoryViewer from '../components/StoryViewer';
import { isCategoryViewed } from '../utils/storyViewed';
import { API_BASE } from '../api/client';

// The one category (Endirimlər) that isn't file-based content — see
// GET /v1/tours/stories (TourStoryService, backend): auto-generated from
// live tours, nearest departure first, capped at 16, no admin panel or
// manual curation (none exists anywhere in this codebase yet). Every
// other category here still follows the static stories.json convention
// described below.
const LIVE_CATEGORY_ID = 'endirimler';

function tourToStoryItem(tour) {
  return {
    id: tour.id,
    type: 'image',
    media_url: API_BASE + tour.imageUrl,
    duration_seconds: 5,
    link: tour.link,
  };
}

// "Son storilər" — a mixed sample across categories, round-robin (one
// from each category in turn) rather than true chronological recency:
// almost none of the static stories.json content has a real timestamp to
// sort by, so "recent" here means "a representative mix of topics", per
// the redesign's own description. Copies each category's story array so
// shift() here never mutates the real data categories/StoryViewer use.
function buildStoryMix(categories, limit) {
  const pools = categories.map((c) => [...c.stories]);
  const mixed = [];
  let anyLeft = true;
  while (mixed.length < limit && anyLeft) {
    anyLeft = false;
    for (let i = 0; i < categories.length && mixed.length < limit; i++) {
      if (pools[i].length === 0) continue;
      anyLeft = true;
      mixed.push({ story: pools[i].shift(), category: categories[i] });
    }
  }
  return mixed;
}

const RECENT_MIX_LIMIT = 12;

// Instagram-style highlight row — file-based content (see
// /public/content/stories.json + /public/stories/), no admin panel or
// backend: the site owner edits the JSON directly via GitHub's web editor
// and a push to main redeploys it, same as everything else on this repo.
//
// Lazy by design: this only ever fetches the small stories.json (category
// list + cover icons) up front. A category's actual photos/videos are
// never requested until it's clicked — StoryViewer only renders the one
// category it was opened with, and only mounts each story's <img>/<video>
// once auto-advance actually reaches it.
export default function StoriesSection() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState(null); // null = still loading
  const [openCategoryIndex, setOpenCategoryIndex] = useState(null);
  const [openStoryId, setOpenStoryId] = useState(null); // set when opened from "Son storilər" — a specific story, not a category's first
  const [viewedTick, setViewedTick] = useState(0); // bumped to re-read localStorage after closing the viewer

  useEffect(() => {
    let cancelled = false;
    fetch('/content/stories.json')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const sorted = [...(data.categories || [])].sort((a, b) => a.order - b.order);
        setCategories(sorted);

        // Swap the Endirimlər category's static placeholder stories for
        // the live, auto-generated list once it arrives — the row renders
        // immediately with the static data so the page never waits on
        // this second request. A failed/empty fetch removes the category
        // entirely rather than leaving stale placeholder content up, per
        // the spec's "API cavab verməsə, bölmə gizlənir" rule.
        fetch(API_BASE + '/tours/stories')
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad status'))))
          .then((tours) => {
            if (cancelled) return;
            setCategories((prev) => {
              if (!tours || tours.length === 0) {
                return prev.filter((c) => c.id !== LIVE_CATEGORY_ID);
              }
              return prev.map((c) =>
                c.id === LIVE_CATEGORY_ID ? { ...c, stories: tours.map(tourToStoryItem) } : c
              );
            });
          })
          .catch((err) => {
            console.error('ActionLog.storiesSection.liveStoriesFailed', err);
            if (!cancelled) setCategories((prev) => prev.filter((c) => c.id !== LIVE_CATEGORY_ID));
          });
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!categories || categories.length === 0) return null;

  const recentMix = buildStoryMix(categories, RECENT_MIX_LIMIT);

  const openCategory = (index) => {
    setOpenStoryId(null);
    setOpenCategoryIndex(index);
  };

  const openStory = (catIndex, storyId) => {
    setOpenCategoryIndex(catIndex);
    setOpenStoryId(storyId);
  };

  const closeViewer = () => {
    setOpenCategoryIndex(null);
    setOpenStoryId(null);
    setViewedTick((v) => v + 1);
  };

  return (
    <section className="tl-story-section">
      <div className="tl-section" style={{ paddingBottom: 24 }}>
        <h2 className="tl-story-section-title">{t('stories.sectionTitle')}</h2>
        {/* Native touch/wheel scroll only — no prev/next buttons, the row
            fits all 9 categories on desktop anyway (see justify-content:
            space-between in global.css). */}
        <div className="tl-story-row">
          {categories.map((category, index) => {
            const hasStories = category.stories.length > 0;
            const viewed = !hasStories || isCategoryViewed(category);
            return (
              <button
                type="button"
                key={category.id}
                className="tl-story-item"
                disabled={!hasStories}
                onClick={() => openCategory(index)}
              >
                <span className={'tl-story-ring' + (viewed ? ' viewed' : '')}>
                  <span className={`tl-story-avatar tl-logo-color-${index % 4}`}>
                    <StoryIcon name={category.cover_icon} />
                  </span>
                </span>
                <span className="tl-story-label">{t(`stories.categories.${category.id}`, category.label)}</span>
              </button>
            );
          })}
        </div>

        {recentMix.length > 0 && (
          <>
            <h2 className="tl-story-section-title" style={{ marginTop: 28 }}>{t('stories.recentTitle')}</h2>
            <div className="tl-story-recent-row">
              {recentMix.map(({ story, category }) => (
                <button
                  type="button"
                  key={story.id}
                  className="tl-story-recent-card"
                  onClick={() => openStory(categories.indexOf(category), story.id)}
                >
                  {story.type === 'video' ? (
                    <video src={story.media_url} className="tl-story-recent-card-media" muted preload="metadata" />
                  ) : (
                    <img src={story.media_url} alt="" className="tl-story-recent-card-media" loading="lazy" />
                  )}
                  <span className="tl-story-recent-card-pill">{t(`stories.categories.${category.id}`, category.label)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {openCategoryIndex !== null && (
        <StoryViewer
          categories={categories}
          startCategoryIndex={openCategoryIndex}
          startStoryId={openStoryId}
          onClose={closeViewer}
          onCategoryViewed={() => setViewedTick((v) => v + 1)}
        />
      )}
    </section>
  );
}
