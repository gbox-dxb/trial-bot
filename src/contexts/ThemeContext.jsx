import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { themes } from '@/lib/themes';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('themePreference');
    return saved && themes[saved] ? saved : 'dark';
  });

  const applyTheme = useCallback((themeName) => {
    const theme = themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  useEffect(() => {
    applyTheme(currentTheme);
    localStorage.setItem('themePreference', currentTheme);
  }, [currentTheme, applyTheme]);

  const value = {
    theme: currentTheme,
    setTheme: (newTheme) => {
      if (themes[newTheme]) {
        setCurrentTheme(newTheme);
      }
    },
    themeData: themes[currentTheme],
    availableThemes: Object.keys(themes)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}