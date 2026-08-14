import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StoryIcon from '../utils/storyIcons.jsx';
import StoryViewer from '../components/StoryViewer';
import { isCategoryViewed } from '../utils/storyViewed';

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
  const [viewedTick, setViewedTick] = useState(0); // bumped to re-read localStorage after closing the viewer

  useEffect(() => {
    let cancelled = false;
    fetch('/content/stories.json')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const sorted = [...(data.categories || [])].sort((a, b) => a.order - b.order);
        setCategories(sorted);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!categories || categories.length === 0) return null;

  return (
    <section className="tl-story-section">
      <div className="tl-section" style={{ paddingBottom: 24 }}>
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
                onClick={() => setOpenCategoryIndex(index)}
              >
                <span className={'tl-story-ring' + (viewed ? ' viewed' : '')}>
                  <span className="tl-story-avatar">
                    <StoryIcon name={category.cover_icon} />
                  </span>
                </span>
                <span className="tl-story-label">{t(`stories.categories.${category.id}`, category.label)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {openCategoryIndex !== null && (
        <StoryViewer
          categories={categories}
          startCategoryIndex={openCategoryIndex}
          onClose={() => {
            setOpenCategoryIndex(null);
            setViewedTick((v) => v + 1);
          }}
          onCategoryViewed={() => setViewedTick((v) => v + 1)}
        />
      )}
    </section>
  );
}
