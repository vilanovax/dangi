/**
 * Seed script for Family Finance template
 * Adds test incomes, expenses, budgets, and recurring transactions
 */

import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'

async function main() {
  console.log('🌱 Seeding Family Finance data...')

  // Find or create a family project
  let familyProject = await prisma.project.findFirst({
    where: { template: 'family' },
    include: { participants: true, categories: true },
  })

  if (!familyProject) {
    console.log('❌ No Family project found. Please create one first.')
    return
  }

  console.log(`✓ Found Family project: ${familyProject.name}`)

  const participants = familyProject.participants
  if (participants.length === 0) {
    console.log('❌ No participants found. Please add participants first.')
    return
  }

  const participant1 = participants[0]
  const participant2 = participants[1] || participant1

  console.log(`✓ Using participants: ${participant1.name}, ${participant2.name}`)

  // Get or create income categories
  let incomeCategories = await prisma.incomeCategory.findMany({
    where: { projectId: familyProject.id },
  })

  if (incomeCategories.length === 0) {
    console.log('Creating income categories...')
    const categoriesToCreate = [
      { name: 'حقوق', icon: '💼' },
      { name: 'کسب‌وکار', icon: '🏢' },
      { name: 'سرمایه‌گذاری', icon: '📈' },
    ]

    for (const cat of categoriesToCreate) {
      await prisma.incomeCategory.create({
        data: {
          ...cat,
          projectId: familyProject.id,
        },
      })
    }

    incomeCategories = await prisma.incomeCategory.findMany({
      where: { projectId: familyProject.id },
    })
  }

  console.log(`✓ Income categories: ${incomeCategories.length}`)

  // Get expense categories
  const expenseCategories = familyProject.categories

  // Current Persian date (approximate): Dey 1403 = Dec 22, 2024 - Jan 20, 2025
  const currentDate = new Date()

  // Add Incomes
  console.log('\n💰 Adding incomes...')

  const incomesToAdd = [
    {
      title: 'حقوق ماهانه',
      amount: 50000000,
      receivedById: participant1.id,
      categoryId: incomeCategories[0]?.id,
      incomeDate: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      title: 'حقوق ماهانه',
      amount: 35000000,
      receivedById: participant2.id,
      categoryId: incomeCategories[0]?.id,
      incomeDate: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'پروژه فریلنس',
      amount: 15000000,
      receivedById: participant1.id,
      categoryId: incomeCategories[1]?.id,
      incomeDate: new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
  ]

  for (const income of incomesToAdd) {
    await prisma.income.create({
      data: {
        ...income,
        projectId: familyProject.id,
      },
    })
    console.log(`  ✓ ${income.title}: ${income.amount.toLocaleString('fa-IR')}`)
  }

  // Add Expenses
  console.log('\n📊 Adding expenses...')

  const expensesToAdd = [
    {
      title: 'خرید مواد غذایی',
      amount: 8000000,
      paidById: participant1.id,
      categoryId: expenseCategories.find((c) => c.name.includes('خوراک'))?.id,
      expenseDate: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'قبض برق',
      amount: 2500000,
      paidById: participant2.id,
      categoryId: expenseCategories.find((c) => c.name.includes('قبوض'))?.id,
      expenseDate: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'قبض گاز',
      amount: 1800000,
      paidById: participant2.id,
      categoryId: expenseCategories.find((c) => c.name.includes('قبوض'))?.id,
      expenseDate: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'بنزین',
      amount: 3000000,
      paidById: participant1.id,
      categoryId: expenseCategories.find((c) => c.name.includes('حمل'))?.id,
      expenseDate: new Date(currentDate.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'داروخانه',
      amount: 1500000,
      paidById: participant2.id,
      categoryId: expenseCategories.find((c) => c.name.includes('سلامت'))?.id,
      expenseDate: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'سینما',
      amount: 800000,
      paidById: participant1.id,
      categoryId: expenseCategories.find((c) => c.name.includes('تفریح'))?.id,
      expenseDate: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'رستوران',
      amount: 2000000,
      paidById: participant2.id,
      categoryId: expenseCategories.find((c) => c.name.includes('تفریح'))?.id,
      expenseDate: new Date(currentDate.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
  ]

  for (const expense of expensesToAdd) {
    if (!expense.categoryId) continue

    await prisma.expense.create({
      data: {
        title: expense.title,
        amount: expense.amount,
        paidById: expense.paidById,
        categoryId: expense.categoryId,
        expenseDate: expense.expenseDate,
        projectId: familyProject.id,
        shares: {
          create: [
            {
              participantId: expense.paidById,
              amount: expense.amount,
            },
          ],
        },
      },
    })
    console.log(`  ✓ ${expense.title}: ${expense.amount.toLocaleString('fa-IR')}`)
  }

  // Add Budgets
  console.log('\n💰 Adding budgets...')

  const currentPeriodKey = '1403-10' // Dey 1403

  const budgetsToAdd = [
    {
      categoryId: expenseCategories.find((c) => c.name.includes('خوراک'))?.id,
      amount: 10000000,
    },
    {
      categoryId: expenseCategories.find((c) => c.name.includes('قبوض'))?.id,
      amount: 5000000,
    },
    {
      categoryId: expenseCategories.find((c) => c.name.includes('حمل'))?.id,
      amount: 4000000,
    },
    {
      categoryId: expenseCategories.find((c) => c.name.includes('تفریح'))?.id,
      amount: 3000000,
    },
  ]

  for (const budget of budgetsToAdd) {
    if (!budget.categoryId) continue

    const category = expenseCategories.find((c) => c.id === budget.categoryId)
    await prisma.budget.upsert({
      where: {
        projectId_categoryId_periodKey: {
          projectId: familyProject.id,
          categoryId: budget.categoryId,
          periodKey: currentPeriodKey,
        },
      },
      create: {
        projectId: familyProject.id,
        categoryId: budget.categoryId,
        periodKey: currentPeriodKey,
        amount: budget.amount,
      },
      update: {
        amount: budget.amount,
      },
    })
    console.log(
      `  ✓ ${category?.name}: ${budget.amount.toLocaleString('fa-IR')}`
    )
  }

  // Add Recurring Transactions
  console.log('\n🔄 Adding recurring transactions...')

  const recurringToAdd = [
    {
      type: 'INCOME',
      title: 'حقوق ماهانه - ' + participant1.name,
      amount: 50000000,
      frequency: 'MONTHLY',
      participantId: participant1.id,
      categoryId: null, // Income doesn't use regular categories
      startDate: new Date('2024-01-01'),
      isActive: true,
    },
    {
      type: 'EXPENSE',
      title: 'اجاره خانه',
      amount: 20000000,
      frequency: 'MONTHLY',
      participantId: participant1.id,
      categoryId: expenseCategories.find((c) => c.name.includes('مسکن'))?.id,
      startDate: new Date('2024-01-01'),
      isActive: true,
    },
    {
      type: 'EXPENSE',
      title: 'پس‌انداز ماهانه',
      amount: 10000000,
      frequency: 'MONTHLY',
      participantId: participant1.id,
      categoryId: expenseCategories.find((c) => c.name.includes('پس‌انداز'))?.id,
      startDate: new Date('2024-01-01'),
      isActive: true,
    },
  ]

  for (const recurring of recurringToAdd) {
    const { categoryId, ...data } = recurring
    await prisma.recurringTransaction.create({
      data: {
        ...data,
        ...(categoryId && { categoryId }), // Only add if not null
        projectId: familyProject.id,
      },
    })
    console.log(`  ✓ ${recurring.title}`)
  }

  console.log('\n✅ Seeding completed successfully!')
  console.log(`
📊 Summary:
  - Incomes: ${incomesToAdd.length} items (Total: ${incomesToAdd.reduce((sum, i) => sum + i.amount, 0).toLocaleString('fa-IR')} IRR)
  - Expenses: ${expensesToAdd.length} items (Total: ${expensesToAdd.reduce((sum, e) => sum + e.amount, 0).toLocaleString('fa-IR')} IRR)
  - Budgets: ${budgetsToAdd.filter((b) => b.categoryId).length} categories
  - Recurring: ${recurringToAdd.length} transactions
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
