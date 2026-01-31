/**
 * Script to add expenses and charges to building project
 * Usage: npx tsx scripts/add-building-data.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'

// Load environment variables
config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Expense categories for building
const EXPENSE_TITLES = [
  'تعمیرات آسانسور',
  'هزینه برق مشترک',
  'هزینه آب',
  'حقوق سرایدار',
  'خرید لوازم نظافت',
  'تعمیر درب ورودی',
  'هزینه گاز',
  'تعمیرات لوله‌کشی',
  'رنگ راه پله',
  'تعویض لامپ',
  'خرید سطل زباله',
  'تعمیر موتور آب',
  'شستشوی نما',
  'خرید کفش‌دوزک',
  'تعمیر پمپ آب'
]

// Fall months in Persian calendar (1403)
const FALL_MONTHS = [
  { key: '1403-07', name: 'مهر' },
  { key: '1403-08', name: 'آبان' },
  { key: '1403-09', name: 'آذر' }
]

function getRandomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomMonth() {
  return FALL_MONTHS[Math.floor(Math.random() * FALL_MONTHS.length)]
}

async function main() {
  console.log('🔍 در حال جستجوی پروژه "ظفر ۴۰۴"...\n')

  // Find the project
  const project = await prisma.project.findFirst({
    where: {
      name: {
        contains: 'ظفر'
      }
    },
    include: {
      participants: true
    }
  })

  if (!project) {
    console.error('❌ پروژه "ظفر ۴۰۴" پیدا نشد!')
    return
  }

  console.log(`✅ پروژه پیدا شد: ${project.name}`)
  console.log(`👥 تعداد شرکت‌کنندگان/واحدها: ${project.participants.length}\n`)

  if (project.participants.length === 0) {
    console.error('❌ پروژه شرکت‌کننده/واحدی ندارد!')
    return
  }

  // Get the first participant as payer (usually the manager)
  const payer = project.participants[0]

  // ============================================
  // Part 1: Add 15 random common expenses (WITHOUT periodKey)
  // ============================================
  console.log('💰 در حال ایجاد 15 هزینه عمومی...\n')

  for (let i = 0; i < 15; i++) {
    const amount = getRandomAmount(100000, 900000)
    const title = EXPENSE_TITLES[i]

    // Create common expense (no periodKey - these are building common expenses)
    await prisma.expense.create({
      data: {
        projectId: project.id,
        title,
        amount,
        expenseDate: new Date(),
        // NO periodKey - this makes it a common expense, not a charge
        paidById: payer.id,
        shares: {
          create: project.participants.map(participant => ({
            participantId: participant.id,
            amount: amount / project.participants.length
          }))
        }
      }
    })

    console.log(`${i + 1}. ${title}: ${amount.toLocaleString('fa-IR')} تومان`)
  }

  console.log('\n✅ همه هزینه‌ها اضافه شدند!\n')

  // ============================================
  // Part 2: Add 500,000 charge expenses for 3 fall months
  // ============================================
  console.log('📊 در حال ثبت شارژ 500,000 تومان برای 3 ماه پاییز...\n')

  let chargeCount = 0
  // Manager pays the charge, all units share equally
  const manager = project.participants.find(p => p.role === 'MANAGER') || project.participants[0]

  for (const month of FALL_MONTHS) {
    // Create one charge expense per month
    await prisma.expense.create({
      data: {
        projectId: project.id,
        title: `شارژ ${month.name}`,
        amount: 500000 * project.participants.length,
        expenseDate: new Date(),
        periodKey: month.key,
        paidById: manager.id,
        description: `شارژ ماهانه ${month.name} - 500,000 تومان برای هر واحد`,
        shares: {
          create: project.participants.map(participant => ({
            participantId: participant.id,
            amount: 500000
          }))
        }
      }
    })
    chargeCount++
    console.log(`✓ شارژ ${month.name}: ${project.participants.length} واحد × 500,000 = ${(500000 * project.participants.length).toLocaleString('fa-IR')} تومان`)
  }

  console.log(`\n✅ ${chargeCount} شارژ ماهانه ثبت شد!`)
  console.log(`📈 کل مبلغ شارژها: ${(chargeCount * 500000 * project.participants.length).toLocaleString('fa-IR')} تومان`)
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
