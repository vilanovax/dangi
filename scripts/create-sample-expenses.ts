import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env') })

import { prisma } from '../src/lib/db/prisma'

async function main() {
  // Find project
  const project = await prisma.project.findFirst({
    where: { name: { contains: 'شمال' } },
    include: {
      participants: true,
      categories: true
    }
  })

  if (!project) {
    console.log('❌ پروژه یافت نشد')
    return
  }

  console.log('✅ پروژه پیدا شد:', project.name)
  console.log('📊 تعداد شرکت‌کنندگان:', project.participants.length)
  console.log('')

  if (project.participants.length === 0) {
    console.log('❌ هیچ شرکت‌کننده‌ای وجود ندارد')
    return
  }

  // Expense titles
  const expenseTitles = [
    'تعمیر آسانسور',
    'نظافت راه‌پله',
    'برق مشاعات',
    'آب مشاعات',
    'تعمیر موتورخانه',
    'نگهبانی',
    'تعمیر در ورودی',
    'رنگ‌آمیزی راه‌پله',
    'گاز مشاعات',
    'سرویس کولر',
    'تعمیر درب پارکینگ',
    'نظافت پارکینگ',
    'هزینه فضای سبز',
    'تعمیر چراغ راه‌پله',
    'سمپاشی'
  ]

  // Get random category if available
  const categories = project.categories || []

  console.log('🔄 در حال ایجاد ۱۵ هزینه نمونه...\n')

  const expenses = []

  for (let i = 0; i < 15; i++) {
    // Random amount between 100,000 and 950,000 (round numbers)
    const baseAmount = Math.floor(Math.random() * 18) + 2 // 2 to 19
    const amount = baseAmount * 50000 // 100k, 150k, 200k, ..., 950k

    // Random payer
    const randomPayer = project.participants[Math.floor(Math.random() * project.participants.length)]

    // Random category (if available)
    const randomCategory = categories.length > 0
      ? categories[Math.floor(Math.random() * categories.length)]
      : null

    const title = expenseTitles[i]

    // Random date in the last 30 days
    const daysAgo = Math.floor(Math.random() * 30)
    const expenseDate = new Date()
    expenseDate.setDate(expenseDate.getDate() - daysAgo)

    const expense = await prisma.expense.create({
      data: {
        title,
        amount,
        expenseDate,
        projectId: project.id,
        paidById: randomPayer.id,
        categoryId: randomCategory?.id,
        // No periodKey = common expense (not monthly charge)
        shares: {
          create: project.participants.map(p => ({
            participantId: p.id,
            amount: amount / project.participants.length,
            weightAtTime: p.weight
          }))
        }
      },
      include: {
        paidBy: true,
        category: true
      }
    })

    expenses.push(expense)
    console.log(`${i + 1}. ${title} - ${amount.toLocaleString('fa-IR')} تومان (پرداخت‌کننده: ${randomPayer.name})`)
  }

  console.log('\n✅ ۱۵ هزینه با موفقیت ایجاد شد!')
  console.log(`💰 مجموع هزینه‌ها: ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('fa-IR')} تومان`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('❌ خطا:', error)
    prisma.$disconnect()
    process.exit(1)
  })
