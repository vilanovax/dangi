'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, BottomSheet } from '@/components/ui'
import { parseMoney } from '@/lib/utils/money'
import { getTemplate } from '@/lib/domain/templates'
import type { TemplateDefinition } from '@/lib/types/domain'
import {
  ExpenseTitleInput,
  AmountInput,
  CategorySelector,
  PaidBySelector,
  ParticipantsSelector,
  PeriodPicker,
} from './components'

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

interface Project {
  id: string
  name: string
  currency: string
  splitType: string
  template: string
  participants: Participant[]
  categories: Category[]
}

// Common emoji icons for categories
const CATEGORY_ICONS = ['🍕', '🚗', '🏨', '🎢', '🛍️', '💊', '🎬', '☕', '🎁', '📱', '✂️', '📝']

export default function AddExpensePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [template, setTemplate] = useState<TemplateDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [paidById, setPaidById] = useState('')
  const [includedParticipantIds, setIncludedParticipantIds] = useState<string[]>([])
  const [periodKey, setPeriodKey] = useState<string | null>(null)

  // Add category modal
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝')
  const [addingCategory, setAddingCategory] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('پروژه یافت نشد')

      const data = await res.json()
      setProject(data.project)

      // Load template
      const projectTemplate = getTemplate(data.project.template)
      setTemplate(projectTemplate)

      // Set defaults
      if (data.project.participants.length > 0) {
        setPaidById(data.project.participants[0].id)
        setIncludedParticipantIds(data.project.participants.map((p: Participant) => p.id))
      }
    } catch {
      setError('خطا در بارگذاری پروژه')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!template) return
    const labels = template.labels

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

    // Validate period for templates that require it
    if (template.periodRequired && !periodKey) {
      setError('انتخاب دوره زمانی الزامی است')
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
          periodKey: periodKey || undefined,
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
    if (!newCategoryName.trim() || !template) return

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

  if (!project || !template) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center">
        <p className="text-gray-500">{error || 'پروژه یافت نشد'}</p>
      </div>
    )
  }

  const labels = template.labels
  const sharePreview = getSharePreview()

  return (
    <main className="min-h-dvh pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-10">
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

      <div className="p-4 space-y-5">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Period Picker - Only for templates that require it (e.g., building) */}
        {template.periodRequired && (
          <PeriodPicker
            value={periodKey}
            onChange={setPeriodKey}
            label="این شارژ مربوط به کدوم ماه‌ه؟"
            required
          />
        )}

        {/* 1. Title - Most prominent */}
        <ExpenseTitleInput
          value={title}
          onChange={setTitle}
          label={labels.expenseTitleLabel}
          placeholder={labels.expenseTitlePlaceholder}
          helper={labels.expenseTitleHelper}
        />

        {/* 2. Amount */}
        <AmountInput
          value={amount}
          onChange={setAmount}
          currency={project.currency}
          label={labels.amountLabel}
          placeholder={labels.amountPlaceholder}
          sharePerPerson={sharePreview}
          participantCount={includedParticipantIds.length}
          participantTerm={labels.participantTerm}
        />

        {/* 3. Category - Optional */}
        <CategorySelector
          categories={project.categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
          onAddNew={() => setShowAddCategory(true)}
          label={labels.categoryLabel}
          helper={labels.categoryHelper}
        />

        {/* 4. Paid By */}
        <PaidBySelector
          participants={project.participants}
          selectedId={paidById}
          onSelect={setPaidById}
          currentUserId={project.participants[0]?.id}
          label={labels.paidByLabel}
          helper={labels.paidByHelper}
        />

        {/* 5. Split Between */}
        <ParticipantsSelector
          participants={project.participants}
          selectedIds={includedParticipantIds}
          onToggle={toggleParticipant}
          onSelectAll={selectAllParticipants}
          paidById={paidById}
          sharePerPerson={sharePreview}
          currency={project.currency}
          label={labels.splitBetweenLabel}
          helper={labels.splitBetweenHelper}
          participantTerm={labels.participantTerm}
          onlyForYouMessage={labels.onlyForYouMessage}
        />
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={
            !title.trim() ||
            !amount ||
            !paidById ||
            includedParticipantIds.length === 0 ||
            (template.periodRequired && !periodKey)
          }
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
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
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
