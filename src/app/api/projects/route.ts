import { NextRequest, NextResponse } from 'next/server'
import { createProject } from '@/lib/services/project.service'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, ownerName, template } = body

    if (!name || !ownerName) {
      return NextResponse.json(
        { error: 'نام پروژه و نام شما الزامی است' },
        { status: 400 }
      )
    }

    const { project, ownerToken } = await createProject({
      name,
      ownerName,
      template,
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set(`session_${project.id}`, ownerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'خطا در ساخت پروژه' },
      { status: 500 }
    )
  }
}
