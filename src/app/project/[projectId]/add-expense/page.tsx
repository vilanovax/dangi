'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, Card, BottomSheet } from '@/components/ui'
import { formatInputAmount, parseMoney, getCurrencyLabel, formatMoney } from '@/lib/utils/money'
import { getTemplateLabels } from '@/lib/domain/templates'
import type { TemplateLabels } from '@/lib/types/domain'

interface Participant {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Project {
  id: string
  name: string
  currency: string
  splitType: string
  template: string
  participants: Participant[]
  categories: Category[]
}

export default function AddExpensePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [labels, setLabels] = useState<TemplateLabels | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state - ordered by UX priority
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [paidById, setPaidById] = useState('')
  const [includedParticipantIds, setIncludedParticipantIds] = useState<string[]>([])

  // Add category modal
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝')
  const [addingCategory, setAddingCategory] = useState(false)

  // Common emoji icons for categories
  const categoryIcons = ['🍕', '🚗', '🏨', '🎢', '🛍️', '💊', '🎬', '☕', '🎁', '📱', '✂️', '📝']

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('پروژه یافت نشد')

      const data = await res.json()
      setProject(data.project)

      // Load template labels
      const templateLabels = getTemplateLabels(data.project.template)
      setLabels(templateLabels)

      // Set defaults
      if (data.project.participants.length > 0) {
        // Default paid by = first participant (in real app, current user)
        setPaidById(data.project.participants[0].id)
        // Default included = all participants
        setIncludedParticipantIds(data.project.participants.map((p: Participant) => p.id))
      }
    } catch {
      setError('خطا در بارگذاری پروژه')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
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

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          paidById,
          categoryId: categoryId || undefined,
          includedParticipantIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || labels.errorMessage)
      }

      router.push(`/project/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !labels) return

    setAddingCategory(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
        }),
      })

      if (!res.ok) throw new Error('خطا در افزودن دسته‌بندی')

      const data = await res.json()

      // Add to local state and select it
      if (project) {
        setProject({
          ...project,
          categories: [...project.categories, data.category],
        })
        setCategoryId(data.category.id)
      }

      setNewCategoryName('')
      setNewCategoryIcon('📝')
      setShowAddCategory(false)
    } catch {
      setError('خطا در افزودن دسته‌بندی')
    } finally {
      setAddingCategory(false)
    }
  }

  const toggleParticipant = (participantId: string) => {
    setIncludedParticipantIds((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    )
  }

  const selectAllParticipants = () => {
    if (project) {
      setIncludedParticipantIds(project.participants.map((p) => p.id))
    }
  }

  // Calculate share preview
  const getSharePreview = () => {
    const parsedAmount = parseMoney(amount)
    if (!parsedAmount || includedParticipantIds.length === 0) return null

    // For MVP, only EQUAL split
    const shareAmount = parsedAmount / includedParticipantIds.length
    return shareAmount
  }

  // Check edge cases for helpful messages
  const getEdgeCaseMessage = () => {
    if (!labels || !project) return null

    // Only one person selected (and it's the payer)
    if (includedParticipantIds.length === 1 && includedParticipantIds[0] === paidById) {
      return labels.onlyForYouMessage
    }

    // Payer is not in the split
    if (paidById && !includedParticipantIds.includes(paidById)) {
      return labels.payerNotIncludedMessage
    }

    return null
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!project || !labels) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center">
        <p className="text-gray-500">{error || 'پروژه یافت نشد'}</p>
      </div>
    )
  }

  const sharePreview = getSharePreview()
  const edgeCaseMessage = getEdgeCaseMessage()

  return (
    <main className="min-h-dvh pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold">{labels.addExpenseTitle}</h1>
            <p className="text-xs text-gray-500">{labels.addExpenseSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* 1. Title */}
        <div>
          <Input
            label={labels.expenseTitleLabel}
            placeholder={labels.expenseTitlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-1">{labels.expenseTitleHelper}</p>
        </div>

        {/* 2. Amount - Big Input */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 text-center">
          <label className="block text-sm text-gray-500 mb-3">
            {labels.amountLabel}
          </label>
          <div className="flex items-center justify-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder={labels.amountPlaceholder}
              value={amount}
              onChange={(e) => setAmount(formatInputAmount(e.target.value))}
              className="text-4xl font-bold text-center w-full bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
            <span className="text-lg text-gray-400">{getCurrencyLabel(project.currency)}</span>
          </div>
          {sharePreview && (
            <p className="text-sm text-gray-500 mt-3">
              سهم هر {labels.participantTerm}: {formatMoney(sharePreview, project.currency)}
            </p>
          )}
        </div>

        {/* 3. Category Selection (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {labels.categoryLabel}
            <span className="text-gray-400 font-normal mr-1">(اختیاری)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {/* No category option */}
            <button
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
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`px-3 py-2 rounded-xl border-2 text-sm transition-all flex items-center gap-1 ${
                  categoryId === cat.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}

            {/* Add new category */}
            <button
              onClick={() => setShowAddCategory(true)}
              className="px-3 py-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-all"
            >
              ➕ افزودن دسته
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">{labels.categoryHelper}</p>
        </div>

        {/* 4. Paid By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {labels.paidByLabel}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {project.participants.map((p) => (
              <button
                key={p.id}
                onClick={() => setPaidById(p.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full border-2 text-sm transition-all ${
                  paidById === p.id
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">{labels.paidByHelper}</p>
        </div>

        {/* 5. Included Participants */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {labels.splitBetweenLabel}
            </label>
            <button
              onClick={selectAllParticipants}
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
                  key={p.id}
                  onClick={() => toggleParticipant(p.id)}
                  className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {p.name.charAt(0)}
                      </span>
                    </div>
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

          <p className="text-xs text-gray-400 mt-1">{labels.splitBetweenHelper}</p>

          {includedParticipantIds.length > 0 && sharePreview && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              {includedParticipantIds.length} {labels.participantTerm} × {formatMoney(sharePreview, project.currency)}
            </p>
          )}

          {/* Edge case message */}
          {edgeCaseMessage && (
            <p className="text-xs text-blue-500 mt-2 text-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
              {edgeCaseMessage}
            </p>
          )}
        </div>
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={!title.trim() || !amount || !paidById || includedParticipantIds.length === 0}
          className="w-full"
          size="lg"
        >
          {submitting ? labels.submittingButton : labels.submitButton}
        </Button>
      </div>

      {/* Add Category Bottom Sheet */}
      <BottomSheet
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        title="افزودن دسته‌بندی جدید"
      >
        <div className="space-y-4">
          <Input
            label="نام دسته‌بندی"
            placeholder={labels.addCategoryPlaceholder}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-gray-400">این دسته فقط برای همین پروژه استفاده می‌شه</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              آیکون
            </label>
            <div className="flex flex-wrap gap-2">
              {categoryIcons.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewCategoryIcon(icon)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    newCategoryIcon === icon
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAddCategory}
            loading={addingCategory}
            disabled={!newCategoryName.trim()}
            className="w-full"
          >
            افزودن
          </Button>
        </div>
      </BottomSheet>
    </main>
  )
}
