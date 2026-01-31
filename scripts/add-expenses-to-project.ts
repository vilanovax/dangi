/**
 * Script to add random expenses to a project
 * Usage: npx tsx scripts/add-expenses-to-project.ts
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

const EXPENSE_TITLES = [
  'کیک تولد',
  'تزئینات',
  'بادکنک‌ها',
  'شمع و جاشمعی',
  'میوه و تنقلات',
  'نوشیدنی',
  'هدیه',
  'ظروف یکبار مصرف',
  'پذیرایی',
  'سفارش غذا'
]

function getRandomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, array.length))
}

async function main() {
  console.log('🔍 در حال جستجوی پروژه "تولد رها"...')

  // Find the project
  const project = await prisma.project.findFirst({
    where: {
      name: {
        contains: 'تولد'
      }
    },
    include: {
      participants: true
    }
  })

  if (!project) {
    console.error('❌ پروژه "تولد رها" پیدا نشد!')
    return
  }

  console.log(`✅ پروژه پیدا شد: ${project.name}`)
  console.log(`👥 تعداد شرکت‌کنندگان: ${project.participants.length}`)

  if (project.participants.length === 0) {
    console.error('❌ پروژه شرکت‌کننده ندارد!')
    return
  }

  // Get the first participant as payer (usually the creator)
  const payer = project.participants[0]

  console.log('\n💰 در حال ایجاد 10 هزینه تصادفی...\n')

  for (let i = 0; i < 10; i++) {
    const amount = getRandomAmount(300000, 900000)
    const title = EXPENSE_TITLES[i]

    // Randomly select participants for this expense (at least 1, max all)
    const numParticipants = Math.floor(Math.random() * project.participants.length) + 1
    const selectedParticipants = getRandomItems(project.participants, numParticipants)

    // Create expense
    const shareAmount = amount / selectedParticipants.length
    const expense = await prisma.expense.create({
      data: {
        projectId: project.id,
        title,
        amount,
        expenseDate: new Date(),
        paidById: payer.id,
        shares: {
          create: selectedParticipants.map(participant => ({
            participantId: participant.id,
            amount: shareAmount
          }))
        }
      }
    })

    const participantNames = selectedParticipants.map(p => p.name).join('، ')
    console.log(`${i + 1}. ${title}: ${amount.toLocaleString('fa-IR')} تومان`)
    console.log(`   پرداخت‌کننده: ${payer.name}`)
    console.log(`   تقسیم بین: ${participantNames}`)
    console.log(`   سهم هر نفر: ${(amount / selectedParticipants.length).toLocaleString('fa-IR')} تومان\n`)
  }

  console.log('✅ همه هزینه‌ها با موفقیت اضافه شدند!')
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
