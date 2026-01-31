/**
 * Script to check expenses in database
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'

config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Find building project
  const project = await prisma.project.findFirst({
    where: { name: { contains: 'ظفر' } }
  })

  if (!project) {
    console.error('❌ Project not found')
    return
  }

  console.log(`\n📦 پروژه: ${project.name} (${project.id})`)
  console.log(`📅 Template: ${project.template}\n`)

  // Get all expenses
  const expenses = await prisma.expense.findMany({
    where: { projectId: project.id },
    include: {
      paidBy: true,
      shares: {
        include: {
          participant: true
        }
      }
    },
    orderBy: { expenseDate: 'desc' }
  })

  console.log(`💰 تعداد کل هزینه‌ها: ${expenses.length}\n`)

  if (expenses.length > 0) {
    console.log('لیست هزینه‌ها:')
    console.log('─'.repeat(80))

    expenses.forEach((exp, i) => {
      console.log(`\n${i + 1}. ${exp.title}`)
      console.log(`   مبلغ: ${exp.amount.toLocaleString('fa-IR')} تومان`)
      console.log(`   پرداخت‌کننده: ${exp.paidBy.name}`)
      console.log(`   تاریخ: ${exp.expenseDate.toISOString().split('T')[0]}`)
      console.log(`   دوره: ${exp.periodKey || 'ندارد'}`)
      console.log(`   تعداد سهم: ${exp.shares.length}`)
    })

    // Group by periodKey
    const byPeriod = expenses.reduce((acc, exp) => {
      const key = exp.periodKey || 'بدون دوره'
      if (!acc[key]) acc[key] = []
      acc[key].push(exp)
      return acc
    }, {} as Record<string, typeof expenses>)

    console.log('\n\n📊 گروه‌بندی بر اساس دوره:')
    console.log('─'.repeat(80))

    Object.entries(byPeriod).forEach(([period, exps]) => {
      const total = exps.reduce((sum, e) => sum + e.amount, 0)
      console.log(`\n${period}: ${exps.length} هزینه - مجموع: ${total.toLocaleString('fa-IR')} تومان`)
      exps.forEach(e => {
        console.log(`  • ${e.title}: ${e.amount.toLocaleString('fa-IR')} تومان`)
      })
    })
  }
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
