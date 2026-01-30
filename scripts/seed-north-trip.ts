/**
 * Seed script for North Trip (سفر شمال)
 * Creates 4 participants and 10 random expenses
 */

import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'

// Random amount generator (between min and max in toman)
function randomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000
}

// Random date in last 7 days
function randomDate(): Date {
  const daysAgo = Math.floor(Math.random() * 7)
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
}

// Random element from array
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  console.log('🌊 Seeding North Trip data...\n')

  // 4 participants for the trip
  const participantNames = ['علی', 'محمد', 'سارا', 'مریم']
  const participantAvatars = ['👨', '🧔', '👩', '👧']

  // Trip expenses categories and items
  const expenseItems = [
    { title: 'اجاره ویلا', category: 'اقامت', min: 2000, max: 5000, icon: '🏠' },
    { title: 'خرید میوه', category: 'خوراک', min: 200, max: 500, icon: '🍎' },
    { title: 'رستوران ساحلی', category: 'خوراک', min: 500, max: 1500, icon: '🍽️' },
    { title: 'بنزین', category: 'حمل‌ونقل', min: 300, max: 600, icon: '⛽' },
    { title: 'عوارض آزادراه', category: 'حمل‌ونقل', min: 50, max: 150, icon: '🛣️' },
    { title: 'خرید ماهی تازه', category: 'خوراک', min: 300, max: 800, icon: '🐟' },
    { title: 'قایق سواری', category: 'تفریح', min: 200, max: 600, icon: '🚤' },
    { title: 'خرید سوغاتی', category: 'خرید', min: 100, max: 400, icon: '🎁' },
    { title: 'کباب شب', category: 'خوراک', min: 400, max: 900, icon: '🍢' },
    { title: 'صبحانه کافه', category: 'خوراک', min: 150, max: 350, icon: '☕' },
    { title: 'پارکینگ ساحل', category: 'حمل‌ونقل', min: 30, max: 100, icon: '🅿️' },
    { title: 'اسکی روی آب', category: 'تفریح', min: 300, max: 700, icon: '🎿' },
  ]

  // Create project
  console.log('📁 Creating project...')
  const project = await prisma.project.create({
    data: {
      name: 'سفر شمال 🌊',
      description: 'سفر گروهی به شمال - زمستان ۱۴۰۳',
      currency: 'تومان',
      template: 'travel',
    },
  })
  console.log(`  ✓ Project: ${project.name}`)

  // Create categories
  console.log('\n📂 Creating categories...')
  const categoryData = [
    { name: 'اقامت', icon: '🏠' },
    { name: 'خوراک', icon: '🍽️' },
    { name: 'حمل‌ونقل', icon: '🚗' },
    { name: 'تفریح', icon: '🎉' },
    { name: 'خرید', icon: '🛍️' },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoryData) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        icon: cat.icon,
        projectId: project.id,
      },
    })
    categories[cat.name] = created.id
    console.log(`  ✓ ${cat.icon} ${cat.name}`)
  }

  // Create participants
  console.log('\n👥 Creating participants...')
  const participants: { id: string; name: string }[] = []
  for (let i = 0; i < participantNames.length; i++) {
    const p = await prisma.participant.create({
      data: {
        name: participantNames[i],
        avatar: participantAvatars[i],
        projectId: project.id,
      },
    })
    participants.push({ id: p.id, name: p.name })
    console.log(`  ✓ ${participantAvatars[i]} ${participantNames[i]}`)
  }

  // Create 10 random expenses
  console.log('\n💸 Creating expenses...')
  const selectedExpenses = [...expenseItems]
    .sort(() => Math.random() - 0.5)
    .slice(0, 10)

  let totalAmount = 0

  for (const item of selectedExpenses) {
    const amount = randomAmount(item.min, item.max)
    const paidBy = randomFrom(participants)
    const date = randomDate()

    totalAmount += amount

    // Random split: either equal or paid by one
    const splitType = Math.random() > 0.3 ? 'equal' : 'single'

    const expense = await prisma.expense.create({
      data: {
        title: item.title,
        amount: amount,
        expenseDate: date,
        paidById: paidBy.id,
        categoryId: categories[item.category],
        projectId: project.id,
        shares: {
          create:
            splitType === 'equal'
              ? participants.map((p) => ({
                  participantId: p.id,
                  amount: Math.floor(amount / participants.length),
                }))
              : [
                  {
                    participantId: paidBy.id,
                    amount: amount,
                  },
                ],
        },
      },
    })

    console.log(
      `  ✓ ${item.icon} ${item.title}: ${amount.toLocaleString('fa-IR')} تومان (پرداخت: ${paidBy.name})`
    )
  }

  console.log('\n' + '═'.repeat(50))
  console.log('✅ Seeding completed!')
  console.log('═'.repeat(50))
  console.log(`
📊 Summary:
  🆔 Project ID: ${project.id}
  👥 Participants: ${participants.length} نفر
  💰 Total Expenses: ${totalAmount.toLocaleString('fa-IR')} تومان
  📝 Expense Count: 10

🔗 Open: http://localhost:3000/project/${project.id}
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
