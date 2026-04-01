/**
 * Design Tokens for Cravr
 * Unified color, spacing, typography, and shadow system
 */

export const tokens = {
  // Colors
  colors: {
    background: '#FAFAF8',
    backgroundLight: '#FFFFFF',
    backgroundDark: '#1A1A1A',

    primary: '#FF6A2A',
    primaryTint: '#FFF0E6',
    primaryLight: '#FFE0CF',

    secondary: '#FF5733',
    secondaryTint: '#FFF0EB',

    accentGreen: '#22C55E',
    accentGreenLight: '#DCFCE7',

    textPrimary: '#0F0F0F',
    textSecondary: '#737373',
    textTertiary: '#A0A0A0',
    textHeading: '#1A1A1A',
    textInverse: '#FFFFFF',

    border: '#F0EDEA',
    borderDark: '#E5E0DA',

    // Status colors
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',

    // Old values for reference (being phased out)
    oldBackground: '#FFF8F3',
    oldPrimary: '#FF6A2A',
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Border Radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },

  // Typography
  typography: {
    // Headlines
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    h3: {
      fontSize: 24,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    h4: {
      fontSize: 20,
      fontWeight: '700' as const,
      letterSpacing: 0,
    },

    // Body
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },

    // Small text
    small: {
      fontSize: 14,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },
    smallBold: {
      fontSize: 14,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },

    // Label text
    label: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },

    // Caption
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },

    // Greeting/subtitle
    greeting: {
      fontSize: 13,
      fontWeight: '500' as const,
      letterSpacing: 0,
    },
  },

  // Shadows
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOpacity: 0.22,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  },

  // Glows / Highlight shadows
  glows: {
    primaryGlow: {
      shadowColor: '#FF6A2A',
      shadowOpacity: 0.40,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    primaryGlowLarge: {
      shadowColor: '#FF6A2A',
      shadowOpacity: 0.50,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 12,
    },
  },
};

export default tokens;
