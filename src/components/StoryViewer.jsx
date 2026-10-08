import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from './LocalizedLink';
import LogoMark from './LogoMark';
import StoryIcon from '../utils/storyIcons.jsx';
import { markCategoryViewed } from '../utils/storyViewed';
import { trackEvent } from '../utils/analytics';
import { pickManager, managerLabel } from '../utils/managers';
import { baseLikeCount, baseCommentCount, isStoryLiked, setStoryLiked } from '../utils/storyLikes';
import { getComments, addComment } from '../utils/storyComments';
import { BASE_URL } from '../data/pageMeta';

const DEFAULT_IMAGE_DURATION = 5; // seconds, per spec — used when a story doesn't set its own
const SWIPE_THRESHOLD = 60; // px of vertical movement before a touch counts as a next/prev swipe, not a tap
const DRAG_DEADZONE = 10; // px of movement (any direction) before a touch stops counting as a plain tap
const LOOP_TOAST_MS = 2200;

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

// Fullscreen, Instagram/TikTok-hybrid story viewer: one continuous feed
// across every category (not a separate modal per category) — swiping/
// scrolling past the last story of one category flows straight into the
// first story of the next, and the whole feed loops back to the very
// start once it runs out, rather than dead-ending. Redesigned from the
// original per-category-modal viewer per an explicit prototype + review
// round with the site owner (not a from-scratch guess at the UX).
//
// categories is still passed as the same grouped shape StoriesSection.jsx
// already fetches (stories.json, each category's own cta config) —
// flattened once here into a single ordered slide list, the actual unit
// this component now navigates.
export default function StoryViewer({ categories, startCategoryIndex, startStoryId, onClose, onCategoryViewed }) {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();

  // One entry per story, in category order — the single sequence goNext/
  // goPrev walk, wrapping at both ends (see below). categories themselves
  // never change while the viewer is open, so this only needs computing once.
  const slides = useMemo(() => {
    const flat = [];
    categories.forEach((cat, catIdx) => {
      cat.stories.forEach((story, storyIdxInCat) => {
        flat.push({ story, category: cat, catIdx, storyIdxInCat });
      });
    });
    return flat;
  }, [categories]);

  const initialIndex = useMemo(() => {
    if (startStoryId) {
      const i = slides.findIndex((s) => s.story.id === startStoryId);
      if (i !== -1) return i;
    }
    const i = slides.findIndex((s) => s.catIdx === startCategoryIndex);
    return i === -1 ? 0 : i;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only the opening category/story matters — never re-derive mid-session

  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0); // 0..1 within the current story
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [loopToast, setLoopToast] = useState(null); // category label, or null
  const [liked, setLiked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');
  const videoRef = useRef(null);
  const touchStartRef = useRef(null); // { x, y } at touchstart
  const swipingRef = useRef(false); // set once a touchmove is recognized as a vertical swipe
  const draggedRef = useRef(false); // set once a touchmove clears DRAG_DEADZONE, in any direction
  const loopToastTimeoutRef = useRef(null);

  const slide = slides[index];
  const category = slide?.category;
  const story = slide?.story;

  useEffect(() => () => clearTimeout(loopToastTimeoutRef.current), []);

  useEffect(() => {
    if (story) setLiked(isStoryLiked(story.id));
    // Closing the panel on every story change (not just loading that
    // story's own comments) avoids a stale "add a comment" box floating
    // over whatever's now on screen — reopen it fresh per story.
    setCommentsOpen(false);
    setCommentDraft('');
    if (story) setComments(getComments(story.id));
  }, [story]);

  // Reached the last story of a category — record it as viewed (see
  // storyViewed.js for what "viewed" means) and let the row's rings
  // update, same as before; just keyed off the flat slide now instead of
  // a separate catIndex/storyIndex pair.
  useEffect(() => {
    if (category && slide.storyIdxInCat === category.stories.length - 1) {
      markCategoryViewed(category);
      onCategoryViewed?.(category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // GA4 story_view — scoped to the Endirimlər category (the only one
  // backed by real tour_ids, see StoriesSection.jsx's tourToStoryItem);
  // the other 8 categories are static file-based content with nothing
  // meaningful to attribute a tour_id to.
  useEffect(() => {
    if (category?.id === 'endirimler' && story) {
      trackEvent('story_view', { tour_id: story.id, position: slide.storyIdxInCat });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const goNext = useCallback(() => {
    setIndex((i) => {
      const next = (i + 1) % slides.length;
      if (next === 0) {
        clearTimeout(loopToastTimeoutRef.current);
        setLoopToast(slides[0].category);
        loopToastTimeoutRef.current = setTimeout(() => setLoopToast(null), LOOP_TOAST_MS);
      }
      return next;
    });
  }, [slides]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides]);

  // Sidebar (desktop) / circle row jump — straight to that category's
  // first story, no transition animation (the continuous-feed model
  // replaced the old category-to-category cube flip entirely).
  const jumpToCategory = useCallback((catIdx) => {
    const i = slides.findIndex((s) => s.catIdx === catIdx);
    if (i !== -1) setIndex(i);
  }, [slides]);

  // Opening the comment panel should freeze auto-advance the same way
  // tap-and-hold does — a ref (not just reading `paused || commentsOpen`
  // directly) because the image-story tick loop below deliberately
  // doesn't restart on every pause toggle (see its own comment), so it
  // needs a value that stays current without re-running that effect.
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused || commentsOpen;
  }, [paused, commentsOpen]);

  // Drives the top progress segments for image stories (videos drive their
  // own via timeupdate below) — restarts from 0 every time the story
  // changes, ticking via rAF rather than a single CSS transition so pause
  // (see the tap-and-hold handling further down) can freeze it mid-way.
  // Deliberately NOT in the dependency array below: re-running this
  // effect on every pause toggle would reset progress to 0 each time,
  // which is exactly the visible glitch pausedRef avoids.
  useEffect(() => {
    setProgress(0);
    if (!story || story.type !== 'image') return undefined;
    const durationMs = (story.duration_seconds || DEFAULT_IMAGE_DURATION) * 1000;
    const start = performance.now();
    let elapsedBeforePause = 0;
    let frameId;

    const tick = (now) => {
      if (pausedRef.current) {
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
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

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
    if (paused || commentsOpen) video.pause();
    else video.play().catch(() => {});
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, commentsOpen]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goPrev();
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
    swipingRef.current = false;
    draggedRef.current = false;
  };

  // Vertical swipe down = next, up = prev — matches the prototype's own
  // "scroll down -> next story" description literally (not the TikTok/
  // Reels "swipe up for next" convention this started out copying).
  // Horizontal movement must never trigger navigation, even though the
  // tapzone buttons underneath are a plain left/right tap-to-advance —
  // without draggedRef, a horizontal/diagonal drag that ends over the
  // right tapzone would fire its onClick as if it were a clean tap on
  // "next", which reads as "swiping right also advances". draggedRef
  // marks "real movement happened, this was not a tap" the moment the
  // finger clears a small deadzone, independent of direction; onTouchEnd
  // uses it to suppress that fallback for every drag that isn't a
  // recognized vertical swipe, leaving genuine taps (no real movement)
  // as the only thing that still reaches the tapzones' own onClick.
  const onTouchMove = (e) => {
    const start = touchStartRef.current;
    if (!start || swipingRef.current) return;
    const t0 = e.touches[0];
    const dy = t0.clientY - start.y;
    const dx = t0.clientX - start.x;
    if (!draggedRef.current && (Math.abs(dy) > DRAG_DEADZONE || Math.abs(dx) > DRAG_DEADZONE)) {
      draggedRef.current = true;
    }
    if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      swipingRef.current = true;
      setPaused(true);
    }
  };

  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    const wasSwiping = swipingRef.current;
    const wasDragged = draggedRef.current;
    touchStartRef.current = null;
    swipingRef.current = false;
    draggedRef.current = false;
    setPaused(false);

    if (!start) return;

    if (wasSwiping) {
      e.preventDefault(); // suppress the synthetic click the tapzone underneath would otherwise fire
      const t0 = e.changedTouches[0];
      const dy = t0.clientY - start.y;
      if (dy > 0) goNext(); // swiped down -> next
      else goPrev(); // swiped up -> prev
      return;
    }

    if (wasDragged) {
      // Moved, but not a qualifying vertical swipe (e.g. mostly
      // horizontal) — a no-op, not a fallback tap. See the comment above.
      e.preventDefault();
    }
    // else: a genuine tap with no real movement — let it fall through to
    // the tapzone button's own onClick (left = prev, right = next).
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    if (category?.id === 'endirimler') {
      trackEvent('story_click', { tour_id: story.id, position: slide.storyIdxInCat });
    }
    onClose();
    navigate(story.link);
  };

  // "Zəng et" / WhatsApp — always a direct wa.me deep link, deliberately
  // NOT managers.js's own managerLink() (which falls back to a bare
  // tel: link on desktop — exactly the "macOS Chrome hands off to
  // FaceTime with no warning" problem contactManager()'s popup exists to
  // avoid elsewhere). A story is a quick, in-the-moment prompt, so
  // WhatsApp (web or app) opening immediately — on both mobile and
  // desktop — is the better flow here. Still the same round-robin
  // manager pool as everywhere else. Used for both Endirimlər's "Zəng
  // et" and Viza's "Müraciət et".
  const openManagerWhatsApp = (messageKey, params) => {
    const manager = pickManager();
    const text = t(messageKey, params);
    window.open('https://wa.me/' + manager.number + '?text=' + encodeURIComponent(text), '_blank');
  };

  const handleCallClick = (e) => {
    e.stopPropagation();
    openManagerWhatsApp('common.tourInterestMessage', { title: story.title || 'tur' });
  };

  const handleVizaApplyClick = (e) => {
    e.stopPropagation();
    openManagerWhatsApp('common.vizaInterestMessage');
  };

  const handleCtaLinkClick = (e) => {
    e.stopPropagation();
    onClose();
    navigate(category.cta.to);
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    setStoryLiked(story.id, next);
  };

  const handleCommentToggle = (e) => {
    e.stopPropagation();
    setCommentsOpen((open) => !open);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!commentDraft.trim()) return;
    setComments(addComment(story.id, commentDraft));
    setCommentDraft('');
  };

  if (!slide) return null;

  const likeCount = baseLikeCount(story.id) + (liked ? 1 : 0);
  const commentCount = baseCommentCount(story.id) + comments.length;
  const categoryLabel = t(`stories.categories.${category.id}`, category.label);

  return createPortal(
    <div
      className="tl-story-viewer"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Desktop-only, always-visible category list — replaces the old
          drag-to-preview side stack now that category switching isn't a
          gesture of its own anymore (it's just "jump to this category's
          first slide in the one continuous feed"). */}
      <div className="tl-story-viewer-sidebar">
        <div className="tl-story-viewer-sidebar-title">{t('stories.sectionTitle')}</div>
        {categories.map((cat, i) => (
          cat.stories.length > 0 && (
            <button
              key={cat.id}
              type="button"
              className={'tl-story-viewer-sidebar-item' + (i === slide.catIdx ? ' active' : '')}
              onClick={(e) => { e.stopPropagation(); jumpToCategory(i); }}
            >
              <span className="tl-story-viewer-sidebar-icon"><StoryIcon name={cat.cover_icon} /></span>
              <span className="tl-story-viewer-sidebar-name">{t(`stories.categories.${cat.id}`, cat.label)}</span>
              <span className="tl-story-viewer-sidebar-count">{cat.stories.length}</span>
            </button>
          )
        ))}
      </div>

      <div className="tl-story-viewer-stage">
        <div className="tl-story-viewer-progress">
          {category.stories.map((s, i) => (
            <div key={s.id} className="tl-story-viewer-seg">
              <div
                className="tl-story-viewer-seg-fill"
                style={{ width: i < slide.storyIdxInCat ? '100%' : i === slide.storyIdxInCat ? `${progress * 100}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        <div className="tl-story-viewer-head">
          <div className="tl-story-viewer-author">
            <span className="tl-story-viewer-author-avatar"><LogoMark /></span>
            <span className="tl-story-viewer-author-text">
              <strong>Travellab</strong>
              <span>{categoryLabel}{story.location ? ` · ${story.location}` : ''}</span>
            </span>
          </div>
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
          <StoryMedia story={story} mediaRef={videoRef} muted={muted} className="tl-story-viewer-media-el" />
        </div>

        {loopToast && (
          <div className="tl-story-viewer-toast">
            {t('stories.loopedToStart', { category: t(`stories.categories.${loopToast.id}`, loopToast.label) })}
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

        {/* Desktop-only up/down — same prev/next as the tapzones and
            swipe gesture, just a visible click target next to the
            always-visible sidebar (touch devices rely on the swipe). */}
        <div className="tl-story-viewer-updown">
          <button type="button" className="tl-story-viewer-iconbtn" aria-label={t('stories.prev')} onClick={(e) => { e.stopPropagation(); goPrev(); }}>⌃</button>
          <button type="button" className="tl-story-viewer-iconbtn" aria-label={t('stories.next')} onClick={(e) => { e.stopPropagation(); goNext(); }}>⌄</button>
        </div>

        {/* CTA row — Endirimlər is special-cased (each story has its own
            /tours/{id} link, not a fixed per-category destination like
            every other category); everything else reads category.cta,
            see stories.json. */}
        {category.id === 'endirimler' && story.link && (
          <div className="tl-story-viewer-cta-row">
            <button type="button" className="tl-story-viewer-linkbtn" onClick={handleLinkClick}>
              {t('stories.viewMore')} ↗
            </button>
            <button type="button" className="tl-story-viewer-linkbtn tl-story-viewer-callbtn" onClick={handleCallClick}>
              {managerLabel(t)}
            </button>
          </div>
        )}
        {category.id === 'viza' && category.cta && (
          <div className="tl-story-viewer-cta-row">
            <button type="button" className="tl-story-viewer-linkbtn" onClick={handleCtaLinkClick}>
              {t(category.cta.labelKey)} ↗
            </button>
            <button type="button" className="tl-story-viewer-linkbtn tl-story-viewer-callbtn" onClick={handleVizaApplyClick}>
              {t(category.cta.waLabelKey)}
            </button>
          </div>
        )}
        {category.id !== 'endirimler' && category.id !== 'viza' && category.cta && (
          <div className="tl-story-viewer-cta-row">
            <button type="button" className="tl-story-viewer-linkbtn" onClick={handleCtaLinkClick}>
              {t(category.cta.labelKey)} ↗
            </button>
          </div>
        )}

        {/* Like + comment — a child of the stage (not the outer viewer)
            so it positions relative to the actual media column, not the
            full viewport; the desktop sidebar means those aren't the
            same thing once >=1100px floats this just outside the
            stage's right edge instead of overlapping the photo (see
            global.css). Both are per-visitor-only, no shared backend
            yet (see utils/storyLikes.js / utils/storyComments.js): likes
            are a stable per-story base count plus a local +1 once
            tapped; comments are a real, working add-a-comment panel,
            just not visible to anyone else. */}
        <div className="tl-story-viewer-social">
          <button type="button" className={'tl-story-viewer-socialbtn' + (liked ? ' liked' : '')} onClick={handleLikeClick}>
            {liked ? '♥' : '♡'}
          </button>
          <span className="tl-story-viewer-socialcount">{likeCount}</span>
          <button type="button" className={'tl-story-viewer-socialbtn' + (commentsOpen ? ' active' : '')} onClick={handleCommentToggle}>
            💬
          </button>
          <span className="tl-story-viewer-socialcount">{commentCount}</span>
        </div>

        {commentsOpen && (
          <div className="tl-story-viewer-comments" onClick={(e) => e.stopPropagation()}>
            <div className="tl-story-viewer-comments-head">
              <strong>{t('stories.comments.title')}</strong>
              <button type="button" className="tl-story-viewer-comments-close" onClick={handleCommentToggle}>✕</button>
            </div>
            <div className="tl-story-viewer-comments-list">
              {comments.length === 0 ? (
                <p className="tl-story-viewer-comments-empty">{t('stories.comments.empty')}</p>
              ) : (
                comments.map((c, i) => (
                  <div key={i} className="tl-story-viewer-comments-item">
                    <strong>{t('stories.comments.you')}</strong>
                    <span>{c.text}</span>
                  </div>
                ))
              )}
            </div>
            <form className="tl-story-viewer-comments-form" onSubmit={handleCommentSubmit}>
              <input
                type="text"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder={t('stories.comments.placeholder')}
                maxLength={300}
              />
              <button type="submit" disabled={!commentDraft.trim()}>{t('stories.comments.send')}</button>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
