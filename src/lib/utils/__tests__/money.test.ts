import { describe, it, expect } from 'vitest'
import {
  toEnglishDigits,
  formatNumber,
  formatInputAmount,
  formatMoney,
  getCurrencyLabel,
  parseMoney,
  roundMoney,
} from '../money'

describe('toEnglishDigits', () => {
  it('should convert Persian digits to English', () => {
    expect(toEnglishDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890')
  })

  it('should convert Arabic digits to English', () => {
    expect(toEnglishDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789')
  })

  it('should handle mixed text and digits', () => {
    expect(toEnglishDigits('قیمت ۱۰۰۰ تومان')).toBe('قیمت 1000 تومان')
  })

  it('should return the same string if no digits', () => {
    expect(toEnglishDigits('Hello World')).toBe('Hello World')
  })
})

describe('formatNumber', () => {
  it('should format numbers with comma separator', () => {
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1000000)).toBe('1,000,000')
    expect(formatNumber(123456789)).toBe('123,456,789')
  })

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('should round decimal numbers', () => {
    expect(formatNumber(1234.56)).toBe('1,235')
    expect(formatNumber(1234.4)).toBe('1,234')
  })

  it('should handle negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000')
  })
})

describe('formatInputAmount', () => {
  it('should format input with commas as user types', () => {
    expect(formatInputAmount('1000')).toBe('1,000')
    expect(formatInputAmount('1000000')).toBe('1,000,000')
  })

  it('should handle Persian digits', () => {
    expect(formatInputAmount('۱۰۰۰')).toBe('1,000')
  })

  it('should remove non-numeric characters', () => {
    expect(formatInputAmount('1,000')).toBe('1,000')
    expect(formatInputAmount('1.000')).toBe('1,000')
    expect(formatInputAmount('abc123')).toBe('123')
  })

  it('should return empty string for non-numeric input', () => {
    expect(formatInputAmount('')).toBe('')
    expect(formatInputAmount('abc')).toBe('')
  })
})

describe('formatMoney', () => {
  it('should format IRR currency with تومان', () => {
    expect(formatMoney(1000, 'IRR')).toBe('1,000 تومان')
    expect(formatMoney(1000000, 'IRR')).toBe('1,000,000 تومان')
  })

  it('should format USD with dollar sign', () => {
    const result = formatMoney(1000, 'USD')
    expect(result).toContain('1,000')
    expect(result).toContain('$')
  })

  it('should format EUR with euro sign', () => {
    const result = formatMoney(1000, 'EUR')
    expect(result).toContain('1,000')
    expect(result).toContain('€')
  })

  it('should default to IRR if currency not specified', () => {
    expect(formatMoney(1000)).toBe('1,000 تومان')
  })

  it('should handle zero amount', () => {
    expect(formatMoney(0, 'IRR')).toBe('0 تومان')
  })

  it('should handle decimal amounts for non-IRR currencies', () => {
    const result = formatMoney(1234.56, 'USD')
    expect(result).toContain('1,234.56')
  })
})

describe('getCurrencyLabel', () => {
  it('should return correct Persian labels for known currencies', () => {
    expect(getCurrencyLabel('IRR')).toBe('تومان')
    expect(getCurrencyLabel('USD')).toBe('دلار')
    expect(getCurrencyLabel('EUR')).toBe('یورو')
    expect(getCurrencyLabel('GBP')).toBe('پوند')
    expect(getCurrencyLabel('AED')).toBe('درهم')
    expect(getCurrencyLabel('TRY')).toBe('لیر')
  })

  it('should return currency code for unknown currencies', () => {
    expect(getCurrencyLabel('JPY')).toBe('JPY')
    expect(getCurrencyLabel('CAD')).toBe('CAD')
  })
})

describe('parseMoney', () => {
  it('should parse English numbers', () => {
    expect(parseMoney('1000')).toBe(1000)
    expect(parseMoney('1,000')).toBe(1000)
    expect(parseMoney('1,000,000')).toBe(1000000)
  })

  it('should parse Persian digits', () => {
    expect(parseMoney('۱۰۰۰')).toBe(1000)
    expect(parseMoney('۱,۰۰۰')).toBe(1000)
  })

  it('should handle decimal values', () => {
    expect(parseMoney('1234.56')).toBe(1234.56)
    expect(parseMoney('۱۲۳۴.۵۶')).toBe(1234.56)
  })

  it('should remove non-numeric characters', () => {
    expect(parseMoney('1,000 تومان')).toBe(1000)
    expect(parseMoney('$1,234.56')).toBe(1234.56)
  })

  it('should return 0 for invalid input', () => {
    expect(parseMoney('')).toBe(0)
    expect(parseMoney('abc')).toBe(0)
    expect(parseMoney('N/A')).toBe(0)
  })
})

describe('roundMoney', () => {
  it('should round IRR to nearest 100', () => {
    expect(roundMoney(1250, 'IRR')).toBe(1300)
    expect(roundMoney(1249, 'IRR')).toBe(1200)
    expect(roundMoney(1000, 'IRR')).toBe(1000)
  })

  it('should round other currencies to 2 decimal places', () => {
    expect(roundMoney(1234.567, 'USD')).toBe(1234.57)
    expect(roundMoney(1234.564, 'USD')).toBe(1234.56)
    expect(roundMoney(10.555, 'EUR')).toBe(10.56)
  })

  it('should default to IRR if currency not specified', () => {
    expect(roundMoney(1250)).toBe(1300)
  })

  it('should handle zero', () => {
    expect(roundMoney(0, 'IRR')).toBe(0)
    expect(roundMoney(0, 'USD')).toBe(0)
  })
})
