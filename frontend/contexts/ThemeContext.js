import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

const lightTheme = {
  background: '#FFFFFF',
  surface: '#F9F9F9',
  border: '#E5E5E5',
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textMuted: '#BBBBBB',
  primary: '#000000',
  primaryText: '#FFFFFF',
  accent: '#007AFF',
  danger: '#FF3B30',
  statusBar: 'dark-content',
};

const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  border: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textTertiary: '#777777',
  textMuted: '#555555',
  primary: '#FFFFFF',
  primaryText: '#000000',
  accent: '#0A84FF',
  danger: '#FF453A',
  statusBar: 'light-content',
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (user?.settings?.theme) {
      setIsDark(user.settings.theme === 'dark');
    }
  }, [user?.settings?.theme]);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
