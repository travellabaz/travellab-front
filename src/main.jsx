import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { ToursProvider } from './context/ToursContext';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
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
