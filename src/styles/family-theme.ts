/**
 * Family Finance Template - Token-Driven Design System
 *
 * All values now reference designTokens.ts - the single source of truth.
 * Never use hardcoded values here.
 */

import { designTokens } from './design-tokens'

const dt = designTokens

// Re-export tokens for convenience
export { designTokens }

// Backward compatibility: map old familyTheme structure to new designTokens
export const familyTheme = {
  colors: {
    primary: dt.colors.brand.primary,
    primarySoft: dt.colors.brand.primarySoft,
    primaryHover: '#E67A00',
    success: dt.colors.semantic.income,
    successSoft: '#EAFBF1',
    successHover: '#159240',
    danger: dt.colors.semantic.expense,
    dangerSoft: '#FEECEC',
    dangerHover: '#DC2626',
    warning: dt.colors.semantic.warning,
    warningSoft: '#FEF3C7',
    warningHover: '#D97706',
    info: dt.colors.semantic.info,
    infoSoft: '#EFF6FF',
    infoHover: '#3730A3',
    background: dt.colors.background.app,
    card: dt.colors.background.card,
    divider: dt.colors.border.soft,
    textPrimary: dt.colors.text.primary,
    textSecondary: dt.colors.text.secondary,
    textTertiary: dt.colors.text.muted,
  },
  darkColors: {
    primary: '#FFA94D',
    primarySoft: '#2D1F0D',
    primaryHover: '#FFB966',
    success: '#4ADE80',
    successSoft: '#0F2417',
    successHover: '#6EE7A7',
    danger: '#F87171',
    dangerSoft: '#2D1212',
    dangerHover: '#FCA5A5',
    warning: '#FBBF24',
    warningSoft: '#2D2410',
    warningHover: '#FCD34D',
    info: '#93C5FD',
    infoSoft: '#1E1B3A',
    infoHover: '#BFDBFE',
    background: '#0F172A',
    card: '#1E293B',
    divider: '#334155',
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
  },
  gradients: {
    primaryHeader: 'linear-gradient(180deg, #FF8A1F 0%, #FFA94D 100%)',
    infoHeader: 'linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%)',
  },
  typography: {
    pageTitle: {
      size: `${dt.typography.sizes.headline}px`,
      weight: `${dt.typography.weights.bold}`,
      lineHeight: `${dt.typography.lineHeight.tight}`,
    },
    subtitle: {
      size: `${dt.typography.sizes.title}px`,
      weight: `${dt.typography.weights.medium}`,
      lineHeight: `${dt.typography.lineHeight.normal}`,
    },
    heroNumber: {
      size: `${dt.typography.sizes.display}px`,
      weight: `${dt.typography.weights.bold}`,
      lineHeight: `${dt.typography.lineHeight.tight}`,
    },
    cardNumber: {
      size: `${dt.typography.sizes.bodyLarge + 4}px`,
      weight: `${dt.typography.weights.bold}`,
      lineHeight: `${dt.typography.lineHeight.tight}`,
    },
    body: {
      size: `${dt.typography.sizes.body}px`,
      weight: `${dt.typography.weights.regular}`,
      lineHeight: `${dt.typography.lineHeight.normal}`,
    },
    small: {
      size: `${dt.typography.sizes.caption + 1}px`,
      weight: `${dt.typography.weights.regular}`,
      lineHeight: `${dt.typography.lineHeight.normal}`,
    },
  },
  card: {
    borderRadius: `${dt.radius.lg}px`,
    padding: `${dt.components.card.padding}px`,
    shadow: dt.shadow.card,
  },
  button: {
    height: `${dt.components.button.primary.height}px`,
    borderRadius: `${dt.radius.md}px`,
    fontSize: `${dt.typography.sizes.bodyLarge}px`,
    fontWeight: `${dt.typography.weights.semibold}`,
  },
  bottomNav: {
    height: `${dt.layout.bottomNavHeight}px`,
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  radius: {
    sm: `${dt.radius.sm}px`,
    md: `${dt.radius.md}px`,
    lg: `${dt.radius.lg}px`,
    xl: `${dt.radius.xl}px`,
    '2xl': `${dt.radius.xl}px`,
    '3xl': `32px`,
    full: '9999px',
  },
  spacing: {
    xs: `${dt.spacing[1]}px`,
    sm: `${dt.spacing[2]}px`,
    md: `${dt.spacing[4]}px`,
    lg: `${dt.spacing[6]}px`,
    xl: `${dt.spacing[7]}px`,
    '2xl': `${dt.spacing[8] + 8}px`,
    '3xl': `${dt.spacing[8] + 24}px`,
  },
} as const

/**
 * Helper: Get background class for app/page level
 */
export const getBackgroundClass = () => {
  return 'bg-[#FFFDF7] dark:bg-[#0F172A]'
}

/**
 * Helper: Get background class for cards
 */
export const getCardBackgroundClass = () => {
  return 'bg-white dark:bg-[#1E293B]'
}

/**
 * Helper: Get header gradient based on context
 * @param type - 'primary' for main screens (orange), 'info' for reports (blue)
 */
export const getHeaderGradient = (type: 'primary' | 'info' = 'primary') => {
  return type === 'primary'
    ? 'bg-gradient-to-b from-[#FF8A1F] to-[#FFA94D] dark:from-[#FFA94D] dark:to-[#FFB966]'
    : 'bg-gradient-to-b from-[#3B82F6] to-[#60A5FA] dark:from-[#60A5FA] dark:to-[#93C5FD]'
}

/**
 * Helper: Get text color classes based on semantic type
 */
export const getTextColorClass = (
  type: 'success' | 'danger' | 'info' | 'primary' | 'secondary'
) => {
  switch (type) {
    case 'success':
      return `text-[${dt.colors.semantic.income}] dark:text-[#4ADE80]`
    case 'danger':
      return `text-[${dt.colors.semantic.expense}] dark:text-[#F87171]`
    case 'info':
      return `text-[${dt.colors.semantic.info}] dark:text-[#93C5FD]`
    case 'primary':
      return `text-[${dt.colors.text.primary}] dark:text-[#F1F5F9]`
    case 'secondary':
      return `text-[${dt.colors.text.secondary}] dark:text-[#CBD5E1]`
    default:
      return `text-[${dt.colors.text.primary}] dark:text-[#F1F5F9]`
  }
}

/**
 * Helper: Get card background classes based on data type
 */
export const getDataCardClasses = (
  type: 'success' | 'danger' | 'info' | 'neutral'
) => {
  const baseClasses = 'rounded-2xl p-4 shadow-sm transition-colors'

  switch (type) {
    case 'success':
      return `${baseClasses} bg-[#EAFBF1] dark:bg-[#0F2417]`
    case 'danger':
      return `${baseClasses} bg-[#FEECEC] dark:bg-[#2D1212]`
    case 'info':
      return `${baseClasses} bg-[#EFF6FF] dark:bg-[#1E1B3A]`
    case 'neutral':
      return `${baseClasses} bg-white dark:bg-[#1E293B]`
    default:
      return baseClasses
  }
}

/**
 * Helper: Get divider border class
 */
export const getDividerClass = () => {
  return `border-[${dt.colors.border.soft}] dark:border-[#334155]`
}

/**
 * Helper: Get shadow class from token scale
 */
export const getShadowClass = (size: 'none' | 'card' | 'elevated' = 'card') => {
  const shadowMap = {
    none: '',
    card: 'shadow-sm',
    elevated: 'shadow-md',
  }
  return shadowMap[size]
}

/**
 * Helper: Get primary button classes (token-driven)
 */
export const getPrimaryButtonClasses = () => {
  return `h-[${dt.components.button.primary.height}px] bg-[${dt.colors.brand.primary}] hover:bg-[#E67A00] text-white rounded-[${dt.radius.md}px] font-medium text-[${dt.typography.sizes.bodyLarge}px] transition-colors active:scale-[0.98]`
}

/**
 * Helper: Get secondary button classes (token-driven)
 */
export const getSecondaryButtonClasses = () => {
  return `h-[${dt.components.button.secondary.height}px] bg-white dark:bg-[#1E293B] border border-[${dt.colors.border.soft}] dark:border-[#334155] hover:border-[${dt.colors.brand.primary}] text-[${dt.colors.text.primary}] dark:text-[#F1F5F9] rounded-[${dt.radius.md}px] font-medium text-[${dt.typography.sizes.body}px] transition-colors active:scale-[0.98]`
}

/**
 * Helper: Get success button classes (income actions)
 */
export const getSuccessButtonClasses = () => {
  return `h-[${dt.components.button.primary.height}px] bg-[${dt.colors.semantic.income}] hover:bg-[#159240] text-white rounded-[${dt.radius.md}px] font-medium text-[${dt.typography.sizes.bodyLarge}px] transition-colors active:scale-[0.98]`
}

/**
 * Helper: Get danger button classes (expense actions)
 */
export const getDangerButtonClasses = () => {
  return `h-[${dt.components.button.primary.height}px] bg-[${dt.colors.semantic.expense}] hover:bg-[#DC2626] text-white rounded-[${dt.radius.md}px] font-medium text-[${dt.typography.sizes.bodyLarge}px] transition-colors active:scale-[0.98]`
}

/**
 * Helper: Get warning button classes (budget warnings)
 */
export const getWarningButtonClasses = () => {
  return `h-[${dt.components.button.primary.height}px] bg-[${dt.colors.semantic.warning}] hover:bg-[#D97706] text-white rounded-[${dt.radius.md}px] font-medium text-[${dt.typography.sizes.bodyLarge}px] transition-colors active:scale-[0.98]`
}

/**
 * Helper: Get chip classes (category selection, filters)
 */
export const getChipClasses = (selected: boolean = false) => {
  return selected
    ? `h-[${dt.components.chip.height}px] px-[${dt.components.chip.paddingHorizontal}px] bg-[${dt.colors.brand.primarySoft}] text-[${dt.colors.brand.primary}] border border-[${dt.colors.brand.primary}] rounded-[${dt.radius.xl}px] text-[${dt.typography.sizes.body}px] font-medium transition-all`
    : `h-[${dt.components.chip.height}px] px-[${dt.components.chip.paddingHorizontal}px] bg-white dark:bg-[#1E293B] text-[${dt.colors.text.secondary}] border border-[${dt.colors.border.soft}] dark:border-[#334155] rounded-[${dt.radius.xl}px] text-[${dt.typography.sizes.body}px] transition-all hover:border-[${dt.colors.brand.primary}]`
}

/**
 * Helper: Get transaction item classes (list items)
 */
export const getTransactionItemClasses = (type: 'income' | 'expense') => {
  const bgColor = type === 'income' ? '#EAFBF1' : '#FEECEC'
  const bgColorDark = type === 'income' ? '#0F2417' : '#2D1212'

  return `py-[${dt.components.transactionItem.paddingVertical}px] px-[${dt.components.transactionItem.paddingHorizontal}px] bg-[${bgColor}] dark:bg-[${bgColorDark}] rounded-[${dt.radius.lg}px] transition-colors hover:opacity-90`
}

/**
 * Helper: Get card padding class (consistent across all cards)
 */
export const getCardPaddingClass = () => {
  return `p-[${dt.components.card.padding}px]`
}

/**
 * Helper: Get section gap class (vertical spacing between sections)
 */
export const getSectionGapClass = () => {
  return `space-y-[${dt.layout.sectionGap}px]`
}

/**
 * Helper: Get page padding class (horizontal margins)
 */
export const getPagePaddingClass = () => {
  return `px-[${dt.layout.pagePadding}px]`
}

/**
 * Style constants for inline use
 */
export const styles = {
  // Typography
  pageTitle: {
    fontSize: `${dt.typography.sizes.headline}px`,
    fontWeight: dt.typography.weights.bold,
    lineHeight: dt.typography.lineHeight.tight,
  },
  heroNumber: {
    fontSize: `${dt.typography.sizes.display}px`,
    fontWeight: dt.typography.weights.bold,
    lineHeight: dt.typography.lineHeight.tight,
  },
  bodyText: {
    fontSize: `${dt.typography.sizes.body}px`,
    fontWeight: dt.typography.weights.regular,
    lineHeight: dt.typography.lineHeight.normal,
  },
  caption: {
    fontSize: `${dt.typography.sizes.caption}px`,
    fontWeight: dt.typography.weights.regular,
    lineHeight: dt.typography.lineHeight.normal,
  },

  // Layout
  cardPadding: `${dt.components.card.padding}px`,
  cardRadius: `${dt.radius.lg}px`,
  buttonRadius: `${dt.radius.md}px`,
  chipRadius: `${dt.radius.xl}px`,

  // Spacing
  sectionGap: `${dt.layout.sectionGap}px`,
  cardGap: `${dt.layout.cardGap}px`,
  pagePadding: `${dt.layout.pagePadding}px`,

  // Shadows
  cardShadow: dt.shadow.card,
  elevatedShadow: dt.shadow.elevated,
}
