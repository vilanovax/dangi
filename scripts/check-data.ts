import { config } from 'dotenv'
config()

import { prisma } from '../src/lib/db/prisma'

async function checkData() {
  // Find family project
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { template: 'family' },
        { template: 'personal' }
      ]
    }
  })

  if (!project) {
    console.log('❌ No family/personal project found')
    return
  }

  console.log('✅ Project:', project.name, '(', project.id, ')')

  // Check expenses
  const expenses = await prisma.expense.findMany({
    where: { projectId: project.id },
    include: { category: true },
    orderBy: { expenseDate: 'desc' },
    take: 10
  })

  console.log('\n📊 Expenses in database:', expenses.length)
  expenses.forEach(e => {
    console.log('  -', e.title, '|', (e.amount / 10).toLocaleString('fa-IR'), 'تومان |', e.expenseDate.toISOString().split('T')[0], '| Category:', e.category?.name || 'N/A')
  })

  // Check incomes
  const incomes = await prisma.income.findMany({
    where: { projectId: project.id },
    include: { category: true },
    orderBy: { incomeDate: 'desc' },
    take: 5
  })

  console.log('\n💰 Incomes in database:', incomes.length)
  incomes.forEach(i => {
    console.log('  -', i.title, '|', (i.amount / 10).toLocaleString('fa-IR'), 'تومان |', i.incomeDate.toISOString().split('T')[0])
  })

  // Check budgets
  const budgets = await prisma.budget.findMany({
    where: { projectId: project.id },
    include: { category: true }
  })

  console.log('\n🎯 Budgets in database:', budgets.length)
  budgets.forEach(b => {
    console.log('  -', b.category.name, '|', (b.amount / 10).toLocaleString('fa-IR'), 'تومان | Period:', b.periodKey)
  })

  await prisma.$disconnect()
}

checkData().catch(console.error)
