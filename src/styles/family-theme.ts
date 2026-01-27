/**
 * Family Finance Template - Design System
 *
 * یک Design System سبک، یکدست و حرفه‌ای
 */

export const familyTheme = {
  // 🎨 پالت رنگ اصلی
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

// 🎨 Helper: تولید کلاس‌های Tailwind بر اساس theme
export const getHeaderGradient = (type: 'primary' | 'info' = 'primary') => {
  return type === 'primary'
    ? 'bg-gradient-to-b from-[#FF8A00] to-[#FFA94D]'
    : 'bg-gradient-to-b from-[#4F6EF7] to-[#6D83FF]'
}

export const getDataCardClasses = (type: 'success' | 'danger' | 'info' | 'neutral') => {
  const baseClasses = 'rounded-2xl p-4 shadow-sm'

  switch (type) {
    case 'success':
      return `${baseClasses} bg-[#EAFBF1]`
    case 'danger':
      return `${baseClasses} bg-[#FEECEC]`
    case 'info':
      return `${baseClasses} bg-[#EEF2FF]`
    case 'neutral':
      return `${baseClasses} bg-white`
    default:
      return baseClasses
  }
}

export const getTextColorClass = (type: 'success' | 'danger' | 'info' | 'primary' | 'secondary') => {
  switch (type) {
    case 'success':
      return 'text-[#22C55E]'
    case 'danger':
      return 'text-[#EF4444]'
    case 'info':
      return 'text-[#4F6EF7]'
    case 'primary':
      return 'text-[#1F2937]'
    case 'secondary':
      return 'text-[#6B7280]'
    default:
      return 'text-[#1F2937]'
  }
}

export const getPrimaryButtonClasses = () => {
  return 'h-[52px] bg-[#FF8A00] hover:bg-[#E67A00] text-white rounded-2xl font-bold text-[15px] transition-colors'
}

export const getSecondaryButtonClasses = () => {
  return 'h-[52px] bg-white border-2 border-[#E5E7EB] hover:border-[#FF8A00] text-[#1F2937] rounded-2xl font-bold text-[15px] transition-colors'
}
