import { NextRequest, NextResponse } from 'next/server'
import { getProjectById } from '@/lib/services/project.service'
import { prisma } from '@/lib/db/prisma'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

/**
 * Export project data as JSON backup
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params

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

    // Create backup object
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
