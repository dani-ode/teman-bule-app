import type { Config } from 'tailwindcss';
import { theme } from './src/ui/theme';

/**
 * Tailwind config — single source of truth dari src/ui/theme.
 * Design tokens (colors/spacing/radii) tidak diduplikasi di sini;
 * di-derive langsung dari theme agar tidak drift dengan design system.
 */
export default {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: theme.colors.primary,
        accent: theme.colors.accent,
        khaki: theme.colors.khaki,
        neutral: theme.colors.neutral,
        success: theme.colors.semantic.success,
        warning: theme.colors.semantic.warning,
        danger: theme.colors.semantic.error,
        info: theme.colors.semantic.info,
        background: theme.colors.background,
        ink: {
          primary: theme.colors.text.primary,
          secondary: theme.colors.text.secondary,
          muted: theme.colors.text.muted,
          inverse: theme.colors.text.inverse,
          correctionHeader: theme.colors.text.correctionHeader,
        },
      },
      boxShadow: {
        card: '0 4px 12px rgba(58, 51, 41, 0.06)',
        bubble: '0 2px 6px rgba(58, 51, 41, 0.04)',
        elevated: '0 8px 24px rgba(58, 51, 41, 0.1)',
      },
      borderRadius: {
        sm: `${theme.radii.sm}px`,
        md: `${theme.radii.md}px`,
        lg: `${theme.radii.lg}px`,
        xl: `${theme.radii.xl}px`,
        full: `${theme.radii.full}px`,
      },
    },
  },
  plugins: [],
} satisfies Config;
