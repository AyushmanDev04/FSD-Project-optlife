import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);


export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('habitTheme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('habitTheme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((previous) => (previous === 'light' ? 'dark' : 'light'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
