import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const API_BASE = 'http://localhost:3000/api';

export type AppearanceMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
  theme: ResolvedTheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
  theme: 'dark',
  isDark: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppearanceMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  const resolveAndApply = useCallback((currentMode: AppearanceMode) => {
    const actual = currentMode === 'system' ? getSystemTheme() : currentMode;
    setResolvedTheme(actual);
    applyTheme(actual);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/settings/appearanceMode`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          const saved = data.value as AppearanceMode;
          if (saved === 'light' || saved === 'dark' || saved === 'system') {
            setModeState(saved);
            resolveAndApply(saved);
            return;
          }
        }
        setModeState('system');
        resolveAndApply('system');
      })
      .catch(() => {
        setModeState('system');
        resolveAndApply('system');
      });
  }, [resolveAndApply]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const actual = getSystemTheme();
      setResolvedTheme(actual);
      applyTheme(actual);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mode]);

  const setMode = (newMode: AppearanceMode) => {
    setModeState(newMode);
    resolveAndApply(newMode);
    fetch(`${API_BASE}/settings/appearanceMode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newMode }),
    }).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, theme: resolvedTheme, isDark: resolvedTheme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}