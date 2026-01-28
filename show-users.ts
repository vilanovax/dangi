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

async function main() {
  console.log('\n🔍 در حال دریافت لیست کاربران...\n')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      password: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log('📋 کاربران ثبت‌نام شده:\n')

  if (users.length === 0) {
    console.log('❌ هیچ کاربری ثبت‌نام نکرده است!')
    console.log('\n💡 برای ایجاد کاربر تست:')
    console.log('   npx tsx scripts/create-test-user.ts')
  } else {
    users.forEach((user, i) => {
      const isBcrypt = user.password.startsWith('$2')
      console.log(`${i + 1}. ${user.name}`)
      console.log(`   📱 شماره: ${user.phone}`)
      console.log(`   🔐 هش: ${isBcrypt ? 'bcrypt (امن ✅)' : 'SHA-256 (قدیمی)'}`)
      console.log(`   📅 تاریخ: ${new Date(user.createdAt).toLocaleDateString('fa-IR')}`)
      console.log(`   🆔 ID: ${user.id}`)
      console.log()
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`\n✅ مجموع: ${users.length} کاربر`)
    console.log('\n⚠️  توجه: رمزهای عبور هش شده‌اند و قابل بازیابی نیستند.')
    console.log('\n💡 برای ایجاد کاربر تست با رمز 12345678:')
    console.log('   npx tsx scripts/create-test-user.ts')
  }

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('❌ خطا:', error.message)
  process.exit(1)
})
