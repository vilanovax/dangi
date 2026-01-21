// Money utility functions

/**
 * Convert Persian/Arabic digits to English
 */
export function toEnglishDigits(str: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  let result = str
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), String(i))
    result = result.replace(new RegExp(arabicDigits[i], 'g'), String(i))
  }
  return result
}

/**
 * Format number with comma separator (English digits)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

/**
 * Format input value as user types (English digits with commas)
 */
export function formatInputAmount(value: string): string {
  const englishValue = toEnglishDigits(value).replace(/[^0-9]/g, '')
  if (!englishValue) return ''
  return parseInt(englishValue).toLocaleString('en-US')
}

/**
 * Format number as currency with label
 */
export function formatMoney(amount: number, currency: string = 'IRR'): string {
  const formattedNumber = formatNumber(amount)

  if (currency === 'IRR') {
    return formattedNumber + ' تومان'
  }

  // For other currencies, use standard formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Get currency label
 */
export function getCurrencyLabel(currency: string): string {
  const labels: Record<string, string> = {
    IRR: 'تومان',
    USD: 'دلار',
    EUR: 'یورو',
    GBP: 'پوند',
    AED: 'درهم',
    TRY: 'لیر',
  }
  return labels[currency] || currency
}

/**
 * Parse Persian/English number string to number
 */
export function parseMoney(value: string): number {
  const normalized = toEnglishDigits(value).replace(/[^0-9.]/g, '')
  return parseFloat(normalized) || 0
}

/**
 * Round to nearest currency unit
 */
export function roundMoney(amount: number, currency: string = 'IRR'): number {
  if (currency === 'IRR') {
    // Round to nearest 100 toman
    return Math.round(amount / 100) * 100
  }

  return Math.round(amount * 100) / 100
}
