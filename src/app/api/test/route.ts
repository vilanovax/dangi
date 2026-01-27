import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logApiError } from '@/lib/utils/logger'

export async function GET() {
  try {
    // Simple test query
    const count = await prisma.project.count()
    return NextResponse.json({ success: true, projectCount: count })
  } catch (error) {
    logApiError(error, { context: 'GET /api/test' })
    return NextResponse.json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
