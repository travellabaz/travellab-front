import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { stripLocalePrefix } from '../utils/locale';

// Toggles body.tl-subpage exactly like the original router did — several
// CSS rules (nav-clearance padding on section tops, tours horizontal-scroll
// vs full grid, arrows, and the About page's extra stats block) key off
// this class rather than per-component props, so it's reused as-is.
// Locale prefix stripped first — otherwise /ru and /en's homepage
// (pathname "/ru", "/en") would be misdetected as a subpage, silently
// losing the tours horizontal-scroll layout and picking up the subpage-only
// nav-clearance/stats styling meant for actual inner pages.
export default function useSubpageClass() {
  const location = useLocation();

  useEffect(() => {
    const isHome = stripLocalePrefix(location.pathname) === '/';
    document.body.classList.toggle('tl-subpage', !isHome);
  }, [location.pathname]);
}
