import { useAppState } from '../state/AppStateContext';
import { tokens } from './tokens';

export function useTheme() {
  const { state } = useAppState();
  const isDark = state.darkMode ?? false;

  // Return theme-aware color overrides
  const theme = {
    ...tokens,
    colors: {
      ...tokens.colors,
      background: isDark ? '#0F0F0F' : tokens.colors.background,
      backgroundLight: isDark ? '#1A1A1A' : tokens.colors.backgroundLight,
      textPrimary: isDark ? '#FFFFFF' : tokens.colors.textPrimary,
      textSecondary: isDark ? '#B0B0B0' : tokens.colors.textSecondary,
      textTertiary: isDark ? '#808080' : tokens.colors.textTertiary,
      border: isDark ? '#2A2A2A' : tokens.colors.border,
      borderDark: isDark ? '#3A3A3A' : tokens.colors.borderDark
    }
  };

  return { theme, isDark };
}
