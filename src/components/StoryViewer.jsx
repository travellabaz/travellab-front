import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from './LocalizedLink';
import { markCategoryViewed } from '../utils/storyViewed';
import StoryIcon from '../utils/storyIcons.jsx';

const DEFAULT_IMAGE_DURATION = 5; // seconds, per spec — used when a story doesn't set its own
const SWIPE_DOWN_CLOSE_THRESHOLD = 80; // px
const DRAG_START_THRESHOLD = 10; // px of horizontal movement before a touch counts as a category drag, not a tap
const DRAG_COMPLETE_RATIO = 0.35; // fraction of the media width the drag must cross to commit the category switch
const NEXT_CATEGORY_PREVIEW_COUNT = 2; // how many upcoming categories peek in on desktop
const CATEGORY_TRANSITION_MS = 480; // settle/commit animation duration — also used for the instant (non-drag) jumps below

function StoryMedia({ story, mediaRef, muted, className }) {
  return story.type === 'video' ? (
    <video
      key={story.id}
      ref={mediaRef}
      src={story.media_url}
      className={className}
      muted={muted}
      playsInline
      autoPlay
    />
  ) : (
    <img key={story.id} src={story.media_url} alt="" className={className} />
  );
}

// Fullscreen Instagram-style story viewer. Only ever mounted for the one
// category the visitor actually clicked (see StoriesSection.jsx) — that's
// what keeps this lazy: no other category's photos/videos exist in the
// DOM (or get requested over the network) until each is reached by
// auto-advance, at which point a plain <img>/<video> tag for it mounts
// for the first time.
export default function StoryViewer({ categories, startCategoryIndex, onClose, onCategoryViewed }) {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const [catIndex, setCatIndex] = useState(startCategoryIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within the current story
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  // Cube-rotate preview for a category-to-category jump only (never a
  // same-category story advance) — { direction, targetIndex, category,
  // story, outStory, progress, animate }. `progress` (0..1) is driven
  // 1:1 by the finger while dragging (`animate: false`, no CSS easing —
  // see onTouchMove) and then eased to its final 0 or 1 on release
  // (`animate: true`) once the gesture is classified as committed or
  // cancelled (see onTouchEnd). The same shape is reused for the
  // instant, non-drag jumps (auto-advance past a category's last story,
  // the desktop next-category preview) — those just skip straight to
  // an animated 0→1 with no live-tracked phase (see goToCategory).
  const [drag, setDrag] = useState(null);
  const videoRef = useRef(null);
  const imageTimerRef = useRef(null);
  const touchStartRef = useRef(null); // { x, y } at touchstart
  const dragActiveRef = useRef(null); // set once a touchmove is recognized as a category drag
  const dragSettleTimeoutRef = useRef(null);
  const mediaBoxRef = useRef(null); // for measuring drag progress against the media box's actual width

  const category = categories[catIndex];
  const story = category?.stories[storyIndex];

  useEffect(() => () => clearTimeout(dragSettleTimeoutRef.current), []);

  const findAdjacentCategory = useCallback((dir) => {
    let i = catIndex + dir;
    while (i >= 0 && i < categories.length) {
      if (categories[i].stories.length) return { index: i, category: categories[i] };
      i += dir;
    }
    return null;
  }, [categories, catIndex]);

  // Reached the end of a category's stories — record it as viewed (see
  // storyViewed.js for what "viewed" means) and let the row's rings update.
  useEffect(() => {
    if (category && storyIndex === category.stories.length - 1) {
      markCategoryViewed(category);
      onCategoryViewed?.(category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catIndex, storyIndex]);

  const goToCategory = useCallback((nextCatIndex, atLastStory) => {
    if (nextCatIndex < 0 || nextCatIndex >= categories.length) {
      onClose();
      return;
    }
    const nextCategory = categories[nextCatIndex];
    if (!nextCategory.stories.length) {
      // Skip empty categories entirely rather than showing a blank viewer.
      goToCategory(atLastStory ? nextCatIndex - 1 : nextCatIndex + 1, atLastStory);
      return;
    }
    // A real jump to a different category — cube-flip the story that was
    // on screen away, out of view (see .tl-story-cube-* CSS). Advancing
    // between stories *within* one category stays a plain instant swap.
    if (nextCatIndex !== catIndex && category && story) {
      const direction = nextCatIndex > catIndex ? 'next' : 'prev';
      const targetStory = nextCategory.stories[atLastStory ? nextCategory.stories.length - 1 : 0];
      dragActiveRef.current = null;
      clearTimeout(dragSettleTimeoutRef.current);
      setDrag({ direction, targetIndex: nextCatIndex, category: nextCategory, story: targetStory, outStory: story, progress: 0, animate: false });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDrag((d) => (d ? { ...d, progress: 1, animate: true } : d));
        });
      });
      dragSettleTimeoutRef.current = setTimeout(() => setDrag(null), CATEGORY_TRANSITION_MS);
    }
    setCatIndex(nextCatIndex);
    setStoryIndex(atLastStory ? nextCategory.stories.length - 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, onClose, catIndex, category, story]);

  const goNext = useCallback(() => {
    if (!category) return;
    if (storyIndex < category.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else {
      goToCategory(catIndex + 1, false);
    }
  }, [category, storyIndex, catIndex, goToCategory]);

  const goPrev = useCallback(() => {
    if (!category) return;
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (catIndex > 0) {
      goToCategory(catIndex - 1, true);
    }
  }, [category, storyIndex, catIndex, goToCategory]);

  // Drives the top progress segments for image stories (videos drive their
  // own via timeupdate below) — restarts from 0 every time the story
  // changes, ticking via rAF rather than a single CSS transition so pause
  // (see the tap-and-hold handling further down) can freeze it mid-way.
  useEffect(() => {
    setProgress(0);
    if (!story || story.type !== 'image') return undefined;
    const durationMs = (story.duration_seconds || DEFAULT_IMAGE_DURATION) * 1000;
    const start = performance.now();
    let elapsedBeforePause = 0;
    let frameId;

    const tick = (now) => {
      if (paused) {
        frameId = requestAnimationFrame(tick);
        return;
      }
      const elapsed = elapsedBeforePause + (now - start);
      const ratio = Math.min(1, elapsed / durationMs);
      setProgress(ratio);
      if (ratio >= 1) {
        goNext();
        return;
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    imageTimerRef.current = { cancel: () => cancelAnimationFrame(frameId) };
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catIndex, storyIndex]);

  // Video stories: progress + auto-advance come from the element itself,
  // not a timer — its real duration is whatever it actually is.
  useEffect(() => {
    const video = videoRef.current;
    if (!story || story.type !== 'video' || !video) return undefined;
    const onTimeUpdate = () => {
      if (video.duration) setProgress(video.currentTime / video.duration);
    };
    const onEnded = () => goNext();
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    if (paused) video.pause();
    else video.play().catch(() => {});
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catIndex, storyIndex, paused]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, goNext, goPrev]);

  const onTouchStart = (e) => {
    const t0 = e.touches[0];
    touchStartRef.current = { x: t0.clientX, y: t0.clientY };
  };

  // Cube-rotates live with the finger once a horizontal drag is
  // recognized — see the `drag` state comment above. A plain tap (no
  // recognized drag) falls through untouched to the tapzone buttons'
  // own onClick (goPrev/goNext), same as before.
  const onTouchMove = (e) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t0 = e.touches[0];
    const dx = t0.clientX - start.x;
    const dy = t0.clientY - start.y;

    if (!dragActiveRef.current) {
      if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < DRAG_START_THRESHOLD) return;
      const dir = dx < 0 ? 1 : -1;
      const adjacent = findAdjacentCategory(dir);
      if (!adjacent) return; // nothing to preview in that direction — leave the drag inert
      dragActiveRef.current = {
        direction: dir === 1 ? 'next' : 'prev',
        targetIndex: adjacent.index,
        category: adjacent.category,
        story: adjacent.category.stories[0],
      };
      setPaused(true);
    }

    const active = dragActiveRef.current;
    const width = mediaBoxRef.current?.clientWidth || window.innerWidth;
    const dragProgress = Math.max(0, Math.min(1, Math.abs(dx) / width));
    setDrag({
      direction: active.direction,
      targetIndex: active.targetIndex,
      category: active.category,
      story: active.story,
      outStory: story,
      progress: dragProgress,
      animate: false,
    });
  };

  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    const active = dragActiveRef.current;
    touchStartRef.current = null;
    dragActiveRef.current = null;

    if (active) {
      // Suppress the synthetic click the tapzone button underneath would
      // otherwise fire — a drag (committed or cancelled) is never also a tap.
      e.preventDefault();
      setPaused(false);
      const t0 = e.changedTouches[0];
      const dx = t0.clientX - start.x;
      const width = mediaBoxRef.current?.clientWidth || window.innerWidth;
      const dragProgress = Math.max(0, Math.min(1, Math.abs(dx) / width));
      const commit = dragProgress >= DRAG_COMPLETE_RATIO;
      clearTimeout(dragSettleTimeoutRef.current);
      setDrag((d) => (d ? { ...d, progress: commit ? 1 : 0, animate: true } : d));
      dragSettleTimeoutRef.current = setTimeout(() => {
        if (commit) {
          setCatIndex(active.targetIndex);
          setStoryIndex(0);
        }
        setDrag(null);
      }, CATEGORY_TRANSITION_MS);
      return;
    }

    if (!start) return;
    const t0 = e.changedTouches[0];
    const dx = t0.clientX - start.x;
    const dy = t0.clientY - start.y;
    if (dy > SWIPE_DOWN_CLOSE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    }
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    onClose();
    navigate(story.link);
  };

  if (!category || !story) return null;

  // Desktop-only peek at what's coming up (see .tl-story-viewer-next-stack,
  // hidden below the desktop breakpoint) — lets a visitor jump straight to
  // e.g. "Endirimlər" without clicking through every remaining story in
  // the category they're currently on, mirroring Instagram's web viewer.
  const upcomingCategories = [];
  for (let i = catIndex + 1; i < categories.length && upcomingCategories.length < NEXT_CATEGORY_PREVIEW_COUNT; i++) {
    if (categories[i].stories.length > 0) upcomingCategories.push({ index: i, category: categories[i] });
  }

  return createPortal(
    <div
      className="tl-story-viewer"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="tl-story-viewer-progress">
        {category.stories.map((s, i) => (
          <div key={s.id} className="tl-story-viewer-seg">
            <div
              className="tl-story-viewer-seg-fill"
              style={{ width: i < storyIndex ? '100%' : i === storyIndex ? `${progress * 100}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      <div className="tl-story-viewer-head">
        <span className="tl-story-viewer-label">{t(`stories.categories.${category.id}`, category.label)}</span>
        <div className="tl-story-viewer-head-actions">
          {story.type === 'video' && (
            <button type="button" className="tl-story-viewer-iconbtn" onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}>
              {muted ? '🔇' : '🔊'}
            </button>
          )}
          <button type="button" className="tl-story-viewer-iconbtn" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="tl-story-viewer-media" ref={mediaBoxRef}>
        {drag ? (
          <>
            <div
              className={`tl-story-cube-face tl-story-cube-outgoing tl-story-cube-${drag.direction}`}
              style={{
                transform: `rotateY(${(drag.direction === 'next' ? -90 : 90) * drag.progress}deg)`,
                transitionDuration: drag.animate ? `${CATEGORY_TRANSITION_MS}ms` : '0ms',
              }}
            >
              <StoryMedia story={drag.outStory} muted className="tl-story-viewer-media-el" />
            </div>
            <div
              className={`tl-story-cube-face tl-story-cube-incoming tl-story-cube-${drag.direction}`}
              style={{
                transform: `rotateY(${(drag.direction === 'next' ? 90 : -90) * (1 - drag.progress)}deg)`,
                transitionDuration: drag.animate ? `${CATEGORY_TRANSITION_MS}ms` : '0ms',
              }}
            >
              <StoryMedia story={drag.story} muted={muted} className="tl-story-viewer-media-el" />
            </div>
          </>
        ) : (
          <StoryMedia story={story} mediaRef={videoRef} muted={muted} className="tl-story-viewer-media-el" />
        )}
      </div>

      {upcomingCategories.length > 0 && (
        <div className="tl-story-viewer-next-stack">
          {upcomingCategories.map(({ index, category: nextCat }, depth) => (
            <button
              type="button"
              key={nextCat.id}
              className={`tl-story-viewer-next-item tl-story-viewer-next-depth-${depth}`}
              onClick={(e) => {
                e.stopPropagation();
                goToCategory(index, false);
              }}
            >
              <span className="tl-story-viewer-next-avatar">
                <StoryIcon name={nextCat.cover_icon} />
              </span>
              <span className="tl-story-viewer-next-label">{t(`stories.categories.${nextCat.id}`, nextCat.label)}</span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="tl-story-viewer-tapzone tl-story-viewer-tapzone-left"
        aria-label={t('stories.prev')}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onClick={goPrev}
      />
      <button
        type="button"
        className="tl-story-viewer-tapzone tl-story-viewer-tapzone-right"
        aria-label={t('stories.next')}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onClick={goNext}
      />

      {story.link && (
        <button type="button" className="tl-story-viewer-linkbtn" onClick={handleLinkClick}>
          {t('stories.viewMore')} ↗
        </button>
      )}
    </div>,
    document.body
  );
}
