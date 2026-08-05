import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [authState, setAuthState] = useState({ open: false, tab: 'login' });
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const openAuth = useCallback((tab = 'login') => setAuthState({ open: true, tab }), []);
  const closeAuth = useCallback(() => setAuthState((s) => ({ ...s, open: false })), []);

  const value = useMemo(
    () => ({
      authOpen: authState.open,
      authTab: authState.tab,
      openAuth,
      closeAuth,
      privacyOpen,
      openPrivacy: () => setPrivacyOpen(true),
      closePrivacy: () => setPrivacyOpen(false),
      termsOpen,
      openTerms: () => setTermsOpen(true),
      closeTerms: () => setTermsOpen(false),
    }),
    [authState, privacyOpen, termsOpen, openAuth, closeAuth]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModals() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModals must be used within ModalProvider');
  return ctx;
}
