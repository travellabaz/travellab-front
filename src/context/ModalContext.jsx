import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [authState, setAuthState] = useState({ open: false, tab: 'login' });
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [managerContact, setManagerContact] = useState({ open: false, manager: null });

  const openAuth = useCallback((tab = 'login') => setAuthState({ open: true, tab }), []);
  const closeAuth = useCallback(() => setAuthState((s) => ({ ...s, open: false })), []);
  // Desktop's "Zəng et" (Call) actions used to navigate straight to a
  // tel: link, which macOS Chrome hands off to FaceTime — jarring, and
  // not something the user asked for. This modal shows the picked
  // manager's name/number instead, so calling (if the visitor wants to)
  // is their own deliberate click on a real tel: link inside it, not an
  // automatic redirect.
  const openManagerContact = useCallback((manager) => setManagerContact({ open: true, manager }), []);
  const closeManagerContact = useCallback(() => setManagerContact((s) => ({ ...s, open: false })), []);

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
      managerContactOpen: managerContact.open,
      managerContactManager: managerContact.manager,
      openManagerContact,
      closeManagerContact,
    }),
    [authState, privacyOpen, termsOpen, managerContact, openAuth, closeAuth, openManagerContact, closeManagerContact]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModals() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModals must be used within ModalProvider');
  return ctx;
}
