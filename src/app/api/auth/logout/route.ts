import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logApiError } from '@/lib/utils/logger'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(error, { context: 'POST /api/auth/logout' })
    return NextResponse.json(
      { error: 'خطا در خروج' },
      { status: 500 }
    )
  }
}
