import React, { createContext, useContext, useState } from 'react';

interface Theme {
  isDark: boolean;
  colors: {
    background: string;
    text: string;
    card: string;
    primary: string;
  };
}

const lightTheme: Theme = {
  isDark: false,
  colors: {
    background: '#FFFFFF',
    text: '#000000',
    card: '#f4f4f4',
    primary: '#000000',
  },
};

const darkTheme: Theme = {
  isDark: true,
  colors: {
    background: '#1c1a1d',
    text: '#FFFFFF',
    card: '#28292b',
    primary: '#FFFFFF',
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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