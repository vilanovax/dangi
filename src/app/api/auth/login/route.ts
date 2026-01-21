import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'
import { verifyPassword, generateToken } from '@/lib/utils/auth'

export async function POST(request: NextRequest) {
  try {
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
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'رمز عبور اشتباه است' },
        { status: 401 }
      )
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
    console.error('Error logging in:', error)
    return NextResponse.json(
      { error: 'خطا در ورود' },
      { status: 500 }
    )
  }
}
