// Persian (Shamsi) date utilities

export const PERSIAN_MONTHS = [
  { key: '01', name: 'فروردین', short: 'فرو' },
  { key: '02', name: 'اردیبهشت', short: 'ارد' },
  { key: '03', name: 'خرداد', short: 'خرد' },
  { key: '04', name: 'تیر', short: 'تیر' },
  { key: '05', name: 'مرداد', short: 'مرد' },
  { key: '06', name: 'شهریور', short: 'شهر' },
  { key: '07', name: 'مهر', short: 'مهر' },
  { key: '08', name: 'آبان', short: 'آبا' },
  { key: '09', name: 'آذر', short: 'آذر' },
  { key: '10', name: 'دی', short: 'دی' },
  { key: '11', name: 'بهمن', short: 'بهم' },
  { key: '12', name: 'اسفند', short: 'اسف' },
]

/**
 * Convert periodKey (e.g., "1403-10") to Persian month name
 * @param periodKey - Format: "YYYY-MM" (e.g., "1403-10")
 * @param includeYear - Whether to include year in output
 * @returns Persian month name (e.g., "دی ۱۴۰۳" or just "دی")
 */
export function formatPeriodKey(periodKey: string, includeYear = true): string {
  if (!periodKey || !periodKey.includes('-')) return ''

  const [year, month] = periodKey.split('-')
  const monthInfo = PERSIAN_MONTHS.find((m) => m.key === month)

  if (!monthInfo) return periodKey

  if (includeYear) {
    return `${monthInfo.name} ${year}`
  }

  return monthInfo.name
}

/**
 * Get short format of period (e.g., "دی ۰۳")
 */
export function formatPeriodKeyShort(periodKey: string): string {
  if (!periodKey || !periodKey.includes('-')) return ''

  const [year, month] = periodKey.split('-')
  const monthInfo = PERSIAN_MONTHS.find((m) => m.key === month)

  if (!monthInfo) return periodKey

  // Last 2 digits of year
  const shortYear = year.slice(-2)
  return `${monthInfo.short} ${shortYear}`
}

/**
 * Get current Persian year (approximate)
 */
export function getCurrentPersianYear(): number {
  const now = new Date()
  // Approximate: Gregorian year - 621, adjust for Nowruz (March 21)
  const year = now.getFullYear() - 621
  const month = now.getMonth()
  if (month < 2 || (month === 2 && now.getDate() < 21)) {
    return year - 1
  }
  return year
}

/**
 * Get current Persian month key (01-12)
 */
export function getCurrentPersianMonth(): string {
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate()

  // Approximate mapping from Gregorian to Persian months
  // This is a rough approximation
  const monthMapping: Record<number, string> = {
    0: day < 21 ? '10' : '11', // Jan -> Dey or Bahman
    1: day < 20 ? '11' : '12', // Feb -> Bahman or Esfand
    2: day < 21 ? '12' : '01', // Mar -> Esfand or Farvardin
    3: day < 21 ? '01' : '02', // Apr -> Farvardin or Ordibehesht
    4: day < 22 ? '02' : '03', // May -> Ordibehesht or Khordad
    5: day < 22 ? '03' : '04', // Jun -> Khordad or Tir
    6: day < 23 ? '04' : '05', // Jul -> Tir or Mordad
    7: day < 23 ? '05' : '06', // Aug -> Mordad or Shahrivar
    8: day < 23 ? '06' : '07', // Sep -> Shahrivar or Mehr
    9: day < 23 ? '07' : '08', // Oct -> Mehr or Aban
    10: day < 22 ? '08' : '09', // Nov -> Aban or Azar
    11: day < 22 ? '09' : '10', // Dec -> Azar or Dey
  }

  return monthMapping[month] || '01'
}

/**
 * Get current period key
 */
export function getCurrentPeriodKey(): string {
  return `${getCurrentPersianYear()}-${getCurrentPersianMonth()}`
}

/**
 * Generate list of recent periods for filtering
 * @param count - Number of periods to generate
 */
export function getRecentPeriods(count = 12): { key: string; label: string }[] {
  const currentYear = getCurrentPersianYear()
  const currentMonth = parseInt(getCurrentPersianMonth())

  const periods: { key: string; label: string }[] = []

  let year = currentYear
  let month = currentMonth

  for (let i = 0; i < count; i++) {
    const monthKey = month.toString().padStart(2, '0')
    const periodKey = `${year}-${monthKey}`
    const monthInfo = PERSIAN_MONTHS.find((m) => m.key === monthKey)

    periods.push({
      key: periodKey,
      label: `${monthInfo?.name || monthKey} ${year}`,
    })

    // Move to previous month
    month--
    if (month < 1) {
      month = 12
      year--
    }
  }

  return periods
}

/**
 * Get Gregorian date bounds for a Persian period
 * This is an approximation based on typical month transitions
 * @param periodKey - Format: "YYYY-MM" (e.g., "1403-10")
 * @returns { startDate, endDate } in Gregorian calendar
 */
export function getPersianPeriodBounds(periodKey: string): {
  startDate: Date
  endDate: Date
} {
  const [yearStr, monthStr] = periodKey.split('-')
  const persianYear = parseInt(yearStr)
  const persianMonth = parseInt(monthStr)

  // Convert Persian year to Gregorian year (approximate)
  const gregorianYear = persianYear + 621

  // Approximate Gregorian month for each Persian month
  // Persian months 1-6 have 31 days, 7-11 have 30 days, 12 has 29/30 days
  const monthTransitions: Record<
    number,
    { startMonth: number; startDay: number; endMonth: number; endDay: number }
  > = {
    1: { startMonth: 3, startDay: 21, endMonth: 4, endDay: 20 }, // Farvardin (Mar 21 - Apr 20)
    2: { startMonth: 4, startDay: 21, endMonth: 5, endDay: 21 }, // Ordibehesht (Apr 21 - May 21)
    3: { startMonth: 5, startDay: 22, endMonth: 6, endDay: 21 }, // Khordad (May 22 - Jun 21)
    4: { startMonth: 6, startDay: 22, endMonth: 7, endDay: 22 }, // Tir (Jun 22 - Jul 22)
    5: { startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 }, // Mordad (Jul 23 - Aug 22)
    6: { startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 }, // Shahrivar (Aug 23 - Sep 22)
    7: { startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 }, // Mehr (Sep 23 - Oct 22)
    8: { startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 }, // Aban (Oct 23 - Nov 21)
    9: { startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 }, // Azar (Nov 22 - Dec 21)
    10: { startMonth: 12, startDay: 22, endMonth: 1, endDay: 20 }, // Dey (Dec 22 - Jan 20)
    11: { startMonth: 1, startDay: 21, endMonth: 2, endDay: 19 }, // Bahman (Jan 21 - Feb 19)
    12: { startMonth: 2, startDay: 20, endMonth: 3, endDay: 20 }, // Esfand (Feb 20 - Mar 20)
  }

  const transition = monthTransitions[persianMonth]
  if (!transition) {
    throw new Error(`Invalid Persian month: ${persianMonth}`)
  }

  // Handle year transitions for months 10, 11, 12
  const startYear =
    persianMonth >= 10 ? gregorianYear : gregorianYear
  const endYear =
    persianMonth >= 10 ? gregorianYear + 1 : gregorianYear

  const startDate = new Date(
    startYear,
    transition.startMonth - 1,
    transition.startDay
  )
  const endDate = new Date(endYear, transition.endMonth - 1, transition.endDay)

  return { startDate, endDate }
}
