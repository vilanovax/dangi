/**
 * Family Finance Template - Design System
 *
 * یک Design System سبک، یکدست و حرفه‌ای با پشتیبانی از Dark Mode
 */

export const familyTheme = {
  // 🎨 پالت رنگ اصلی (Light Mode)
  colors: {
    // Primary (نارنجی گرم)
    primary: '#FF8A00',
    primarySoft: '#FFF3E0',
    primaryHover: '#E67A00',

    // Success (درآمد - سبز)
    success: '#22C55E',
    successSoft: '#EAFBF1',
    successHover: '#16A34A',

    // Danger (هزینه - قرمز)
    danger: '#EF4444',
    dangerSoft: '#FEECEC',
    dangerHover: '#DC2626',

    // Warning (هشدار بودجه - زرد)
    warning: '#F59E0B',
    warningSoft: '#FEF3C7',
    warningHover: '#D97706',

    // Info (گزارش - آبی)
    info: '#4F6EF7',
    infoSoft: '#EEF2FF',
    infoHover: '#4338CA',

    // Neutral (پس‌زمینه‌ها)
    background: '#FFFDF8',
    card: '#FFFFFF',
    divider: '#E5E7EB',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
  },

  // 🌙 Dark Mode Colors
  darkColors: {
    // Primary (نارنجی گرم - کمی روشن‌تر)
    primary: '#FFA94D',
    primarySoft: '#2D1F0D',
    primaryHover: '#FFB966',

    // Success (درآمد - سبز)
    success: '#4ADE80',
    successSoft: '#0F2417',
    successHover: '#6EE7A7',

    // Danger (هزینه - قرمز)
    danger: '#F87171',
    dangerSoft: '#2D1212',
    dangerHover: '#FCA5A5',

    // Warning (هشدار بودجه - زرد)
    warning: '#FBBF24',
    warningSoft: '#2D2410',
    warningHover: '#FCD34D',

    // Info (گزارش - آبی)
    info: '#818CF8',
    infoSoft: '#1E1B3A',
    infoHover: '#A5B4FC',

    // Neutral (پس‌زمینه‌ها)
    background: '#0F172A',
    card: '#1E293B',
    divider: '#334155',
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
  },

  // 🌈 گرادیان‌ها (فقط 2 مورد)
  gradients: {
    // Header نارنجی (برای dashboard، بودجه، تنظیمات)
    primaryHeader: 'linear-gradient(180deg, #FF8A00 0%, #FFA94D 100%)',

    // Header آبی (فقط برای گزارش‌ها)
    infoHeader: 'linear-gradient(180deg, #4F6EF7 0%, #6D83FF 100%)',
  },

  // 📝 تایپوگرافی
  typography: {
    // Page Title
    pageTitle: {
      size: '22px',
      weight: '700', // Bold
      lineHeight: '1.3',
    },

    // Subtitle
    subtitle: {
      size: '15px',
      weight: '500', // Medium
      lineHeight: '1.4',
    },

    // Hero Number (عدد بزرگ اصلی)
    heroNumber: {
      size: '32px',
      weight: '800', // ExtraBold
      lineHeight: '1.2',
    },

    // Card Number
    cardNumber: {
      size: '20px',
      weight: '700', // Bold
      lineHeight: '1.2',
    },

    // Body Text
    body: {
      size: '14px',
      weight: '400', // Regular
      lineHeight: '1.5',
    },

    // Small / Hint
    small: {
      size: '12px',
      weight: '400', // Regular
      lineHeight: '1.4',
    },
  },

  // 🎴 کارت‌ها
  card: {
    borderRadius: '16px',
    padding: '16px',
    shadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
  },

  // 🔘 دکمه‌ها
  button: {
    height: '52px',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: '700', // Bold
  },

  // 📱 Bottom Navigation
  bottomNav: {
    height: '56px',
  },

  // 💫 سایه‌ها (Shadow Scale)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // 🔲 Border Radius Scale
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },

  // 📏 فاصله‌گذاری (Spacing Scale)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
}

// 🎨 Helper: تولید کلاس‌های Tailwind بر اساس theme با پشتیبانی Dark Mode
export const getHeaderGradient = (type: 'primary' | 'info' = 'primary') => {
  return type === 'primary'
    ? 'bg-gradient-to-b from-[#FF8A00] to-[#FFA94D] dark:from-[#FFA94D] dark:to-[#FFB966]'
    : 'bg-gradient-to-b from-[#4F6EF7] to-[#6D83FF] dark:from-[#6D83FF] dark:to-[#818CF8]'
}

