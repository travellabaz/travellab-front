import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from './LocalizedLink';
import { markCategoryViewed } from '../utils/storyViewed';

const DEFAULT_IMAGE_DURATION = 5; // seconds, per spec — used when a story doesn't set its own
const SWIPE_DOWN_CLOSE_THRESHOLD = 80; // px

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
  const videoRef = useRef(null);
  const imageTimerRef = useRef(null);
  const touchStartRef = useRef(null);

  const category = categories[catIndex];
  const story = category?.stories[storyIndex];

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
    setCatIndex(nextCatIndex);
    setStoryIndex(atLastStory ? nextCategory.stories.length - 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, onClose]);

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
  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t0 = e.changedTouches[0];
    const dx = t0.clientX - start.x;
    const dy = t0.clientY - start.y;
    touchStartRef.current = null;
    if (dy > SWIPE_DOWN_CLOSE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) onClose();
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    onClose();
    navigate(story.link);
  };

  if (!category || !story) return null;

  return createPortal(
    <div
      className="tl-story-viewer"
      onTouchStart={onTouchStart}
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

      <div className="tl-story-viewer-media">
        {story.type === 'video' ? (
          <video
            key={story.id}
            ref={videoRef}
            src={story.media_url}
            className="tl-story-viewer-media-el"
            muted={muted}
            playsInline
            autoPlay
          />
        ) : (
          <img key={story.id} src={story.media_url} alt="" className="tl-story-viewer-media-el" />
        )}
      </div>

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
