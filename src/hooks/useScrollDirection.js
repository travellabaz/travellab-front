import { useEffect, useState } from 'react';

// 'up' | 'down' | null (null = at/near the top, hasn't scrolled far
// enough to have a direction yet). A minimum delta between samples
// avoids flipping on every 1px of momentum-scroll jitter; nearTopPx
// keeps the caller pinned to 'null' (treated as "show the default UI")
// until the visitor has actually scrolled away from the top.
const MIN_DELTA = 8;

export default function useScrollDirection(nearTopPx = 80) {
  const [direction, setDirection] = useState(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (y < nearTopPx) {
        setDirection(null);
      } else if (Math.abs(y - lastY) >= MIN_DELTA) {
        setDirection(y > lastY ? 'down' : 'up');
      }
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [nearTopPx]);

  return direction;
}
