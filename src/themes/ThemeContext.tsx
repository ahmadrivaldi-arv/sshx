import React, { createContext, useContext } from 'react';
import type { ResolvedTheme } from '../types/theme.js';
import { resolveTheme } from './themes.js';

const fallbackTheme = resolveTheme({
  name: 'default',
  compact: false,
  ascii: false
});

const ThemeContext = createContext<ResolvedTheme>(fallbackTheme);

interface ThemeProviderProps {
  theme: ResolvedTheme;
  children: React.ReactNode;
}

export const ThemeProvider = ({ theme, children }: ThemeProviderProps): React.ReactElement => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
);

export const useTheme = (): ResolvedTheme => useContext(ThemeContext);
