import { prisma } from '../src/lib/db/prisma'

// عناوین رندوم برای هزینه‌های مالی شخصی
const expenseTitles = [
  'خرید مواد غذایی',
  'رستوران',
  'کافه',
  'بنزین',
  'پارکینگ',
  'تاکسی اینترنتی',
  'مترو',
  'قبض برق',
  'قبض آب',
  'قبض گاز',
  'اینترنت',
  'تلفن همراه',
  'خرید لباس',
  'خرید کفش',
  'آرایشگاه',
  'داروخانه',
  'دکتر',
  'کتاب',
  'سینما',
  'ورزش',
  'هدیه',
  'لوازم خانگی',
  'تعمیرات',
  'خرید آنلاین',
  'سوپرمارکت',
]

// دسته‌بندی‌های پیش‌فرض برای مالی شخصی
const defaultCategories = [
  { name: 'خوراک و نوشیدنی', icon: '🍔', color: '#FF6B6B' },
  { name: 'حمل و نقل', icon: '🚗', color: '#4ECDC4' },
  { name: 'قبوض', icon: '📄', color: '#95E1D3' },
  { name: 'خرید', icon: '🛍️', color: '#F38181' },
  { name: 'سلامت', icon: '⚕️', color: '#AA96DA' },
  { name: 'سرگرمی', icon: '🎬', color: '#FCBAD3' },
  { name: 'دیگر', icon: '📝', color: '#A8D8EA' },
]

// تابع تولید تاریخ رندوم در 60 روز گذشته
function randomDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 60) // 0 تا 60 روز پیش
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return date
}

// تابع تولید مبلغ رندوم (تومان)
function randomAmount() {
  const amounts = [
    50000, 75000, 100000, 120000, 150000, 180000, 200000, 250000, 300000,
    350000, 400000, 500000, 600000, 750000, 1000000, 1200000, 1500000, 2000000,
  ]
  return amounts[Math.floor(Math.random() * amounts.length)]
}

// تابع انتخاب رندوم از آرایه
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function main() {
  console.log('🔍 جستجوی پروژه مالی شخصی...')

  // پیدا کردن یا ساخت یک پروژه مالی شخصی
  let project = await prisma.project.findFirst({
    where: { template: 'personal' },
    include: {
      participants: {
        where: { role: 'OWNER' },
      },
      categories: true,
    },
  })

  if (!project) {
    console.log('❌ پروژه مالی شخصی یافت نشد.')
    console.log(
      '💡 لطفاً ابتدا یک پروژه با template="personal" از طریق UI یا API ایجاد کنید.'
    )
    return
  }

  console.log(`✅ پروژه یافت شد: ${project.name}`)

  // پیدا کردن owner
  const owner = project.participants[0]
  if (!owner) {
    console.log('❌ مالک پروژه یافت نشد.')
    return
  }

  console.log(`✅ مالک پروژه: ${owner.name}`)

  // ایجاد دسته‌بندی‌ها اگر وجود ندارند
  if (project.categories.length === 0) {
    console.log('📁 ایجاد دسته‌بندی‌های پیش‌فرض...')
    for (const cat of defaultCategories) {
      await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          projectId: project.id,
        },
      })
    }
    // بارگذاری مجدد با دسته‌بندی‌ها
    project = (await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        participants: {
          where: { role: 'OWNER' },
        },
        categories: true,
      },
    }))!
    console.log(`✅ ${project.categories.length} دسته‌بندی ایجاد شد`)
  }

  console.log('💰 ایجاد 20 هزینه رندوم...')

  const expenses = []
  for (let i = 0; i < 20; i++) {
    const title = randomItem(expenseTitles)
    const amount = randomAmount()
    const category = randomItem(project.categories)
    const expenseDate = randomDate()

    const expense = await prisma.expense.create({
      data: {
        title,
        amount,
        expenseDate,
        projectId: project.id,
        paidById: owner.id,
        categoryId: category.id,
        shares: {
          create: {
            participantId: owner.id,
            amount,
            weightAtTime: 1,
          },
        },
      },
    })

    expenses.push(expense)
    console.log(
      `  ${i + 1}. ${title} - ${amount.toLocaleString('fa-IR')} تومان - ${category.name}`
    )
  }

  console.log(`\n✅ ${expenses.length} هزینه با موفقیت ایجاد شد!`)
  console.log(`📊 مجموع: ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('fa-IR')} تومان`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ خطا:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
