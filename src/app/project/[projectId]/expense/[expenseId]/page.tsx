'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, BottomSheet, Card, Avatar } from '@/components/ui'
import { formatInputAmount, parseMoney, getCurrencyLabel, formatMoney } from '@/lib/utils/money'
import { getTemplateLabels } from '@/lib/domain/templates'
import type { TemplateLabels } from '@/lib/types/domain'
import { deserializeAvatar } from '@/lib/types/avatar'

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
  participants: Participant[]
  categories: Category[]
}

export default function ExpenseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const expenseId = params.expenseId as string

  const [expense, setExpense] = useState<Expense | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [labels, setLabels] = useState<TemplateLabels | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [paidById, setPaidById] = useState('')
  const [includedParticipantIds, setIncludedParticipantIds] = useState<string[]>([])

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId, expenseId])

  const fetchData = async () => {
    try {
      const [projectRes, expenseRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/expenses/${expenseId}`),
      ])

      if (!projectRes.ok) throw new Error('پروژه یافت نشد')
      if (!expenseRes.ok) throw new Error('هزینه یافت نشد')

      const projectData = await projectRes.json()
      const expenseData = await expenseRes.json()

      setProject(projectData.project)
      setExpense(expenseData.expense)

      const templateLabels = getTemplateLabels(projectData.project.template)
      setLabels(templateLabels)

      // Initialize form state
      setTitle(expenseData.expense.title)
      setAmount(expenseData.expense.amount.toString())
      setCategoryId(expenseData.expense.categoryId || null)
      setPaidById(expenseData.expense.paidById)
      setIncludedParticipantIds(expenseData.expense.shares.map((s: ExpenseShare) => s.participantId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!labels) return

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
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در حذف')
      }

      router.push(`/project/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const cancelEdit = () => {
    if (!expense) return
    setTitle(expense.title)
    setAmount(expense.amount.toString())
    setCategoryId(expense.categoryId || null)
    setPaidById(expense.paidById)
    setIncludedParticipantIds(expense.shares.map((s) => s.participantId))
    setIsEditing(false)
    setError('')
  }

  const toggleParticipant = (participantId: string) => {
    setIncludedParticipantIds((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    )
  }

  const getSharePreview = (): number | null => {
    const parsedAmount = parseMoney(amount)
    if (!parsedAmount || includedParticipantIds.length === 0) return null
    return parsedAmount / includedParticipantIds.length
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!expense || !project || !labels) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center">
        <p className="text-gray-500">{error || 'هزینه یافت نشد'}</p>
        <Button onClick={() => router.back()} className="mt-4">
          بازگشت
        </Button>
      </div>
    )
  }

  const sharePreview = getSharePreview()

  return (
    <main className="min-h-dvh pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold">{isEditing ? 'ویرایش هزینه' : 'جزئیات هزینه'}</h1>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-blue-500 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-500 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="p-4 space-y-5">
        {isEditing ? (
          <>
            {/* Edit Form */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <Input
                label={labels.expenseTitleLabel}
                placeholder={labels.expenseTitlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 text-center">
              <label className="block text-sm text-gray-500 mb-2">{labels.amountLabel}</label>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={labels.amountPlaceholder}
                  value={amount}
                  onChange={(e) => setAmount(formatInputAmount(e.target.value))}
                  className="text-3xl font-bold text-center w-full bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                />
                <span className="text-base text-gray-400 font-medium">
                  {getCurrencyLabel(project.currency)}
                </span>
              </div>
              {sharePreview !== null && includedParticipantIds.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  سهم هر {labels.participantTerm}:{' '}
                  <span className="text-gray-500">{formatMoney(sharePreview, project.currency)}</span>
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {labels.categoryLabel}
                <span className="text-gray-400 font-normal mr-1">(اختیاری)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId(null)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                    categoryId === null
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  بدون دسته
                </button>
                {project.categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`px-3 py-2 rounded-xl border-2 text-sm transition-all flex items-center gap-1.5 ${
                      categoryId === cat.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paid By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {labels.paidByLabel}
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                {project.participants.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPaidById(p.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full border-2 text-sm transition-all flex items-center gap-2 ${
                      paidById === p.id
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Avatar
                      avatar={deserializeAvatar(p.avatar || null, p.name)}
                      name={p.name}
                      size="sm"
                    />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Between */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {labels.splitBetweenLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setIncludedParticipantIds(project.participants.map((p) => p.id))}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  انتخاب همه
                </button>
              </div>

              <Card className="divide-y divide-gray-100 dark:divide-gray-800">
                {project.participants.map((p) => {
                  const isIncluded = includedParticipantIds.includes(p.id)
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => toggleParticipant(p.id)}
                      className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          avatar={deserializeAvatar(p.avatar || null, p.name)}
                          name={p.name}
                          size="md"
                        />
                        <span className={isIncluded ? '' : 'text-gray-400'}>{p.name}</span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          isIncluded
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isIncluded && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* View Mode */}
            <Card className="text-center py-6">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: (expense.category?.color || '#6B7280') + '20' }}
              >
                <span className="text-3xl">{expense.category?.icon || '📝'}</span>
              </div>
              <h2 className="text-xl font-bold mb-1">{expense.title}</h2>
              <p className="text-3xl font-bold text-blue-600">
                {formatMoney(expense.amount, project.currency)}
              </p>
              {expense.category && (
                <p className="text-sm text-gray-500 mt-2">{expense.category.name}</p>
              )}
            </Card>

            {/* Paid By */}
            <Card>
              <p className="text-sm text-gray-500 mb-2">پرداخت‌کننده</p>
              <div className="flex items-center gap-3">
                <Avatar
                  avatar={deserializeAvatar(expense.paidBy.avatar || null, expense.paidBy.name)}
                  name={expense.paidBy.name}
                  size="lg"
                />
                <div>
                  <p className="font-medium">{expense.paidBy.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(expense.expenseDate).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Card>

            {/* Split Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تقسیم بین {expense.shares.length} نفر
              </h3>
              <Card className="divide-y divide-gray-100 dark:divide-gray-800">
                {expense.shares.map((share) => (
                  <div
                    key={share.participantId}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        avatar={deserializeAvatar(
                          share.participant.avatar || null,
                          share.participant.name
                        )}
                        name={share.participant.name}
                        size="md"
                      />
                      <span>{share.participant.name}</span>
                    </div>
                    <span className="font-medium">
                      {formatMoney(share.amount, project.currency)}
                    </span>
                  </div>
                ))}
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Fixed Bottom Buttons */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-3">
            <Button variant="secondary" onClick={cancelEdit} className="flex-1">
              انصراف
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!title.trim() || !amount || !paidById || includedParticipantIds.length === 0}
              className="flex-1"
            >
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <BottomSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="حذف هزینه"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            آیا مطمئن هستید که می‌خواهید این هزینه را حذف کنید؟ این عمل قابل بازگشت نیست.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleDelete}
              loading={deleting}
              className="flex-1 !bg-red-500 hover:!bg-red-600"
            >
              حذف
            </Button>
          </div>
        </div>
      </BottomSheet>
    </main>
  )
}
