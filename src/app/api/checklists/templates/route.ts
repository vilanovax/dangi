/**
 * Checklist Templates API
 * GET /api/checklists/templates - Get all available templates
 * Public endpoint - no authentication required
 */

import { NextResponse } from 'next/server'
import { checklistTemplateCategories } from '@/lib/domain/checklist-templates'

/**
 * GET - Return all template categories with their templates
 * No authentication required - templates are public
 */
export async function GET() {
  try {
    return NextResponse.json({
      categories: checklistTemplateCategories,
    })
  } catch (error: unknown) {
    console.error('Error fetching checklist templates:', error)
    return NextResponse.json(
      {
        error: 'خطا در دریافت تمپلیت‌ها',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
