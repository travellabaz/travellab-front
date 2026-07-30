import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Toggles body.tl-subpage exactly like the original router did — several
// CSS rules (nav-clearance padding on section tops, tours horizontal-scroll
// vs full grid, arrows, and the About page's extra stats block) key off
// this class rather than per-component props, so it's reused as-is.
export default function useSubpageClass() {
  const location = useLocation();

  useEffect(() => {
    const isHome = location.pathname === '/';
    document.body.classList.toggle('tl-subpage', !isHome);
  }, [location.pathname]);
}
