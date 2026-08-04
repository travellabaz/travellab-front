import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { GOOGLE_CLIENT_ID } from '../config/google';
import * as authApi from '../api/auth';

// Proactively suggests Google sign-in via Google's own "One Tap" UI — a
// small corner prompt that appears on its own for a visitor with an active
// Google session, without them having to open the login modal first.
// Google's SDK handles its own frequency capping (backs off if the visitor
// recently dismissed it), so this only needs to ask once per page load.
export default function GoogleOneTap() {
  const { isAuthenticated, loginSuccess } = useAuth();
  const { authOpen } = useModals();
  const promptedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated || authOpen || !GOOGLE_CLIENT_ID || promptedRef.current) return undefined;

    let cancelled = false;
    let attempts = 0;

    const handleCredential = async (response) => {
      try {
        const { ok, data } = await authApi.googleLogin(response.credential);
        if (ok) await loginSuccess(data.tokens.accessToken, data.tokens.refreshToken);
      } catch {
        // Passive suggestion, not a form the user is actively filling in —
        // a failure here shouldn't surface an error toast on its own.
      }
    };

    const tryPrompt = () => {
      if (cancelled) return;
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.prompt();
        promptedRef.current = true;
      } else if (attempts < 25) {
        attempts += 1;
        setTimeout(tryPrompt, 200);
      }
    };

    tryPrompt();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authOpen, loginSuccess]);

  return null;
}
