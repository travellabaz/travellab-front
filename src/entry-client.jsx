import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { ToursProvider } from './context/ToursContext';
import './styles/global.css';

const root = document.getElementById('root');

const app = (
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToursProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </ToursProvider>
      </AuthProvider>
    </BrowserRouter>
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
