import { useEffect } from 'react';

// Robust cross-browser body scroll lock. Plain `overflow:hidden` on body
// alone doesn't reliably stop scroll/bounce on iOS Safari (well-known
// limitation) — combined with a position:fixed bottom sheet and iOS's own
// dynamic address-bar show/hide as the (still-scrollable) page moves
// underneath, that's what was making the account menu visibly "jump"
// while open on a real iPhone. Pinning body in place with a negative top
// offset (then restoring the real scroll position on close) is the
// standard fix for this whole bug class.
export default function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = { position: style.position, top: style.top, width: style.width, overflow: style.overflow };
    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.width = '100%';
    style.overflow = 'hidden';
    return () => {
      style.position = prev.position;
      style.top = prev.top;
      style.width = prev.width;
      style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
