import { useState, useEffect, useContext, createContext } from 'react';
import { STATUS_CONFIG, STATUS_CONFIG_LIGHT } from '../constants/status';

export const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {}, statusConfig: STATUS_CONFIG });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('pp_theme') || 'light'; } catch { return 'light'; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    try { localStorage.setItem('pp_theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const statusConfig = theme === 'light' ? STATUS_CONFIG_LIGHT : STATUS_CONFIG;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, statusConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

/* ------------------------------------------------------------------ */
/*  ACTIVIDAD — resaltado de tarjetas con cambios no vistos            */
/* ------------------------------------------------------------------ */