export const getDataCardClasses = (type: 'success' | 'danger' | 'info' | 'neutral') => {
  const baseClasses = 'rounded-2xl p-4 shadow-sm transition-colors'

  switch (type) {
    case 'success':
      return `${baseClasses} bg-[#EAFBF1] dark:bg-[#0F2417]`
    case 'danger':
      return `${baseClasses} bg-[#FEECEC] dark:bg-[#2D1212]`
    case 'info':
      return `${baseClasses} bg-[#EEF2FF] dark:bg-[#1E1B3A]`
    case 'neutral':
      return `${baseClasses} bg-white dark:bg-[#1E293B]`
    default:
      return baseClasses
  }
}

export const getTextColorClass = (type: 'success' | 'danger' | 'info' | 'primary' | 'secondary') => {
  switch (type) {
    case 'success':
      return 'text-[#22C55E] dark:text-[#4ADE80]'
    case 'danger':
      return 'text-[#EF4444] dark:text-[#F87171]'
    case 'info':
      return 'text-[#4F6EF7] dark:text-[#818CF8]'
    case 'primary':
      return 'text-[#1F2937] dark:text-[#F1F5F9]'
    case 'secondary':
      return 'text-[#6B7280] dark:text-[#CBD5E1]'
    default:
      return 'text-[#1F2937] dark:text-[#F1F5F9]'
  }
}

export const getPrimaryButtonClasses = () => {
  return 'h-[52px] bg-[#FF8A00] hover:bg-[#E67A00] dark:bg-[#FFA94D] dark:hover:bg-[#FFB966] text-white rounded-2xl font-bold text-[15px] transition-colors'
}

export const getSecondaryButtonClasses = () => {
  return 'h-[52px] bg-white dark:bg-[#1E293B] border-2 border-[#E5E7EB] dark:border-[#334155] hover:border-[#FF8A00] dark:hover:border-[#FFA94D] text-[#1F2937] dark:text-[#F1F5F9] rounded-2xl font-bold text-[15px] transition-colors'
}

// 🆕 Helper: Background colors با dark mode support
export const getBackgroundClass = () => {
  return 'bg-[#FFFDF8] dark:bg-[#0F172A]'
}

export const getCardBackgroundClass = () => {
  return 'bg-white dark:bg-[#1E293B]'
}

export const getDividerClass = () => {
  return 'border-[#E5E7EB] dark:border-[#334155]'
}

// 💫 Helper: Shadow classes
export const getShadowClass = (size: keyof typeof familyTheme.shadows = 'base') => {
  const shadowMap = {
    sm: 'shadow-sm',
    base: 'shadow',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  }
  return shadowMap[size]
}

// 📏 Helper: Spacing values
export const getSpacingValue = (size: keyof typeof familyTheme.spacing) => {
  return familyTheme.spacing[size]
}

// 🔲 Helper: Border radius classes
export const getRadiusClass = (size: keyof typeof familyTheme.radius = 'lg') => {
  const radiusMap = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-[20px]',
    '2xl': 'rounded-3xl',
    '3xl': 'rounded-[32px]',
    full: 'rounded-full',
  }
  return radiusMap[size]
}

// ⚠️ Helper: Warning button classes
export const getWarningButtonClasses = () => {
  return 'h-[52px] bg-[#F59E0B] hover:bg-[#D97706] dark:bg-[#FBBF24] dark:hover:bg-[#FCD34D] text-white rounded-2xl font-bold text-[15px] transition-colors'
}

// ✅ Helper: Success button classes
export const getSuccessButtonClasses = () => {
  return 'h-[52px] bg-[#22C55E] hover:bg-[#16A34A] dark:bg-[#4ADE80] dark:hover:bg-[#6EE7A7] text-white rounded-2xl font-bold text-[15px] transition-colors'
}

// 🔴 Helper: Danger button classes
export const getDangerButtonClasses = () => {
  return 'h-[52px] bg-[#EF4444] hover:bg-[#DC2626] dark:bg-[#F87171] dark:hover:bg-[#FCA5A5] text-white rounded-2xl font-bold text-[15px] transition-colors'
}
