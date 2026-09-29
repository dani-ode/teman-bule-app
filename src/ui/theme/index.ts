/**
 * TemanBule Design Tokens & Theme Specification
 *
 * Color Palette:
 * - #F5EFE3: Vintage White / Cream (background utama)
 * - #4F5B2A: Dark Olive Green (primary/brand color)
 * - #B8892D: Ochre / Bronze (accent color)
 * - #D8C9A8: Khaki / Sand (surface/card background)
 */

export const theme = Object.freeze({
  colors: {
    primary: {
      50: '#f4f6ee',
      100: '#e5e9d5',
      200: '#c9d1a8',
      300: '#a8b478',
      400: '#8a9757',
      500: '#6b7a3d',
      600: '#4F5B2A',
      700: '#3f4822',
      800: '#343b1e',
      900: '#2d331c',
    },
    accent: {
      50: '#fdf8ef',
      100: '#f9edd5',
      200: '#f2d9a6',
      300: '#eac070',
      400: '#e2a94a',
      500: '#B8892D',
      600: '#9e7326',
      700: '#7f5c21',
      800: '#684b20',
      900: '#563f1d',
    },
    khaki: {
      50: '#faf8f2',
      100: '#F5EFE3',
      200: '#ece3ce',
      300: '#D8C9A8',
      400: '#c9b48e',
      500: '#bda074',
      600: '#a98a5c',
      700: '#8c7049',
      800: '#735c3e',
      900: '#5f4d34',
    },
    neutral: {
      50: '#faf8f2',
      100: '#F5EFE3',
      200: '#ece3ce',
      300: '#D8C9A8',
      400: '#b8a88e',
      500: '#9a8a72',
      600: '#6b5f4c',
      700: '#544a3b',
      800: '#453d31',
      900: '#3a3329',
    },
    semantic: {
      success: '#5a7c3a',
      warning: '#c49a2c',
      error: '#b85c4a',
      info: '#5b7fa6',
    },
    background: {
      main: '#F5EFE3',
      card: '#faf8f2',
      surface: '#ece3ce',
      userBubble: '#4F5B2A',
      aiBubble: '#faf8f2',
      correctionCard: '#eef2e0',
    },
    text: {
      primary: '#3a3329',
      secondary: '#6b5f4c',
      muted: '#9a8a72',
      inverse: '#F5EFE3',
      correctionHeader: '#3f6b2a',
    },
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      heading: 30,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  shadows: {
    card: {
      shadowColor: '#3a3329',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    bubble: {
      shadowColor: '#3a3329',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    elevated: {
      shadowColor: '#3a3329',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 6,
    },
  },
});

export type Theme = typeof theme;
