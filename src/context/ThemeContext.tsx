import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'light' | 'dark' | 'midnight' | 'emerald' | 'system';

interface ThemeContextType {
  theme: AppTheme;
  resolvedTheme: 'light' | 'dark' | 'midnight' | 'emerald';
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('extratopixelnexo_theme') as AppTheme | null;
    return saved || 'light';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedTheme = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    localStorage.setItem('extratopixelnexo_theme', theme);
    
    // Update root classes & attributes
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-light', 'theme-dark', 'theme-midnight', 'theme-emerald');
    root.setAttribute('data-theme', resolvedTheme);

    if (resolvedTheme === 'dark') {
      root.classList.add('dark', 'theme-dark');
    } else if (resolvedTheme === 'midnight') {
      root.classList.add('dark', 'theme-midnight');
    } else if (resolvedTheme === 'emerald') {
      root.classList.add('dark', 'theme-emerald');
    } else {
      root.classList.add('theme-light');
    }
  }, [theme, resolvedTheme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
