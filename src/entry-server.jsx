import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { ToursProvider } from './context/ToursContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { initI18n } from './i18n';
import { getLocaleFromPathname } from './utils/locale';

// Used only at build time by prerender.mjs — renders each route to a
// static HTML string so crawlers and link-preview bots (which don't run
// JS) get real content instead of an empty <div id="root">.
//
// A fresh i18next instance per call (not a shared module-level one) —
// prerender.mjs calls render() once per route (AZ/RU/EN variants of
// every page), and a shared instance's changeLanguage() would risk one
// render's language leaking into another if that loop ever runs calls
// concurrently. See src/i18n/index.js.
export function render(url) {
  const i18n = initI18n(getLocaleFromPathname(url));
  return renderToString(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <StaticRouter location={url}>
          <AuthProvider>
            <ToursProvider>
              <ModalProvider>
                <CartProvider>
                  <WishlistProvider>
                    <App />
                  </WishlistProvider>
                </CartProvider>
              </ModalProvider>
            </ToursProvider>
          </AuthProvider>
        </StaticRouter>
      </I18nextProvider>
    </StrictMode>
  );
}
