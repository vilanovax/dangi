'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Button, FloatingButton, Input, BottomSheet } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import Link from 'next/link'

interface Participant {
  id: string
  name: string
  role: string
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Expense {
  id: string
  title: string
  amount: number
  expenseDate: string
  paidBy: Participant
  category?: Category
}

interface Project {
  id: string
  name: string
  description: string | null
  template: string
  currency: string
  shareCode: string
  participants: Participant[]
  expenses: Expense[]
  categories: Category[]
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add member modal state
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('پروژه یافت نشد')

      const data = await res.json()
      setProject(data.project)
    } catch {
      setError('خطا در بارگذاری پروژه')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return

    setAddingMember(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMemberName.trim() }),
      })

      if (!res.ok) throw new Error('خطا در افزودن عضو')

      // Refresh project data
      await fetchProject()
      setNewMemberName('')
      setShowAddMember(false)
    } catch {
      alert('خطا در افزودن عضو')
    } finally {
      setAddingMember(false)
    }
  }

  const copyInviteLink = () => {
    if (!project) return
    navigator.clipboard.writeText(`${window.location.origin}/join/${project.shareCode}`)
    alert('لینک دعوت کپی شد!')
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-gray-500 mb-4">{error || 'پروژه یافت نشد'}</p>
        <Button onClick={() => router.push('/')}>بازگشت به خانه</Button>
      </div>
    )
  }

  const totalExpenses = project.expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <main className="min-h-dvh pb-24">
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 pt-4 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push('/')} className="p-2 -mr-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <Link href={`/project/${projectId}/settings`} className="p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-1">{project.name}</h1>
        <p className="text-blue-100 text-sm mb-4">
          {project.participants.length} نفر
        </p>

        {/* Total */}
        <div className="bg-white/20 rounded-2xl p-4 text-center">
          <p className="text-blue-100 text-sm mb-1">مجموع هزینه‌ها</p>
          <p className="text-3xl font-bold">{formatMoney(totalExpenses, project.currency)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-4">
        <Card className="flex gap-2 p-2">
          <Link
            href={`/project/${projectId}/expenses`}
            className="flex-1 py-3 text-center rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-medium"
          >
            هزینه‌ها
          </Link>
          <Link
            href={`/project/${projectId}/summary`}
            className="flex-1 py-3 text-center rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-medium"
          >
            تسویه حساب
          </Link>
        </Card>
      </div>

      {/* Participants */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">اعضا</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {project.participants.map((p) => (
            <div
              key={p.id}
              className="flex-shrink-0 w-16 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-1">
                <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  {p.name.charAt(0)}
                </span>
              </div>
              <p className="text-xs truncate">{p.name}</p>
              {p.role === 'OWNER' && (
                <span className="text-[10px] text-gray-400">مدیر</span>
              )}
            </div>
          ))}

          {/* Add Member Button */}
          <button
            onClick={() => setShowAddMember(true)}
            className="flex-shrink-0 w-16 text-center"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mx-auto mb-1">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">افزودن</p>
          </button>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">هزینه‌های اخیر</h2>
          {project.expenses.length > 0 && (
            <Link href={`/project/${projectId}/expenses`} className="text-sm text-blue-500">
              مشاهده همه
            </Link>
          )}
        </div>

        {project.expenses.length === 0 ? (
          <Card className="text-center py-8">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500 text-sm">هنوز هزینه‌ای ثبت نشده</p>
            <p className="text-gray-400 text-xs mt-1">
              اولین هزینه را اضافه کنید
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {project.expenses.slice(0, 5).map((expense) => (
              <Card key={expense.id} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: expense.category?.color || '#6B7280' + '20' }}
                >
                  <span>{expense.category?.icon || '📝'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{expense.title}</p>
                  <p className="text-xs text-gray-500">
                    {expense.paidBy.name} پرداخت کرد
                  </p>
                </div>
                <p className="font-semibold text-sm">
                  {formatMoney(expense.amount, project.currency)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <FloatingButton
        onClick={() => router.push(`/project/${projectId}/add-expense`)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
      >
        ثبت هزینه
      </FloatingButton>

      {/* Add Member Bottom Sheet */}
      <BottomSheet
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title="افزودن عضو جدید"
      >
        <div className="space-y-4">
          <Input
            label="نام عضو"
            placeholder="مثلاً: محمد"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            autoFocus
          />

          <Button
            onClick={handleAddMember}
            loading={addingMember}
            disabled={!newMemberName.trim()}
            className="w-full"
          >
            افزودن
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">یا</span>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={copyInviteLink}
            className="w-full"
          >
            کپی لینک دعوت
          </Button>
        </div>
      </BottomSheet>
    </main>
  )
}
