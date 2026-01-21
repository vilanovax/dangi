import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/utils/auth'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const userId = verifyToken(token)
    if (!userId) {
      return NextResponse.json(
        { error: 'توکن نامعتبر است' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error getting user:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات کاربر' },
      { status: 500 }
    )
  }
}

// Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const userId = verifyToken(token)
    if (!userId) {
      return NextResponse.json(
        { error: 'توکن نامعتبر است' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, avatar } = body

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'نام الزامی است' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        avatar: avatar || null,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی پروفایل' },
      { status: 500 }
    )
  }
}
