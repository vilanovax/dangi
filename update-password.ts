import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
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
  const phone = '09123370467'
  const newPassword = '12345678'

  console.log('\n🔧 در حال بروزرسانی رمز عبور...\n')

  // Find the user
  const user = await prisma.user.findUnique({
    where: { phone },
  })

  if (!user) {
    console.log(`❌ کاربری با شماره ${phone} یافت نشد!`)
    await prisma.$disconnect()
    process.exit(1)
  }

  console.log(`👤 کاربر: ${user.name}`)
  console.log(`📱 شماره: ${user.phone}`)

  // Hash the new password with bcrypt
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update the user's password
  await prisma.user.update({
    where: { phone },
    data: { password: hashedPassword },
  })

  console.log('\n✅ رمز عبور با موفقیت به bcrypt تبدیل و بروزرسانی شد!')
  console.log('\n📱 اطلاعات ورود جدید:')
  console.log(`   شماره موبایل: ${phone}`)
  console.log(`   رمز عبور: ${newPassword}`)
  console.log(`   نام: ${user.name}`)

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('❌ خطا:', error.message)
  process.exit(1)
})
