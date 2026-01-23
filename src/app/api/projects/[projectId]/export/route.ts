import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { formatMoney } from '@/lib/utils/money'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

// Type for expense with relations from Prisma query
interface ExpenseWithRelations {
  id: string
  title: string
  amount: number
  description: string | null
  expenseDate: Date
  periodKey: string | null
  receiptUrl: string | null
  createdAt: Date
  paidBy: { id: string; name: string }
  category: { id: string; name: string } | null
  shares: Array<{
    amount: number
    weightAtTime: number
    participant: { id: string; name: string }
  }>
}

// Helper: Escape CSV values
function escapeCSV(value: string | null | undefined): string {
  if (!value) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Helper: Format date to Persian
function formatPersianDate(date: Date): string {
  return new Date(date).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Export project data
 * Supports both JSON (backup) and CSV (Excel) formats
 *
 * Query params:
 * - format: 'json' (default) | 'csv'
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    // Get full project data with all relations
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            role: true,
            weight: true,
            percentage: true,
            avatar: true,
            createdAt: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        expenses: {
          include: {
            paidBy: {
              select: {
                id: true,
                name: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            shares: {
              include: {
                participant: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            expenseDate: 'desc',
          },
        },
        settlements: {
          include: {
            from: {
              select: {
                id: true,
                name: true,
              },
            },
            to: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            settledAt: 'desc',
          },
        },
        chargeRules: {
          select: {
            id: true,
            title: true,
            amount: true,
            frequency: true,
            splitType: true,
            isActive: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    // CSV Export
    if (format === 'csv') {
      // CSV Headers (Persian)
      const headers = [
        'ردیف',
        'عنوان',
        'مبلغ',
        'پرداخت‌کننده',
        'دسته‌بندی',
        'تاریخ',
        'توضیحات',
      ]

      // Build CSV rows
      const expenses = project.expenses as ExpenseWithRelations[]
      const rows: (string | number)[][] = expenses.map((expense: ExpenseWithRelations, index: number) => [
        index + 1,
        escapeCSV(expense.title),
        formatMoney(expense.amount, project.currency),
        escapeCSV(expense.paidBy.name),
        escapeCSV(expense.category?.name || 'بدون دسته'),
        formatPersianDate(expense.expenseDate),
        escapeCSV(expense.description),
      ])

      // Calculate total
      const total = expenses.reduce((sum: number, e: ExpenseWithRelations) => sum + e.amount, 0)
      rows.push([
        '',
        'جمع کل',
        formatMoney(total, project.currency),
        '',
        '',
        '',
        '',
      ])

      // Build CSV content with BOM for Excel UTF-8 support
      const BOM = '\uFEFF'
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map((row: (string | number)[]) => row.join(',')),
      ].join('\n')

      // Create response with CSV content
      const filename = `dangi-${project.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-')}-${formatPersianDate(new Date()).replace(/\//g, '-')}.csv`

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        },
      })
    }

    // JSON Export (default)
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project: {
        name: project.name,
        description: project.description,
        template: project.template,
        splitType: project.splitType,
        currency: project.currency,
        chargeYear: project.chargeYear,
        createdAt: project.createdAt,
      },
      participants: project.participants,
      categories: project.categories,
      expenses: project.expenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        description: e.description,
        expenseDate: e.expenseDate,
        periodKey: e.periodKey,
        receiptUrl: e.receiptUrl,
        paidBy: e.paidBy,
        category: e.category,
        shares: e.shares.map((s) => ({
          amount: s.amount,
          weightAtTime: s.weightAtTime,
          participant: s.participant,
        })),
        createdAt: e.createdAt,
      })),
      settlements: project.settlements.map((s) => ({
        id: s.id,
        amount: s.amount,
        note: s.note,
        receiptUrl: s.receiptUrl,
        settledAt: s.settledAt,
        from: s.from,
        to: s.to,
        createdAt: s.createdAt,
      })),
      chargeRules: project.chargeRules,
    }

    // Return as downloadable JSON file
    const filename = `dangi-backup-${project.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting project:', error)
    return NextResponse.json({ error: 'خطا در اکسپورت پروژه' }, { status: 500 })
  }
}
