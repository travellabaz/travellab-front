import { forwardRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getLocaleFromPathname, buildLocalizedPath } from '../utils/locale';

// Drop-in replacement for react-router-dom's <Link>: prefixes any
// absolute `to` ("/tours", "/viza/turkiye") with the current locale
// before handing off to the real Link. Absolute paths don't inherit
// route nesting in React Router — a plain <Link to="/tours"> rendered on
// /ru/... would navigate to /tours (AZ), silently dropping the locale.
// Relative `to` values and `to` objects pass through unchanged (already
// resolve correctly, and objects are rare enough here not to bother).
export default forwardRef(function LocalizedLink({ to, ...props }, ref) {
  const location = useLocation();
  const lang = getLocaleFromPathname(location.pathname);
  const localizedTo = typeof to === 'string' && to.startsWith('/') ? buildLocalizedPath(to, lang) : to;
  return <Link ref={ref} to={localizedTo} {...props} />;
});

// For imperative navigation (navigate('/tours/123')) in the same
// components — same rule as LocalizedLink above.
export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const lang = getLocaleFromPathname(location.pathname);
  return (to, options) => {
    const localizedTo = typeof to === 'string' && to.startsWith('/') ? buildLocalizedPath(to, lang) : to;
    navigate(localizedTo, options);
  };
}
