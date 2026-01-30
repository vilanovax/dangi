import { getCurrentPeriod } from '../src/lib/utils/jalali'

console.log('Current Period:', getCurrentPeriod())
console.log('Today:', new Date().toISOString().split('T')[0])
