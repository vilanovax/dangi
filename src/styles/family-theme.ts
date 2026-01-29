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

    // Success (درآمد - سبز)
    success: '#22C55E',
    successSoft: '#EAFBF1',

    // Danger (هزینه - قرمز)
    danger: '#EF4444',
    dangerSoft: '#FEECEC',

    // Info (گزارش - آبی)
    info: '#4F6EF7',
    infoSoft: '#EEF2FF',

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

    // Success (درآمد - سبز)
    success: '#4ADE80',
    successSoft: '#0F2417',

    // Danger (هزینه - قرمز)
    danger: '#F87171',
    dangerSoft: '#2D1212',

    // Info (گزارش - آبی)
    info: '#818CF8',
    infoSoft: '#1E1B3A',

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
