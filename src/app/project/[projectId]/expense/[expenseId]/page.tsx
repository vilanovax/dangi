'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { parseMoney } from '@/lib/utils/money'
import { getTemplateLabels } from '@/lib/domain/templates'
import type { TemplateLabels } from '@/lib/types/domain'
import {
  ExpenseHeader,
  ExpenseView,
  ExpenseEditForm,
  DeleteConfirmDialog,
} from './components'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface ExpenseShare {
  participantId: string
  participant: Participant
  amount: number
}

interface Expense {
  id: string
  title: string
  amount: number
  description?: string
  receiptUrl?: string
  expenseDate: string
  paidById: string
  paidBy: Participant
  categoryId?: string
  category?: Category
  shares: ExpenseShare[]
}

interface Project {
  id: string
  name: string
  currency: string
  template: string
  ownerId?: string
  participants: Participant[]
  categories: Category[]
}

// ─────────────────────────────────────────────────────────────
// Helper: Get current user ID from localStorage
// In a real app, this would come from auth context
// ─────────────────────────────────────────────────────────────

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('currentUserId')
}

// ─────────────────────────────────────────────────────────────
// Helper: Check if user can edit/delete this expense
// Rule: Owner of project OR the person who created the expense
// ─────────────────────────────────────────────────────────────

function canUserEditExpense(
  currentUserId: string | null,
  expense: Expense,
  project: Project
): boolean {
  if (!currentUserId) {
    // No auth - allow editing (simple app mode)
    return true
  }

  // Project owner can edit any expense
  if (project.ownerId === currentUserId) {
    return true
  }

  // Person who paid can edit their own expense
  if (expense.paidById === currentUserId) {
    return true
  }

  return false
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ExpenseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.projectId as string
  const expenseId = params.expenseId as string

  // Check if edit mode should be enabled from URL parameter
  const shouldAutoEdit = searchParams.get('edit') === 'true'

  // ── Data State ──────────────────────────────────────────────
  const [expense, setExpense] = useState<Expense | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [labels, setLabels] = useState<TemplateLabels | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── UI State ────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(shouldAutoEdit)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── Form State ──────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [paidById, setPaidById] = useState('')
  const [includedParticipantIds, setIncludedParticipantIds] = useState<string[]>([])

  // ── Permission ──────────────────────────────────────────────
  const currentUserId = getCurrentUserId()
  const canEdit = expense && project ? canUserEditExpense(currentUserId, expense, project) : false

  // ── Initialize Form ─────────────────────────────────────────

  const initFormState = useCallback((exp: Expense) => {
    setTitle(exp.title)
    setAmount(exp.amount.toString())
    setCategoryId(exp.categoryId || null)
    setPaidById(exp.paidById)
    setIncludedParticipantIds(exp.shares.map((s) => s.participantId))
  }, [])

  // ── Fetch Data ──────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, expenseRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/expenses/${expenseId}`),
        ])

        if (!projectRes.ok) throw new Error('پروژه یافت نشد')
        if (!expenseRes.ok) throw new Error('خرج یافت نشد')

        const projectData = await projectRes.json()
        const expenseData = await expenseRes.json()

        setProject(projectData.project)
        setExpense(expenseData.expense)

        const templateLabels = getTemplateLabels(projectData.project.template)
        setLabels(templateLabels)

        // Initialize form state with expense data
        initFormState(expenseData.expense)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, expenseId, initFormState])

  // ── Handlers ────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleStartEdit = useCallback(() => {
    setIsEditing(true)
    setError('')
  }, [])

  const handleCancelEdit = useCallback(() => {
    if (!expense) return
    initFormState(expense)
    setIsEditing(false)
    setError('')
  }, [expense, initFormState])

  const handleSave = useCallback(async () => {
    if (!labels) return

    // Validation
    if (!title.trim()) {
      setError('عنوان رو وارد کن')
      return
    }

    const parsedAmount = parseMoney(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('مبلغ باید بیشتر از صفر باشه')
      return
    }

    if (!paidById) {
      setError('پرداخت‌کننده رو انتخاب کن')
      return
    }

    if (includedParticipantIds.length === 0) {
      setError(`حداقل یک ${labels.participantTerm} باید انتخاب بشه`)
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          paidById,
          categoryId: categoryId || null,
          includedParticipantIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ذخیره')
      }

      const data = await res.json()
      setExpense(data.expense)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره')
    } finally {
      setSaving(false)
    }
  }, [title, amount, paidById, categoryId, includedParticipantIds, labels, projectId, expenseId])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در حذف')
      }

      // Navigate back to project page
      router.push(`/project/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }, [projectId, expenseId, router])

  const handleToggleParticipant = useCallback((participantId: string) => {
    setIncludedParticipantIds((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    )
  }, [])

  const handleSelectAllParticipants = useCallback(() => {
    if (project) {
      setIncludedParticipantIds(project.participants.map((p) => p.id))
    }
  }, [project])

  // ── Computed Values ─────────────────────────────────────────

  const getSharePreview = (): number | null => {
    const parsedAmount = parseMoney(amount)
    if (!parsedAmount || includedParticipantIds.length === 0) return null
    return parsedAmount / includedParticipantIds.length
  }

  const getHeaderTitle = (): string => {
    if (isEditing) return 'ویرایش خرج'
    return 'جزئیات خرج'
  }

  // ── Loading State ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Error State ─────────────────────────────────────────────

  if (!expense || !project || !labels) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center bg-gray-50 dark:bg-gray-950">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">😕</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400">{error || 'خرج یافت نشد'}</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 text-blue-500 hover:underline"
        >
          بازگشت
        </button>
      </div>
    )
  }

  // ── Main Render ─────────────────────────────────────────────

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-32">
      {/* Header */}
      <ExpenseHeader
        title={getHeaderTitle()}
        isEditing={isEditing}
        canEdit={canEdit}
        onBack={handleBack}
        onEdit={handleStartEdit}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      {/* Content */}
      {isEditing ? (
        <ExpenseEditForm
          // Form values
          title={title}
          amount={amount}
          categoryId={categoryId}
          paidById={paidById}
          includedParticipantIds={includedParticipantIds}
          // Project data
          participants={project.participants}
          categories={project.categories}
          currency={project.currency}
          labels={labels}
          // Handlers
          onTitleChange={setTitle}
          onAmountChange={setAmount}
          onCategoryChange={setCategoryId}
          onPaidByChange={setPaidById}
          onToggleParticipant={handleToggleParticipant}
          onSelectAllParticipants={handleSelectAllParticipants}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          // State
          saving={saving}
          sharePreview={getSharePreview()}
          error={error}
        />
      ) : (
        <ExpenseView
          title={expense.title}
          amount={expense.amount}
          description={expense.description}
          receiptUrl={expense.receiptUrl}
          currency={project.currency}
          expenseDate={expense.expenseDate}
          paidBy={expense.paidBy}
          category={expense.category}
          shares={expense.shares}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={deleting}
        expenseTitle={expense.title}
        expenseAmount={expense.amount}
        currency={project.currency}
      />
    </main>
  )
}
