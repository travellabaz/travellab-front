import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { tokenStore } from '../api/client';
import { fetchProfile } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    tokenStore.clear();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!tokenStore.access) return;
    setLoading(true);
    try {
      const { cards, details } = await fetchProfile(logout);
      const initials = ((details.name || '?')[0] + (details.surname || '?')[0]).toUpperCase();
      const points = cards.point ? Number(cards.point).toFixed(0) : '0';
      const azn = cards.convertedAzn || '0';
      const referralLink = cards.link ? (cards.link.match(/https?:\/\/\S+/) || [''])[0] : '';
      setProfile({
        name: details.name || '',
        surname: details.surname || '',
        phone: details.phone || '',
        mail: details.mail || '',
        initials,
        points,
        azn,
        referralLink,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (tokenStore.access) refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginSuccess = useCallback(
    async (accessToken, refreshToken) => {
      tokenStore.set(accessToken, refreshToken);
      await refreshProfile();
    },
    [refreshProfile]
  );

  return (
    <AuthContext.Provider value={{ profile, loading, isAuthenticated: !!profile, loginSuccess, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
