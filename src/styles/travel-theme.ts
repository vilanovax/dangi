/**
 * Travel Template Design System
 *
 * Color Palette: Blue/Sky tones (adventure, journey, exploration)
 * Design Language: Professional travel planning, clear hierarchy, trustworthy
 */

export const travelTheme = {
  colors: {
    // Primary - Sky Blue (adventure, journey)
    primary: '#0EA5E9', // sky-500
    primarySoft: '#E0F2FE', // sky-100
    primaryHover: '#0284C7', // sky-600

    // Background
    background: '#F8FAFC', // slate-50 (cooler than cream)
    card: '#FFFFFF',
    cardHover: '#F1F5F9', // slate-100

    // Text
    textPrimary: '#0F172A', // slate-900
    textSecondary: '#64748B', // slate-500
    textTertiary: '#94A3B8', // slate-400
    textOnPrimary: '#FFFFFF',

    // Status colors
    success: '#10B981', // emerald-500
    successSoft: '#D1FAE5', // emerald-100
    danger: '#EF4444', // red-500
    dangerSoft: '#FEE2E2', // red-100
    warning: '#F59E0B', // amber-500
    warningSoft: '#FEF3C7', // amber-100
    info: '#3B82F6', // blue-500
    infoSoft: '#DBEAFE', // blue-100

    // UI elements
    divider: '#E2E8F0', // slate-200
    border: '#CBD5E1', // slate-300
  },

  gradients: {
    // Primary gradient - Sky to Blue
    primaryHeader: 'linear-gradient(180deg, #0EA5E9 0%, #0284C7 100%)',

    // Secondary gradient - Indigo to Blue (for special sections)
    secondaryHeader: 'linear-gradient(180deg, #6366F1 0%, #3B82F6 100%)',
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

export type TravelTheme = typeof travelTheme
