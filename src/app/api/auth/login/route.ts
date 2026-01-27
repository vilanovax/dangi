import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'
import { verifyPassword, generateToken, hashPassword } from '@/lib/utils/auth'
import { checkRateLimit, getClientIp } from '@/lib/utils/rate-limiter'
import { logger, logAuthAttempt, logApiError } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per minute, 15min block after exceeding
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(`login:${clientIp}`, {
      maxRequests: 5,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
    })

    if (!rateLimitResult.success) {
      const resetTime = new Date(rateLimitResult.resetTime).toLocaleTimeString('fa-IR')
      const blockedUntil = rateLimitResult.blockedUntil
        ? new Date(rateLimitResult.blockedUntil).toLocaleTimeString('fa-IR')
        : null

      return NextResponse.json(
        {
          error: blockedUntil
            ? `تعداد تلاش‌های ناموفق زیاد است. لطفاً تا ${blockedUntil} صبر کنید`
            : 'تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید',
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { phone, password } = body

    // Validation
    if (!phone || !password) {
      return NextResponse.json(
        { error: 'شماره موبایل و رمز عبور الزامی است' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { phone },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'کاربری با این شماره یافت نشد' },
        { status: 401 }
      )
    }

    // Verify password
    const { valid, needsMigration } = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json(
        { error: 'رمز عبور اشتباه است' },
        { status: 401 }
      )
    }

    // Auto-migrate old SHA-256 passwords to bcrypt
    if (needsMigration) {
      const newHash = await hashPassword(password)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      })
      logger.info('Password migrated to bcrypt', { userId: user.id })
    }

    // Generate auth token and set cookie
    const token = generateToken(user.id)
    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    })
  } catch (error) {
    logApiError(error, { context: 'POST /api/auth/login' })
    return NextResponse.json(
      { error: 'خطا در ورود' },
      { status: 500 }
    )
  }
}
