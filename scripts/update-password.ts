import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function updatePassword() {
  const phone = '09121941532'
  const newPassword = '123456'

  // Create Prisma client with adapter
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update the user
    const user = await prisma.user.update({
      where: { phone },
      data: { password: hashedPassword },
    })

    console.log(`✓ Password updated for user: ${user.name} (${user.phone})`)
  } catch (error) {
    console.error('Error updating password:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

updatePassword()
