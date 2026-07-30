import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { ToursProvider } from './context/ToursContext';

// Used only at build time by prerender.mjs — renders each route to a
// static HTML string so crawlers and link-preview bots (which don't run
// JS) get real content instead of an empty <div id="root">.
export function render(url) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AuthProvider>
          <ToursProvider>
            <ModalProvider>
              <App />
            </ModalProvider>
          </ToursProvider>
        </AuthProvider>
      </StaticRouter>
    </StrictMode>
  );
}
