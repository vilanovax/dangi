import { config } from 'dotenv'
config()

import { getCurrentPeriod, parsePeriodKey } from '../src/lib/utils/jalali'

const currentPeriod = getCurrentPeriod()
console.log('Current Period:', currentPeriod)

const bounds = parsePeriodKey(currentPeriod)
console.log('Start Date:', bounds.startDate.toISOString().split('T')[0])
console.log('End Date:', bounds.endDate.toISOString().split('T')[0])
console.log('Today:', new Date().toISOString().split('T')[0])

// Check if our sample expenses fall within this period
const sampleExpenseDate = new Date('2026-01-27')
console.log('\nSample expense date:', sampleExpenseDate.toISOString().split('T')[0])
console.log('Is within period?', sampleExpenseDate >= bounds.startDate && sampleExpenseDate <= bounds.endDate)
