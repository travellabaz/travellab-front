import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from './LocalizedLink';
import LogoMark from './LogoMark';
import StoryIcon from '../utils/storyIcons.jsx';
import { SoundOnIcon, SoundOffIcon, CommentIcon, HeartIcon, SendIcon, CommentEmptyIcon } from './StoryActionIcons';
import { markCategoryViewed } from '../utils/storyViewed';
import { trackEvent } from '../utils/analytics';
import { pickManager, managerLabel } from '../utils/managers';
import { baseLikeCount, isStoryLiked, setStoryLiked } from '../utils/storyLikes';
import { fetchStoryComments, postStoryComment } from '../api/storyComments';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';

const LOOP_TOAST_MS = 2200;
const WHEEL_STEP_THRESHOLD = 40; // px of accumulated deltaY before one wheel "tick" counts as a step
const WHEEL_LOCK_MS = 600; // ignores further wheel input right after a step, so trackpad inertia can't skip several slides
const SWIPE_CLOSE_THRESHOLD = 80; // px of downward drag on the mobile sheet's handle/head before it closes

// "2 saat" style — mirrors utils/date.js's manual-table approach (that
// file's own comment: Intl/toLocaleString('az-AZ') doesn't have real
// Azerbaijani month names in browsers, same unreliability applies to
// relative-time formatting) via plain i18n keys instead.
function formatRelativeTime(isoDateTime, t) {
  const then = new Date(isoDateTime).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return t('stories.comments.timeNow');
  if (minutes < 60) return t('stories.comments.timeMinutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('stories.comments.timeHours', { count: hours });
  return t('stories.comments.timeDays', { count: Math.floor(hours / 24) });
}

// One slide's full UI — header (mute/close), media, bottom-left author+
// caption+CTA, right-side like/comment, comment panel. Every flattened
// story gets one of these mounted for the life of the viewer (not just
// the active one) because the feed is now a real scrollable list of
// full-height sections (see StoryViewer's own comment below), so each
// section needs to carry its own content rather than one shared set of
// floating overlays repointed at whichever story is "current".
function StorySlide({
  story, category, storyIdxInCat, domIndex, setSlideRef, isActive, isNear,
  muted, onToggleMute, onClose, goNext, commentsPortalRef, onCommentsOpenChange,
}) {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const { isAuthenticated, profile, logout } = useAuth();
  const { openAuth } = useModals();
  const videoRef = useRef(null);
  const dragStartYRef = useRef(null);
  const [liked, setLiked] = useState(() => isStoryLiked(story.id));
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Reyler (reviews) already shows testimonial content — commenting on a
  // review reads as redundant, so the whole comment feature (button,
  // count, panel, writing) is simply off for this one category.
  const commentsEnabled = category.id !== 'reyler';

  // Real backend comments, fetched once this slide first becomes active
  // (not eagerly for all ~150 mounted slides) — the same count this
  // fetch returns is exactly what the button badge and the panel list
  // both show, there's no separate "count" source to drift out of sync.
  useEffect(() => {
    if (!commentsEnabled || !isActive || commentsLoaded) return undefined;
    let cancelled = false;
    setCommentsLoading(true);
    fetchStoryComments(story.id)
      .then((list) => { if (!cancelled) { setComments(list); setCommentsLoaded(true); } })
      .finally(() => { if (!cancelled) setCommentsLoading(false); });
    return () => { cancelled = true; };
  }, [commentsEnabled, isActive, commentsLoaded, story.id]);

  // Scrolled away from this slide — close its panel (and tell the parent,
  // which uses this to show the desktop prev/next buttons again).
  useEffect(() => {
    if (!isActive && commentsOpen) {
      setCommentsOpen(false);
      onCommentsOpenChange?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Only the active slide's video actually plays — every other mounted
  // slide (including the ones kept "near" for preload) stays paused.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || story.type !== 'video') return undefined;
    if (isActive && !commentsOpen) video.play().catch(() => {});
    else video.pause();
  }, [isActive, commentsOpen, story.type]);

  const openManagerWhatsApp = (messageKey, params) => {
    const manager = pickManager();
    const text = t(messageKey, params);
    window.open('https://wa.me/' + manager.number + '?text=' + encodeURIComponent(text), '_blank');
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    if (category.id === 'endirimler') {
      trackEvent('story_click', { tour_id: story.id, position: storyIdxInCat });
    }
    onClose();
    navigate(story.link);
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
    e?.stopPropagation();
    setCommentsOpen((open) => {
      const next = !open;
      onCommentsOpenChange?.(next);
      return next;
    });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = commentDraft.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await postStoryComment(story.id, trimmed, () => { logout(); openAuth('login'); });
    setSubmitting(false);
    if (result.ok) {
      setComments((prev) => [...prev, result.comment]);
      setCommentDraft('');
    } else if (!result.sessionExpired) {
      setSubmitError(result.message || null);
    }
  };

  // Swipe-down-to-close on the mobile sheet's handle/head only — list
  // scrolling and the input below stay untouched.
  const handleSheetTouchStart = (e) => { dragStartYRef.current = e.touches[0].clientY; };
  const handleSheetTouchMove = (e) => {
    if (dragStartYRef.current == null) return;
    if (e.touches[0].clientY - dragStartYRef.current > SWIPE_CLOSE_THRESHOLD) {
      dragStartYRef.current = null;
      handleCommentToggle();
    }
  };
  const handleSheetTouchEnd = () => { dragStartYRef.current = null; };

  const likeCount = baseLikeCount(story.id) + (liked ? 1 : 0);
  const categoryLabel = t(`stories.categories.${category.id}`, category.label);

  return (
    <section
      className="tl-story-viewer-slide"
      data-domindex={domIndex}
      ref={(el) => setSlideRef(domIndex, el)}
    >
      <div className="tl-story-viewer-head">
        <div className="tl-story-viewer-head-actions">
          {story.type === 'video' && (
            <button type="button" className="tl-story-viewer-iconbtn" onClick={(e) => { e.stopPropagation(); onToggleMute(); }}>
              {muted ? <SoundOffIcon /> : <SoundOnIcon />}
            </button>
          )}
          <button type="button" className="tl-story-viewer-iconbtn" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="tl-story-viewer-media">
        {story.type === 'video' ? (
          isNear ? (
            <video
              ref={videoRef}
              src={story.media_url}
              className="tl-story-viewer-media-el"
              muted={muted}
              playsInline
              preload="auto"
              onEnded={goNext}
            />
          ) : (
            // Outside the active ±1 window: no <video src> at all, just a
            // same-sized placeholder — the "poster" stand-in the data
            // model doesn't carry a real thumbnail for (see stories.json).
            <div className="tl-story-viewer-media-placeholder" />
          )
        ) : (
          <img src={story.media_url} alt="" className="tl-story-viewer-media-el" loading="lazy" />
        )}
      </div>

      <div className="tl-story-viewer-bottom">
        <div className="tl-story-viewer-author">
          <span className="tl-story-viewer-author-avatar"><LogoMark /></span>
          <span className="tl-story-viewer-author-text">
            <strong>Travellab</strong>
            <span>{categoryLabel}{story.location ? ` · ${story.location}` : ''}</span>
          </span>
        </div>
        {story.caption && <p className="tl-story-viewer-caption">{story.caption}</p>}

        {/* Endirimlər is special-cased (each story has its own /tours/{id}
            link, not a fixed per-category destination like every other
            category); everything else reads category.cta, see stories.json. */}
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
      </div>

      <div className="tl-story-viewer-social">
        <button type="button" className={'tl-story-viewer-socialbtn' + (liked ? ' liked' : '')} onClick={handleLikeClick}>
          <HeartIcon filled={liked} />
        </button>
        <span className="tl-story-viewer-socialcount">{likeCount}</span>
        {commentsEnabled && (
          <>
            <button type="button" className={'tl-story-viewer-socialbtn' + (commentsOpen ? ' active' : '')} onClick={handleCommentToggle}>
              <CommentIcon />
            </button>
            {comments.length > 0 && <span className="tl-story-viewer-socialcount">{comments.length}</span>}
          </>
        )}
      </div>

      {commentsEnabled && commentsOpen && commentsPortalRef?.current && createPortal(
        <>
          <div className="tl-story-viewer-comments-backdrop" onClick={handleCommentToggle} />
          <div className="tl-story-viewer-comments" onClick={(e) => e.stopPropagation()}>
            <div
              className="tl-story-viewer-comments-dragzone"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div className="tl-story-viewer-comments-handle" />
              <div className="tl-story-viewer-comments-head">
                <strong>{t('stories.comments.title')}{comments.length > 0 ? ` · ${comments.length}` : ''}</strong>
                <button type="button" className="tl-story-viewer-comments-close" onClick={handleCommentToggle}>✕</button>
              </div>
            </div>
            <div className="tl-story-viewer-comments-list">
              {commentsLoading ? null : comments.length === 0 ? (
                <div className="tl-story-viewer-comments-emptystate">
                  <CommentEmptyIcon />
                  <strong>{t('stories.comments.emptyTitle')}</strong>
                  <span>{t('stories.comments.emptySubtitle')}</span>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="tl-story-viewer-comments-item">
                    <span className={'tl-story-viewer-comments-avatar' + (c.official ? ' official' : '')}>
                      {c.official ? <LogoMark /> : (c.authorName || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="tl-story-viewer-comments-body">
                      <div className="tl-story-viewer-comments-meta">
                        <span className="tl-story-viewer-comments-name">{c.authorName}</span>
                        {c.official && <span className="tl-story-viewer-comments-official-badge">Travellab</span>}
                        <span className="tl-story-viewer-comments-time">{formatRelativeTime(c.createdAt, t)}</span>
                      </div>
                      <p className="tl-story-viewer-comments-text">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {submitError && <p className="tl-story-viewer-comments-error">{submitError}</p>}
            {isAuthenticated ? (
              <form className="tl-story-viewer-comments-form" onSubmit={handleCommentSubmit}>
                <span className="tl-story-viewer-comments-form-avatar">{profile?.initials || '?'}</span>
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={t('stories.comments.placeholder')}
                  maxLength={500}
                />
                <button type="submit" className="tl-story-viewer-comments-send" disabled={!commentDraft.trim() || submitting}>
                  <SendIcon />
                </button>
              </form>
            ) : (
              <button type="button" className="tl-story-viewer-comments-login-btn" onClick={() => openAuth('login')}>
                {t('stories.comments.loginToComment')}
              </button>
            )}
          </div>
        </>,
        commentsPortalRef.current
      )}
    </section>
  );
}

// Fullscreen Reels/TikTok-style vertical feed across every category (not
// a separate modal per category) — rewritten from the earlier tap/swipe
// viewer to a real native-scroll feed: a single scrollable column with
// CSS scroll-snap, one full-height <section> per story. Touch devices
// get the browser's own drag-follows-finger + momentum + snap physics
// for free; desktop gets wheel/trackpad input manually throttled to one
// slide per gesture (see the wheel handler below) plus keyboard and the
// sidebar's visible up/down buttons. An IntersectionObserver (not scroll
// position math) decides which slide is "active" for playback/CTA/GA4
// purposes, per the spec this was redesigned against.
//
// Infinite loop: a clone of the last slide is prepended and a clone of
// the first slide is appended (domSlides), so scrolling past either end
// lands on a visual duplicate of the opposite end's content — then a
// silent, instant (non-smooth) scrollTop reset snaps the real DOM
// position back into the renderable range. Because the clone and the
// real slide render the exact same story, this swap is invisible; it
// only exists to keep scrolling from running off the end of the list.
//
// categories is still the same grouped shape StoriesSection.jsx fetches
// (stories.json, each category's own cta config) — flattened once into
// slides, the actual unit navigation now walks.
export default function StoryViewer({ categories, startCategoryIndex, startStoryId, onClose, onCategoryViewed }) {
  const { t } = useTranslation();

  const slides = useMemo(() => {
    const flat = [];
    categories.forEach((cat, catIdx) => {
      cat.stories.forEach((story, storyIdxInCat) => {
        flat.push({ story, category: cat, catIdx, storyIdxInCat, logicalIndex: flat.length });
      });
    });
    return flat;
  }, [categories]);

  // [clone(last), ...real slides..., clone(first)] — see the component
  // comment above. domIndex of a real slide is its logicalIndex + 1.
  const domSlides = useMemo(() => {
    if (slides.length === 0) return [];
    const head = { ...slides[slides.length - 1], domKey: 'head-clone' };
    const tail = { ...slides[0], domKey: 'tail-clone' };
    return [head, ...slides, tail];
  }, [slides]);

  const initialDomIndex = useMemo(() => {
    if (slides.length === 0) return 0;
    if (startStoryId) {
      const i = slides.findIndex((s) => s.story.id === startStoryId);
      if (i !== -1) return i + 1;
    }
    const i = slides.findIndex((s) => s.catIdx === startCategoryIndex);
    return (i === -1 ? 0 : i) + 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only the opening category/story matters — never re-derive mid-session

  const [activeDomIndex, setActiveDomIndex] = useState(initialDomIndex);
  // Starts unmuted — opening the viewer is itself the user gesture
  // autoplay-with-sound policies require, so this doesn't get blocked.
  const [muted, setMuted] = useState(false);
  const [loopToast, setLoopToast] = useState(null); // category label, or null
  // Whether the currently-active slide's comment panel is open — only
  // used to hide the desktop prev/next buttons so they don't collide
  // with the panel's screen space (see .tl-story-viewer-comments-portal
  // in global.css); the panel's own content/state lives in StorySlide.
  const [commentsOpen, setCommentsOpen] = useState(false);

  const feedRef = useRef(null);
  const slideRefs = useRef([]);
  const activeDomIndexRef = useRef(activeDomIndex);
  const loopToastTimeoutRef = useRef(null);
  const wheelAccumRef = useRef(0);
  const wheelLockRef = useRef(false);
  const commentsPortalRef = useRef(null);

  useEffect(() => { activeDomIndexRef.current = activeDomIndex; }, [activeDomIndex]);
  useEffect(() => () => clearTimeout(loopToastTimeoutRef.current), []);

  const setSlideRef = useCallback((domIdx, el) => {
    slideRefs.current[domIdx] = el;
  }, []);

  const scrollToDomIndex = useCallback((domIdx, behavior = 'smooth') => {
    const el = slideRefs.current[domIdx];
    const container = feedRef.current;
    if (!el || !container) return;
    if (behavior === 'smooth') container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    else container.scrollTop = el.offsetTop;
  }, []);

  // Jump straight to this domIndex on open, before the first paint — no
  // visible scroll animation from the top of the feed down to wherever
  // the opening category/story actually is.
  useLayoutEffect(() => {
    scrollToDomIndex(initialDomIndex, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = useCallback(() => {
    const next = Math.min(activeDomIndexRef.current + 1, domSlides.length - 1);
    scrollToDomIndex(next, 'smooth');
  }, [domSlides.length, scrollToDomIndex]);

  const goPrev = useCallback(() => {
    const prev = Math.max(activeDomIndexRef.current - 1, 0);
    scrollToDomIndex(prev, 'smooth');
  }, [scrollToDomIndex]);

  // Sidebar jump — straight to that category's first story, no transition
  // animation, same as the old per-category switch.
  const jumpToCategory = useCallback((catIdx) => {
    const i = slides.findIndex((s) => s.catIdx === catIdx);
    if (i !== -1) scrollToDomIndex(i + 1, 'auto');
  }, [slides, scrollToDomIndex]);

  // Decides which slide is "active" by actual visibility, not scroll
  // math — robust to native touch momentum, programmatic scrollTo, and
  // the instant loop-wrap resets below all landing slightly differently.
  useEffect(() => {
    const container = feedRef.current;
    if (!container || domSlides.length === 0) return undefined;
    const observer = new IntersectionObserver((entries) => {
      let best = null;
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        }
      }
      if (best) setActiveDomIndex(Number(best.target.dataset.domindex));
    }, { root: container, threshold: 0.6 });
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [domSlides]);

  // Landed on a clone (scrolled past either real end) — silently snap to
  // the real slide at the same content/position. Forward wrap (tail
  // clone, i.e. "looped back to the very first story") shows the same
  // toast the old viewer did; backward wrap stays silent, matching the
  // old goPrev's behavior.
  useEffect(() => {
    const container = feedRef.current;
    if (!container || domSlides.length === 0) return;
    if (activeDomIndex === 0) {
      const realLast = domSlides.length - 2;
      scrollToDomIndex(realLast, 'auto');
      setActiveDomIndex(realLast);
    } else if (activeDomIndex === domSlides.length - 1) {
      scrollToDomIndex(1, 'auto');
      setActiveDomIndex(1);
      clearTimeout(loopToastTimeoutRef.current);
      setLoopToast(domSlides[1].category);
      loopToastTimeoutRef.current = setTimeout(() => setLoopToast(null), LOOP_TOAST_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDomIndex, domSlides.length]);

  const activeSlideInfo = domSlides[activeDomIndex] ?? null;
  const activeLogical = activeSlideInfo?.logicalIndex;

  // Reached the last story of a category — record it as viewed (see
  // storyViewed.js) and let the row's rings update.
  useEffect(() => {
    if (!activeSlideInfo) return;
    const { category, storyIdxInCat } = activeSlideInfo;
    if (storyIdxInCat === category.stories.length - 1) {
      markCategoryViewed(category);
      onCategoryViewed?.(category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLogical]);

  // GA4 story_view — scoped to the Endirimlər category (the only one
  // backed by real tour_ids, see StoriesSection.jsx's tourToStoryItem).
  useEffect(() => {
    if (!activeSlideInfo) return;
    const { category, story, storyIdxInCat } = activeSlideInfo;
    if (category.id === 'endirimler') {
      trackEvent('story_view', { tour_id: story.id, position: storyIdxInCat });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLogical]);

  // Reflects the active story in the URL (?story=<id>) so a copied link
  // reopens on this one — replaceState, not pushState, so every slide
  // change doesn't grow browser history.
  useEffect(() => {
    if (!activeSlideInfo) return;
    const url = new URL(window.location.href);
    url.searchParams.set('story', activeSlideInfo.story.id);
    window.history.replaceState(window.history.state, '', url.toString());
  }, [activeLogical]);

  // One history entry for "the viewer is open" so the hardware/browser
  // back button closes it instead of navigating the page itself away.
  useEffect(() => {
    window.history.pushState({ tlStoryViewer: true }, '');
    const onPopState = () => onClose();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desktop/trackpad wheel: accumulate deltaY and advance exactly one
  // slide per gesture, then lock briefly — native scroll-snap alone
  // doesn't reliably stop trackpad inertia from skipping several slides
  // in one fling across browsers, so this takes over wheel input instead
  // of letting the container scroll natively from it. Touch input is
  // untouched (no listener here) and relies on CSS scroll-snap directly.
  useEffect(() => {
    const container = feedRef.current;
    if (!container) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      if (wheelLockRef.current) return;
      wheelAccumRef.current += e.deltaY;
      if (Math.abs(wheelAccumRef.current) > WHEEL_STEP_THRESHOLD) {
        if (wheelAccumRef.current > 0) goNext(); else goPrev();
        wheelAccumRef.current = 0;
        wheelLockRef.current = true;
        setTimeout(() => { wheelLockRef.current = false; }, WHEEL_LOCK_MS);
      }
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [goNext, goPrev]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, goNext, goPrev]);

  if (slides.length === 0) return null;

  const activeCatIdx = activeSlideInfo?.catIdx;

  return createPortal(
    <div className="tl-story-viewer">
      {/* Desktop-only, always-visible category list. */}
      <div className="tl-story-viewer-sidebar">
        <div className="tl-story-viewer-sidebar-title">{t('stories.sectionTitle')}</div>
        {categories.map((cat, i) => (
          cat.stories.length > 0 && (
            <button
              key={cat.id}
              type="button"
              className={'tl-story-viewer-sidebar-item' + (i === activeCatIdx ? ' active' : '')}
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
        <div className="tl-story-viewer-feed" ref={feedRef}>
          {domSlides.map((d, domIdx) => (
            <StorySlide
              key={(d.domKey ? d.domKey + '-' : '') + d.story.id}
              domIndex={domIdx}
              setSlideRef={setSlideRef}
              story={d.story}
              category={d.category}
              storyIdxInCat={d.storyIdxInCat}
              isActive={domIdx === activeDomIndex}
              isNear={Math.abs(domIdx - activeDomIndex) <= 1}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onClose={onClose}
              goNext={goNext}
              commentsPortalRef={commentsPortalRef}
              onCommentsOpenChange={setCommentsOpen}
            />
          ))}
        </div>

        {/* Portal target for the active slide's comment panel — a plain
            unstyled node so it doesn't visually interfere while closed;
            .tl-story-viewer-comments (rendered inside it only when open)
            does all its own positioning. Exists so the panel can escape
            .tl-story-viewer-feed's clipping (overflow-y:auto implicitly
            forces overflow-x non-visible too, per the CSS overflow spec —
            same issue .tl-story-viewer-social hit on desktop earlier). */}
        <div ref={commentsPortalRef} />

        {loopToast && (
          <div className="tl-story-viewer-toast">
            {t('stories.loopedToStart', { category: t(`stories.categories.${loopToast.id}`, loopToast.label) })}
          </div>
        )}

        {/* Desktop-only visible prev/next — same action as wheel/keyboard,
            just a visible click target next to the always-visible sidebar
            (touch devices rely on the native swipe instead). Hidden while
            a comment panel is open so it doesn't collide with the panel's
            screen space (see .tl-story-viewer-comments in global.css). */}
        {!commentsOpen && (
          <div className="tl-story-viewer-updown">
            <button type="button" className="tl-story-viewer-iconbtn" aria-label={t('stories.prev')} onClick={(e) => { e.stopPropagation(); goPrev(); }}>⌃</button>
            <button type="button" className="tl-story-viewer-iconbtn" aria-label={t('stories.next')} onClick={(e) => { e.stopPropagation(); goNext(); }}>⌄</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
