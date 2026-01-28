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
  const testUser = {
    phone: '09123456789',
    password: '12345678',
    name: 'کاربر تست',
  }

  console.log('\n🔧 در حال ایجاد کاربر تست...\n')

  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { phone: testUser.phone },
  })

  if (existing) {
    console.log('⚠️  کاربری با این شماره موجود است. در حال بروزرسانی رمز عبور...\n')
    
    const hashedPassword = await bcrypt.hash(testUser.password, 10)
    
    const updated = await prisma.user.update({
      where: { phone: testUser.phone },
      data: { password: hashedPassword },
    })

    console.log('✅ رمز عبور بروزرسانی شد!')
    console.log('\n📱 اطلاعات ورود:')
    console.log(`   شماره موبایل: ${updated.phone}`)
    console.log(`   رمز عبور: ${testUser.password}`)
    console.log(`   نام: ${updated.name}`)
  } else {
    const hashedPassword = await bcrypt.hash(testUser.password, 10)
    
    const user = await prisma.user.create({
      data: {
        phone: testUser.phone,
        password: hashedPassword,
        name: testUser.name,
      },
    })

    console.log('✅ کاربر تست با موفقیت ایجاد شد!')
    console.log('\n📱 اطلاعات ورود:')
    console.log(`   شماره موبایل: ${user.phone}`)
    console.log(`   رمز عبور: ${testUser.password}`)
    console.log(`   نام: ${user.name}`)
  }

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e.message)
    process.exit(1)
  })
