import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API = "";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { name, email, role }
  const [loading, setLoading] = useState(true);  // true while checking session

  // On mount — check if there's already a valid session cookie.
  // On the public marketing pages nothing depends on the result, so wait until the browser is idle
  // instead of competing with the initial page load.
  useEffect(() => {
    const checkSession = () =>
      fetch(`${API}/api/me`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.success) setUser(data.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));

    const isPublicPage = window.location.pathname === '/' || window.location.pathname === '/pure-joy';
    if (!isPublicPage) {
      checkSession();
      return;
    }
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
    const handle = idle(checkSession, { timeout: 3000 });
    return () => (window.cancelIdleCallback || clearTimeout)(handle);
  }, []);

  const loadUser = async () => {
    const meRes = await fetch(`${API}/api/me`, { credentials: 'include' });
    const meData = await meRes.json();
    if (meData?.success) setUser(meData.data);
    return meData.data;
  };

  const postJson = async (path, body) => {
    const res = await fetch(`${API}/api${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || 'Request failed');
      err.restart = !!data.restart; // the sign-in attempt is no longer valid: go back to the password step
      throw err;
    }
    return data;
  };

  // Step 1: password. Resolves to { otpRequired, challenge, emailHint } when a code was emailed,
  // or to the user when the server skipped the second step.
  const login = async (email, password) => {
    const data = await postJson('/login-password', { email, password });
    if (data.otpRequired) return { otpRequired: true, challenge: data.challenge, emailHint: data.emailHint };
    return loadUser();
  };

  // Step 2: the emailed code creates the session
  const verifyLoginOtp = async (challenge, otp) => {
    await postJson('/login-verify', { challenge, otp });
    return loadUser();
  };

  const resendLoginOtp = (challenge) => postJson('/login-resend', { challenge });

  const logout = async () => {
    await fetch(`${API}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, verifyLoginOtp, resendLoginOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
