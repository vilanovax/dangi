import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireProjectAccess } from '@/lib/utils/auth'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

/**
 * GET /api/projects/:projectId/backup
 * دانلود بک‌آپ کامل از یک پروژه
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // دریافت اطلاعات کامل پروژه
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        categories: true,
        expenses: {
          include: {
            paidBy: true,
            shares: {
              include: {
                participant: true,
              },
            },
            category: true,
          },
        },
        settlements: {
          include: {
            from: true,
            to: true,
          },
        },
        shoppingItems: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // ساختار بک‌آپ
    const backup = {
      exportedAt: new Date().toISOString(),
      exportedBy: authResult.user.id,
      version: '1.0',
      project: {
        id: project.id,
        name: project.name,
        template: project.template,
        currency: project.currency,
        isArchived: project.isArchived,
        trackingOnly: project.trackingOnly,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      participants: project.participants.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isOwner: p.role === 'OWNER',
        createdAt: p.createdAt,
        user: p.user
          ? {
              name: p.user.name,
              phone: p.user.phone,
            }
          : null,
      })),
      categories: project.categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
      })),
      expenses: project.expenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        date: e.expenseDate,
        description: e.description,
        paidBy: {
          id: e.paidBy.id,
          name: e.paidBy.name,
        },
        category: e.category
          ? {
              id: e.category.id,
              name: e.category.name,
            }
          : null,
        shares: e.shares.map((s) => ({
          participantId: s.participantId,
          participantName: s.participant.name,
          amount: s.amount,
        })),
        createdAt: e.createdAt,
      })),
      settlements: project.settlements.map((s) => ({
        id: s.id,
        amount: s.amount,
        from: {
          id: s.from.id,
          name: s.from.name,
        },
        to: {
          id: s.to.id,
          name: s.to.name,
        },
        createdAt: s.createdAt,
      })),
      shoppingList: project.shoppingItems.map((item) => ({
        id: item.id,
        text: item.text,
        quantity: item.quantity,
        note: item.note,
        isChecked: item.isChecked,
        addedById: item.addedById,
        createdAt: item.createdAt,
      })),
    }

    // فایل نام (ASCII-safe for HTTP headers)
    const safeFileName = `dangi_backup_${project.id}_${new Date().toISOString().split('T')[0]}.json`

    // For browsers that support RFC 5987, also include the full name with Persian characters
    const fullFileName = `${project.name.replace(/[^a-zA-Z0-9-_\u0600-\u06FF]/g, '_')}_backup_${new Date().toISOString().split('T')[0]}.json`
    const encodedFileName = encodeURIComponent(fullFileName)

    // برگرداندن به صورت فایل JSON
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
      },
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
