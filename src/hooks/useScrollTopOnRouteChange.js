import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// The original only reset scroll on hashchange (not on first paint) —
// same here: skip the very first render, then jump to top on every
// subsequent navigation.
export default function useScrollTopOnRouteChange() {
  const location = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [location.pathname]);
}
