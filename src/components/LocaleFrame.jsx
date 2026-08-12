import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Mounted once per locale branch in App.jsx's <Routes> (see the /ru/*,
// /en/*, /* layout routes). Syncs the shared i18next instance's active
// language to whichever branch is currently matched, and sets
// <html lang>. SSR doesn't rely on this effect at all — entry-server.jsx
// creates a fresh, already-correctly-languaged i18next instance per
// render() call (see src/i18n/index.js), so a static/prerendered page is
// never wrong before hydration; this only handles client-side navigation
// between locale branches after that.
export default function LocaleFrame({ lang }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang, i18n]);

  return <Outlet />;
}
