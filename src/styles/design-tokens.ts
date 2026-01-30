/**
 * Design Tokens - Single Source of Truth
 *
 * All UI values (colors, spacing, typography, etc.) should reference these tokens.
 * Never use hardcoded values in components.
 */

export const designTokens = {
  colors: {
    background: {
      app: '#FFFDF7',
      card: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      muted: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    border: {
      soft: '#E5E7EB',
      strong: '#D1D5DB',
    },
    brand: {
      primary: '#FF8A1F',
      primarySoft: '#FFF3E5',
    },
    semantic: {
      income: '#16A34A',
      expense: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    charts: {
      barPrimary: '#3B82F6',
      barTrack: '#E5E7EB',
    },
    kpi: {
      positive: '#16A34A',
      negative: '#EF4444',
      neutral: '#6B7280',
    },
    nav: {
      barBackground: '#FFFFFF',
      iconActive: '#FF8A1F',
      iconInactive: '#9CA3AF',
    },
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
    8: 40,
  },
  radius: {
    none: 0,
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
  },
  shadow: {
    none: 'none',
    card: '0 4px 12px rgba(0,0,0,0.06)',
    elevated: '0 6px 24px rgba(0,0,0,0.08)',
  },
  typography: {
    fontFamily: {
      primary: 'Vazirmatn, IRANYekan, system-ui, -apple-system, BlinkMacSystemFont',
      numeric: 'Vazirmatn, IRANYekan, system-ui',
    },
    sizes: {
      caption: 11,
      body: 14,
      bodyLarge: 16,
      title: 18,
      headline: 22,
      display: 28,
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
  icons: {
    sizes: {
      sm: 16,
      md: 20,
      lg: 24,
    },
    strokeWidth: 1.5,
    color: {
      default: '#6B7280',
      active: '#FF8A1F',
      positive: '#16A34A',
      negative: '#EF4444',
    },
  },
  layout: {
    pagePadding: 16,
    sectionGap: 24,
    cardGap: 16,
    listItemGap: 12,
    bottomNavHeight: 64,
  },
  components: {
    card: {
      radius: 'lg' as const,
      padding: 16,
      backgroundColor: 'colors.background.card',
      shadow: 'shadow.card',
    },
    button: {
      primary: {
        height: 48,
        radius: 'md' as const,
        backgroundColor: 'colors.brand.primary',
        textColor: 'colors.text.inverse',
        fontSize: 'typography.sizes.bodyLarge',
        fontWeight: 'typography.weights.medium',
      },
      secondary: {
        height: 44,
        radius: 'md' as const,
        borderColor: 'colors.border.soft',
        borderWidth: 1,
        backgroundColor: 'colors.background.card',
        textColor: 'colors.text.primary',
        fontSize: 'typography.sizes.body',
        fontWeight: 'typography.weights.medium',
      },
    },
    chip: {
      height: 32,
      radius: 'xl' as const,
      paddingHorizontal: 12,
      backgroundColor: 'colors.background.card',
      backgroundSelected: 'colors.brand.primarySoft',
      textColor: 'colors.text.secondary',
      textSelected: 'colors.brand.primary',
    },
    fab: {
      size: 64,
      radius: 999,
      backgroundColor: 'colors.brand.primary',
      iconSize: 24,
      iconColor: 'colors.text.inverse',
    },
    kpiItem: {
      iconSize: 24,
      valueSize: 'typography.sizes.bodyLarge',
      labelSize: 'typography.sizes.caption',
    },
    transactionItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      radius: 'lg' as const,
      amountPositiveColor: 'colors.semantic.income',
      amountNegativeColor: 'colors.semantic.expense',
    },
  },
} as const

// Dark mode overrides (optional - can be enabled later)
export const darkTokens = {
  colors: {
    background: {
      app: '#0F172A',
      card: '#1E293B',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      muted: '#64748B',
      inverse: '#0F172A',
    },
    border: {
      soft: '#334155',
      strong: '#475569',
    },
  },
}

export type DesignTokens = typeof designTokens
