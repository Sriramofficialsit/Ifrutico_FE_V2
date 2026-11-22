import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Dashboard light / dark theme.
// Starts from the device setting; once the user picks one it is remembered on this browser.
// The class `sb-dark` goes on <body> (where `sb-app` already lives) so portalled modals and drawers follow it too.
const STORAGE_KEY = 'ifrutico-theme';
const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {}, setTheme: () => {} });

const systemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const savedTheme = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
};

export function ThemeProvider({ children }) {
  const [chosen, setChosen] = useState(savedTheme);   // null = follow the device
  const [system, setSystem] = useState(systemTheme);
  const theme = chosen || system;

  // Follow device changes until the user picks a theme themselves
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = (e) => setSystem(e.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    const body = document.body;
    // Short cross-fade when switching, without animating every hover afterwards
    body.classList.add('sb-theme-anim');
    body.classList.toggle('sb-dark', theme === 'dark');
    const t = setTimeout(() => body.classList.remove('sb-theme-anim'), 400);
    return () => clearTimeout(t);
  }, [theme]);

  const setTheme = useCallback((t) => {
    setChosen(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* private mode: still works for this visit */ }
  }, []);
  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
