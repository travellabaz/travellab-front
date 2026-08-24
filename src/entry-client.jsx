import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { ToursProvider } from './context/ToursContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { initI18n } from './i18n';
import { getLocaleFromPathname } from './utils/locale';
import './styles/global.css';

const root = document.getElementById('root');

// One instance for the whole client session — LocaleFrame switches its
// active language on navigation via i18n.changeLanguage() rather than
// this being recreated per route. Initial language matches whatever the
// prerendered/first-loaded URL already is, so hydration never mismatches
// what entry-server.jsx rendered for that same URL.
const i18n = initI18n(getLocaleFromPathname(window.location.pathname));

const app = (
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
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
      </BrowserRouter>
    </I18nextProvider>
  </StrictMode>
);

// Prerendered routes ship real markup inside #root (see entry-server.jsx +
// prerender.mjs) — hydrate it instead of throwing it away. Routes that
// weren't prerendered (there shouldn't be any, but just in case) fall
// back to a plain client render.
if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
