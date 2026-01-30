/**
 * Seed script: Add 10 random sample transactions to family/personal project
 * Run: npx tsx scripts/seed-family-transactions.ts
 */

import { config } from 'dotenv'
config() // Load .env file

import { prisma } from '../src/lib/db/prisma'

// Sample data
const expenseTitles = [
  'شام رستوران',
  'خرید میوه و سبزی',
  'قبض برق',
  'قبض گاز',
  'بنزین',
  'سینما',
  'خرید لباس',
  'داروخانه',
  'نان و شیر',
  'اینترنت',
  'موبایل',
  'کتاب',
  'کافی‌شاپ',
  'آرایشگاه',
  'تاکسی',
]

const incomeTitles = [
  'حقوق',
  'پاداش',
  'فریلنس',
  'پروژه',
  'سود سپرده',
]

const expenseCategories = [
  { name: 'غذا', icon: '🍕' },
  { name: 'حمل‌ونقل', icon: '🚗' },
  { name: 'قبوض', icon: '💡' },
  { name: 'سرگرمی', icon: '🎬' },
  { name: 'لباس', icon: '👔' },
  { name: 'سلامت', icon: '💊' },
  { name: 'خرید', icon: '🛒' },
]

const incomeCategories = [
  { name: 'حقوق', icon: '💰' },
  { name: 'پاداش', icon: '🎁' },
  { name: 'پروژه', icon: '💼' },
]

// Random number between min and max
const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Random date in current Persian month
const randomDateThisMonth = () => {
  const now = new Date()
  const daysAgo = randomInt(0, 25)
  const date = new Date(now)
  date.setDate(date.getDate() - daysAgo)
  return date
}

// Random amount
const randomExpenseAmount = () => {
  const amounts = [
    randomInt(50000, 200000) * 10,      // Small expenses: 500k - 2M
    randomInt(200000, 1000000) * 10,    // Medium expenses: 2M - 10M
    randomInt(100000, 500000) * 10,     // Bills: 1M - 5M
  ]
  return amounts[randomInt(0, 2)]
}

const randomIncomeAmount = () => {
  const amounts = [
    randomInt(1000000, 5000000) * 10,   // Freelance: 10M - 50M
    randomInt(3000000, 10000000) * 10,  // Salary: 30M - 100M
  ]
  return amounts[randomInt(0, 1)]
}

async function main() {
  console.log('🌱 Starting seed...\n')

  // Find a family or personal project
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { template: 'family' },
        { template: 'personal' },
      ],
    },
    include: {
      participants: true,
      categories: true,
      incomeCategories: true,
    },
  })

  if (!project) {
    console.error('❌ No family/personal project found!')
    console.log('💡 Create a project first with template="family" or template="personal"')
    return
  }

  console.log(`✅ Found project: ${project.name} (${project.template})`)
  console.log(`👥 Participants: ${project.participants.length}`)

  if (project.participants.length === 0) {
    console.error('❌ No participants in project!')
    return
  }

  // Create categories if needed
  let expenseCats = project.categories
  if (expenseCats.length === 0) {
    console.log('\n📦 Creating expense categories...')
    for (const cat of expenseCategories) {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          projectId: project.id,
        },
      })
      expenseCats.push(created)
      console.log(`  ✓ ${cat.icon} ${cat.name}`)
    }
  }

  let incomeCats = project.incomeCategories
  if (incomeCats.length === 0) {
    console.log('\n💰 Creating income categories...')
    for (const cat of incomeCategories) {
      const created = await prisma.incomeCategory.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          projectId: project.id,
        },
      })
      incomeCats.push(created)
      console.log(`  ✓ ${cat.icon} ${cat.name}`)
    }
  }

  // Create 10 transactions (8 expenses + 2 incomes)
  console.log('\n💸 Creating transactions...\n')

  const transactions = []

  // 8 expenses
  for (let i = 0; i < 8; i++) {
    const participant = project.participants[randomInt(0, project.participants.length - 1)]
    const category = expenseCats[randomInt(0, expenseCats.length - 1)]
    const title = expenseTitles[randomInt(0, expenseTitles.length - 1)]
    const amount = randomExpenseAmount()
    const date = randomDateThisMonth()

    // Create expense with shares for all participants
    const expense = await prisma.expense.create({
      data: {
        title,
        amount,
        projectId: project.id,
        paidById: participant.id,
        categoryId: category.id,
        expenseDate: date,
        shares: {
          create: project.participants.map(p => ({
            participantId: p.id,
            amount: amount / project.participants.length,
            weightAtTime: 1,
          })),
        },
      },
    })

    transactions.push({
      type: 'expense',
      title,
      amount,
      date,
      category: category.name,
    })

    console.log(`  💸 ${title} - ${(amount / 10).toLocaleString('fa-IR')} تومان - ${category.icon} ${category.name}`)
  }

  // 2 incomes
  for (let i = 0; i < 2; i++) {
    const participant = project.participants[randomInt(0, project.participants.length - 1)]
    const category = incomeCats[randomInt(0, incomeCats.length - 1)]
    const title = incomeTitles[randomInt(0, incomeTitles.length - 1)]
    const amount = randomIncomeAmount()
    const date = randomDateThisMonth()

    const income = await prisma.income.create({
      data: {
        title,
        amount,
        projectId: project.id,
        receivedById: participant.id,
        categoryId: category.id,
        incomeDate: date,
      },
    })

    transactions.push({
      type: 'income',
      title,
      amount,
      date,
      category: category.name,
    })

    console.log(`  💰 ${title} - ${(amount / 10).toLocaleString('fa-IR')} تومان - ${category.icon} ${category.name}`)
  }

  // Summary
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const netBalance = totalIncome - totalExpenses

  console.log('\n📊 Summary:')
  console.log(`  💸 Expenses: ${(totalExpenses / 10).toLocaleString('fa-IR')} تومان (${transactions.filter(t => t.type === 'expense').length} items)`)
  console.log(`  💰 Income: ${(totalIncome / 10).toLocaleString('fa-IR')} تومان (${transactions.filter(t => t.type === 'income').length} items)`)
  console.log(`  📈 Net Balance: ${netBalance >= 0 ? '+' : ''}${(netBalance / 10).toLocaleString('fa-IR')} تومان`)

  console.log('\n✅ Seed completed successfully! 🎉')
  console.log(`\n💡 View your dashboard at: /project/${project.id}/family`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
