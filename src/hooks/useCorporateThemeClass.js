import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { stripLocalePrefix } from '../utils/locale';

// Toggles body.tl-corp-page so global chrome (Nav, Footer) can pick up the
// dark "Travellab Business" theme on /korporativ — see the .tl-corp-page
// overrides in global.css. Same locale-prefix-aware pattern as
// useSubpageClass.
export default function useCorporateThemeClass() {
  const location = useLocation();

  useEffect(() => {
    const isCorporate = stripLocalePrefix(location.pathname) === '/korporativ';
    document.body.classList.toggle('tl-corp-page', isCorporate);
  }, [location.pathname]);
}
