import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/utils/auth'

/**
 * POST /api/projects/restore
 * بازگردانی پروژه از فایل بک‌آپ JSON
 */
export async function POST(request: NextRequest) {
  try {
    // بررسی احراز هویت
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    // دریافت فایل از FormData
    const formData = await request.formData()
    const file = formData.get('backup') as File

    if (!file) {
      return NextResponse.json(
        { error: 'فایل بک‌آپ یافت نشد' },
        { status: 400 }
      )
    }

    // خواندن و پارس کردن فایل JSON
    const text = await file.text()
    let backup: any

    try {
      backup = JSON.parse(text)
    } catch (error) {
      return NextResponse.json(
        { error: 'فایل JSON معتبر نیست' },
        { status: 400 }
      )
    }

    // بررسی ساختار بک‌آپ
    if (!backup.version || !backup.project || !backup.participants) {
      return NextResponse.json(
        { error: 'ساختار فایل بک‌آپ معتبر نیست' },
        { status: 400 }
      )
    }

    // ایجاد پروژه جدید با داده‌های بک‌آپ
    const newProject = await prisma.$transaction(async (tx) => {
      // 1. ایجاد پروژه
      const project = await tx.project.create({
        data: {
          name: `${backup.project.name} (بازگردانی شده)`,
          template: backup.project.template,
          currency: backup.project.currency,
          trackingOnly: backup.project.trackingOnly || false,
          splitType: backup.project.splitType || 'EQUAL',
        },
      })

      // 2. نقشه‌برداری ID های قدیم به جدید برای participants
      const participantIdMap = new Map<string, string>()

      // 3. ایجاد participants
      for (const p of backup.participants) {
        const participant = await tx.participant.create({
          data: {
            projectId: project.id,
            name: p.name,
            avatar: p.avatar || null,
            userId: p.user && p.user.phone === user.phone ? user.id : null,
            role: p.isOwner ? 'OWNER' : 'MEMBER',
          },
        })
        participantIdMap.set(p.id, participant.id)
      }

      // 4. نقشه‌برداری ID های قدیم به جدید برای categories
      const categoryIdMap = new Map<string, string>()

      // 5. ایجاد categories
      for (const c of backup.categories || []) {
        const category = await tx.category.create({
          data: {
            projectId: project.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
          },
        })
        categoryIdMap.set(c.id, category.id)
      }

      // 6. ایجاد expenses
      for (const e of backup.expenses || []) {
        const newPaidById = participantIdMap.get(e.paidBy.id)
        if (!newPaidById) continue

        const expense = await tx.expense.create({
          data: {
            projectId: project.id,
            title: e.title,
            amount: e.amount,
            description: e.description || null,
            paidById: newPaidById,
            categoryId: e.category ? categoryIdMap.get(e.category.id) || null : null,
            expenseDate: e.date ? new Date(e.date) : new Date(),
          },
        })

        // 7. ایجاد expense shares
        for (const s of e.shares || []) {
          const newParticipantId = participantIdMap.get(s.participantId)
          if (!newParticipantId) continue

          await tx.expenseShare.create({
            data: {
              expenseId: expense.id,
              participantId: newParticipantId,
              amount: s.amount,
            },
          })
        }
      }

      // 8. ایجاد settlements (اختیاری)
      for (const s of backup.settlements || []) {
        const newFromId = participantIdMap.get(s.from.id)
        const newToId = participantIdMap.get(s.to.id)

        if (newFromId && newToId) {
          await tx.settlement.create({
            data: {
              projectId: project.id,
              fromId: newFromId,
              toId: newToId,
              amount: s.amount,
            },
          })
        }
      }

      // 9. ایجاد shopping list items
      for (const item of backup.shoppingList || []) {
        const newAddedById = item.addedById
          ? participantIdMap.get(item.addedById)
          : null

        await tx.shoppingItem.create({
          data: {
            projectId: project.id,
            text: item.text,
            quantity: item.quantity || null,
            note: item.note || null,
            isChecked: item.isChecked || false,
            addedById: newAddedById || null,
          },
        })
      }

      return project
    })

    return NextResponse.json(
      {
        success: true,
        projectId: newProject.id,
        message: 'پروژه با موفقیت بازگردانی شد',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { error: 'خطا در بازگردانی بک‌آپ' },
      { status: 500 }
    )
  }
}
