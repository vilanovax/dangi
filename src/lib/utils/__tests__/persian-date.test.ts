import { describe, it, expect } from 'vitest'
import {
  PERSIAN_MONTHS,
  formatPeriodKey,
  formatPeriodKeyShort,
  getCurrentPersianYear,
  getCurrentPersianMonth,
  getCurrentPeriodKey,
  getRecentPeriods,
} from '../persian-date'

describe('PERSIAN_MONTHS', () => {
  it('should have 12 months', () => {
    expect(PERSIAN_MONTHS).toHaveLength(12)
  })

  it('should have correct structure for each month', () => {
    PERSIAN_MONTHS.forEach((month) => {
      expect(month).toHaveProperty('key')
      expect(month).toHaveProperty('name')
      expect(month).toHaveProperty('short')
    })
  })

  it('should have months in correct order', () => {
    expect(PERSIAN_MONTHS[0].name).toBe('فروردین')
    expect(PERSIAN_MONTHS[11].name).toBe('اسفند')
  })
})

describe('formatPeriodKey', () => {
  it('should format period key with year', () => {
    expect(formatPeriodKey('1403-10', true)).toBe('دی 1403')
    expect(formatPeriodKey('1402-01', true)).toBe('فروردین 1402')
  })

  it('should format period key without year', () => {
    expect(formatPeriodKey('1403-10', false)).toBe('دی')
    expect(formatPeriodKey('1402-01', false)).toBe('فروردین')
  })

  it('should handle invalid period keys', () => {
    expect(formatPeriodKey('', true)).toBe('')
    expect(formatPeriodKey('invalid', true)).toBe('')
    expect(formatPeriodKey('1403', true)).toBe('')
  })

  it('should return original key for invalid month', () => {
    expect(formatPeriodKey('1403-13', true)).toBe('1403-13')
    expect(formatPeriodKey('1403-00', true)).toBe('1403-00')
  })

  it('should default to including year', () => {
    expect(formatPeriodKey('1403-10')).toBe('دی 1403')
  })
})

describe('formatPeriodKeyShort', () => {
  it('should format period key in short format', () => {
    expect(formatPeriodKeyShort('1403-10')).toBe('دی 03')
    expect(formatPeriodKeyShort('1402-01')).toBe('فرو 02')
    expect(formatPeriodKeyShort('1401-12')).toBe('اسف 01')
  })

  it('should handle invalid period keys', () => {
    expect(formatPeriodKeyShort('')).toBe('')
    expect(formatPeriodKeyShort('invalid')).toBe('')
  })

  it('should return original key for invalid month', () => {
    expect(formatPeriodKeyShort('1403-13')).toBe('1403-13')
  })

  it('should extract last 2 digits of year', () => {
    expect(formatPeriodKeyShort('1403-01')).toContain('03')
    expect(formatPeriodKeyShort('1399-05')).toContain('99')
  })
})

describe('getCurrentPersianYear', () => {
  it('should return a number', () => {
    const year = getCurrentPersianYear()
    expect(typeof year).toBe('number')
  })

  it('should return a reasonable year (between 1400-1410 as of 2024)', () => {
    const year = getCurrentPersianYear()
    expect(year).toBeGreaterThanOrEqual(1400)
    expect(year).toBeLessThanOrEqual(1410)
  })

  it('should be consistent when called multiple times', () => {
    const year1 = getCurrentPersianYear()
    const year2 = getCurrentPersianYear()
    expect(year1).toBe(year2)
  })
})

describe('getCurrentPersianMonth', () => {
  it('should return a string', () => {
    const month = getCurrentPersianMonth()
    expect(typeof month).toBe('string')
  })

  it('should return a valid month (01-12)', () => {
    const month = getCurrentPersianMonth()
    const monthNum = parseInt(month)
    expect(monthNum).toBeGreaterThanOrEqual(1)
    expect(monthNum).toBeLessThanOrEqual(12)
  })

  it('should return zero-padded month', () => {
    const month = getCurrentPersianMonth()
    expect(month).toHaveLength(2)
    expect(month).toMatch(/^\d{2}$/)
  })

  it('should be a valid Persian month key', () => {
    const month = getCurrentPersianMonth()
    const validMonths = PERSIAN_MONTHS.map(m => m.key)
    expect(validMonths).toContain(month)
  })
})

describe('getCurrentPeriodKey', () => {
  it('should return a string in YYYY-MM format', () => {
    const periodKey = getCurrentPeriodKey()
    expect(typeof periodKey).toBe('string')
    expect(periodKey).toMatch(/^\d{4}-\d{2}$/)
  })

  it('should contain valid year and month', () => {
    const periodKey = getCurrentPeriodKey()
    const [year, month] = periodKey.split('-')

    expect(parseInt(year)).toBeGreaterThanOrEqual(1400)
    expect(parseInt(year)).toBeLessThanOrEqual(1410)

    expect(parseInt(month)).toBeGreaterThanOrEqual(1)
    expect(parseInt(month)).toBeLessThanOrEqual(12)
  })

  it('should be consistent when called multiple times', () => {
    const periodKey1 = getCurrentPeriodKey()
    const periodKey2 = getCurrentPeriodKey()
    expect(periodKey1).toBe(periodKey2)
  })
})

describe('getRecentPeriods', () => {
  it('should return default 12 periods', () => {
    const periods = getRecentPeriods()
    expect(periods).toHaveLength(12)
  })

  it('should return specified number of periods', () => {
    const periods5 = getRecentPeriods(5)
    expect(periods5).toHaveLength(5)

    const periods20 = getRecentPeriods(20)
    expect(periods20).toHaveLength(20)
  })

  it('should have correct structure for each period', () => {
    const periods = getRecentPeriods()
    periods.forEach(period => {
      expect(period).toHaveProperty('key')
      expect(period).toHaveProperty('label')
      expect(period.key).toMatch(/^\d{4}-\d{2}$/)
      expect(typeof period.label).toBe('string')
    })
  })

  it('should return periods in descending order (most recent first)', () => {
    const periods = getRecentPeriods(3)

    // Extract year and month from each period
    const period1 = periods[0].key.split('-').map(Number)
    const period2 = periods[1].key.split('-').map(Number)
    const period3 = periods[2].key.split('-').map(Number)

    // Compare: period1 should be >= period2 >= period3
    const compare = (p1: number[], p2: number[]) => {
      return p1[0] > p2[0] || (p1[0] === p2[0] && p1[1] > p2[1])
    }

    expect(
      compare(period1, period2) || (period1[0] === period2[0] && period1[1] === period2[1])
    ).toBe(true)
    expect(
      compare(period2, period3) || (period2[0] === period3[0] && period2[1] === period3[1])
    ).toBe(true)
  })

  it('should handle year transitions correctly', () => {
    const periods = getRecentPeriods(15) // More than 12 to cross year boundary

    // Check that years are either same or decreasing
    for (let i = 1; i < periods.length; i++) {
      const prevYear = parseInt(periods[i - 1].key.split('-')[0])
      const currYear = parseInt(periods[i].key.split('-')[0])
      expect(currYear).toBeLessThanOrEqual(prevYear)
    }
  })

  it('should include current period as first item', () => {
    const periods = getRecentPeriods()
    const currentPeriod = getCurrentPeriodKey()
    expect(periods[0].key).toBe(currentPeriod)
  })
})
