import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import az from './locales/az.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

// Resources are static JSON imports (bundled at build time), not fetched
// over HTTP — lets both the client and prerender.mjs's SSR pass work with
// a fully synchronous i18next.init, no async-loading dance needed for a
// site this size. Language is driven entirely by the URL prefix (see
// LocaleFrame.jsx), never browser/geo auto-detection — no detector plugin.
export const SUPPORTED_LANGUAGES = ['az', 'ru', 'en'];
export const DEFAULT_LANGUAGE = 'az';

export const RESOURCES = { az: { translation: az }, ru: { translation: ru }, en: { translation: en } };

// Creates a fresh, isolated i18next instance per call rather than mutating
// one shared module-level singleton. entry-server.jsx's render(url) runs
// once per route inside prerender.mjs's build loop — a shared instance's
// changeLanguage() would risk one render's language leaking into another
// if that loop is ever parallelized (Promise.all etc.), so each SSR render
// gets its own instance instead. The client (entry-client.jsx) also uses
// this factory, just once at startup, then reuses that single instance via
// LocaleFrame's changeLanguage() on route changes (normal client-side
// behavior — only SSR needs full isolation per call).
export function initI18n(lang) {
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    resources: RESOURCES,
    lng: lang,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false }, // React already escapes
    returnEmptyString: false,
  });
  return instance;
}
