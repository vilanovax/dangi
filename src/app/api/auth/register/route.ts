import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'
import { hashPassword, generateToken } from '@/lib/utils/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password, name, avatar } = body

    // Validation
    if (!phone || !password || !name) {
      return NextResponse.json(
        { error: 'شماره موبایل، رمز عبور و نام الزامی است' },
        { status: 400 }
      )
    }

    // Validate phone format (Iranian mobile)
    const phoneRegex = /^09[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست' },
        { status: 400 }
      )
    }

    // Check password length
    if (password.length < 4) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'این شماره موبایل قبلاً ثبت شده' },
        { status: 400 }
      )
    }

    // Create user with hashed password
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        name: name.trim(),
        avatar: avatar || null, // آواتار JSON یا null
      },
    })

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
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: 'خطا در ثبت‌نام' },
      { status: 500 }
    )
  }
}
