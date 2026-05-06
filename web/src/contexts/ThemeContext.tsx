import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const API_BASE = 'http://localhost:3000/api';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  isDark: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    fetch(`${API_BASE}/settings/darkMode`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value !== null) {
          setThemeState(data.value === 'true' ? 'dark' : 'light');
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    fetch(`${API_BASE}/settings/darkMode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newTheme === 'dark' ? 'true' : 'false' }),
    }).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}
