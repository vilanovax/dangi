/**
 * Script to clear all expenses from building project
 * Usage: npx tsx scripts/clear-building-expenses.ts
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
  console.log('🔍 در حال جستجوی پروژه "ظفر ۴۰۴"...\n')

  const project = await prisma.project.findFirst({
    where: { name: { contains: 'ظفر' } }
  })

  if (!project) {
    console.error('❌ پروژه پیدا نشد!')
    return
  }

  console.log(`✅ پروژه پیدا شد: ${project.name}\n`)

  // First delete all expense shares
  const sharesDeleted = await prisma.expenseShare.deleteMany({
    where: {
      expense: {
        projectId: project.id
      }
    }
  })

  console.log(`🗑️  ${sharesDeleted.count} سهم هزینه پاک شد`)

  // Then delete all expenses
  const expensesDeleted = await prisma.expense.deleteMany({
    where: { projectId: project.id }
  })

  console.log(`🗑️  ${expensesDeleted.count} هزینه پاک شد`)
  console.log('\n✅ همه هزینه‌ها با موفقیت پاک شدند!')
}

main()
  .catch(e => console.error('❌ خطا:', e))
  .finally(() => prisma.$disconnect())
