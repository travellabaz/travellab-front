export const API_BASE = 'https://backend.travellab-point.az/site-backend/v1';

export const tokenStore = {
  get access() {
    return localStorage.getItem('tl_access');
  },
  get refresh() {
    return localStorage.getItem('tl_refresh');
  },
  set(access, refresh) {
    localStorage.setItem('tl_access', access);
    localStorage.setItem('tl_refresh', refresh);
  },
  clear() {
    localStorage.removeItem('tl_access');
    localStorage.removeItem('tl_refresh');
  },
};

async function refreshAccessToken() {
  try {
    const res = await fetch(API_BASE + '/auth/refresh-token', {
      method: 'POST',
      headers: { Authorization: tokenStore.refresh },
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokenStore.set(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// Authenticated fetch: attaches the access token, and on a 401 tries a
// single silent refresh-and-retry before giving up.
export async function authFetch(path, opts = {}, onSessionExpired) {
  opts.headers = opts.headers || {};
  opts.headers.Authorization = 'Bearer ' + tokenStore.access;
  let res = await fetch(API_BASE + path, opts);
  if (res.status === 401) {
    const ok = await refreshAccessToken();
    if (!ok) {
      tokenStore.clear();
      onSessionExpired?.();
      return null;
    }
    opts.headers.Authorization = 'Bearer ' + tokenStore.access;
    res = await fetch(API_BASE + path, opts);
  }
  return res;
}
