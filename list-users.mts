import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({
    select: {
      name: true,
      phone: true,
      password: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  console.log('\n📋 کاربران ثبت‌نام شده:\n')

  if (users.length === 0) {
    console.log('❌ هیچ کاربری ثبت‌نام نکرده است!')
    console.log('\n💡 برای ورود یا ثبت‌نام:')
    console.log('   - شماره موبایل: 09xxxxxxxxx (11 رقم)')
    console.log('   - رمز عبور: حداقل 4 کاراکتر')
  } else {
    users.forEach((user, i) => {
      const isBcrypt = user.password.startsWith('$2')
      console.log(`${i + 1}. ${user.name}`)
      console.log(`   📱 شماره: ${user.phone}`)
      console.log(`   🔐 هش: ${isBcrypt ? 'bcrypt (امن ✅)' : 'SHA-256 (قدیمی)'}`)
      console.log(`   📅 تاریخ: ${new Date(user.createdAt).toLocaleDateString('fa-IR')}`)
      console.log()
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n⚠️  توجه: رمزهای عبور هش شده‌اند و قابل بازیابی نیستند.')
    console.log('\n💡 برای تست می‌توانید کاربر جدید با اطلاعات زیر ثبت‌نام کنید:')
    console.log('   📱 شماره: 09120000001')
    console.log('   🔐 رمز عبور: 12345678')
    console.log('   👤 نام: تست کاربر')
  }

  await prisma.$disconnect()
}

main().catch(console.error)
