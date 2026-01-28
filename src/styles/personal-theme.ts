/**
 * Personal Template Design System
 *
 * Color Palette: Emerald/Teal tones (personal finance, growth, balance)
 * Design Language: Calm, organized, mindful spending tracking
 */

export const personalTheme = {
  colors: {
    // Primary - Emerald (growth, balance, personal finance)
    primary: '#10B981', // emerald-500
    primarySoft: '#D1FAE5', // emerald-100
    primaryHover: '#059669', // emerald-600

    // Background
    background: '#F9FAFB', // gray-50 (neutral, clean)
    card: '#FFFFFF',
    cardHover: '#F3F4F6', // gray-100

    // Text
    textPrimary: '#111827', // gray-900
    textSecondary: '#6B7280', // gray-500
    textTertiary: '#9CA3AF', // gray-400
    textOnPrimary: '#FFFFFF',

    // Status colors
    success: '#10B981', // emerald-500
    successSoft: '#D1FAE5', // emerald-100
    danger: '#EF4444', // red-500
    dangerSoft: '#FEE2E2', // red-100
    warning: '#F59E0B', // amber-500
    warningSoft: '#FEF3C7', // amber-100
    info: '#14B8A6', // teal-500
    infoSoft: '#CCFBF1', // teal-100

    // UI elements
    divider: '#E5E7EB', // gray-200
    border: '#D1D5DB', // gray-300
  },

  gradients: {
    // Primary gradient - Emerald to Teal
    primaryHeader: 'linear-gradient(180deg, #10B981 0%, #059669 100%)',

    // Secondary gradient - Teal to Cyan (for special sections)
    secondaryHeader: 'linear-gradient(180deg, #14B8A6 0%, #06B6D4 100%)',
  },

  typography: {
    // Page titles
    pageTitle: {
      size: '20px',
      weight: '700' as const,
      lineHeight: '1.3',
    },

    // Section titles
    subtitle: {
      size: '16px',
      weight: '600' as const,
      lineHeight: '1.4',
    },

    // Body text
    body: {
      size: '14px',
      weight: '400' as const,
      lineHeight: '1.5',
    },

    // Small text
    small: {
      size: '12px',
      weight: '400' as const,
      lineHeight: '1.4',
    },

    // Tiny text
    tiny: {
      size: '10px',
      weight: '400' as const,
      lineHeight: '1.3',
    },

    // Hero numbers (large amounts)
    heroNumber: {
      size: '36px',
      weight: '900' as const,
      lineHeight: '1',
    },

    // Card numbers (medium amounts)
    cardNumber: {
      size: '20px',
      weight: '700' as const,
      lineHeight: '1.2',
    },
  },

  card: {
    borderRadius: '16px',
    shadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    shadowHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },

  button: {
    height: '48px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600' as const,
  },

  bottomNav: {
    height: '64px',
    iconSize: '24px',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
} as const

export type PersonalTheme = typeof personalTheme
