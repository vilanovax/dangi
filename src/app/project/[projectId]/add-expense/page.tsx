'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, BottomSheet, ImageUpload } from '@/components/ui'
import { UnifiedHeader, FormLayout, FormSection, FormError } from '@/components/layout'
import { parseMoney, formatMoney, formatNumber } from '@/lib/utils/money'
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
  trackingOnly?: boolean
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
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [paidById, setPaidById] = useState('')
  const [includedParticipantIds, setIncludedParticipantIds] = useState<string[]>([])
  const [periodKey, setPeriodKey] = useState<string | null>(null)
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'MANUAL'>('EQUAL')
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)

  // UX: Progressive Disclosure - Advanced options section
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const advancedSectionRef = useRef<HTMLDivElement>(null)

  // Add category modal
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝')
  const [addingCategory, setAddingCategory] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  // Auto-update includedParticipantIds for tracking mode
  useEffect(() => {
    if (project?.template === 'personal' && project.trackingOnly && paidById) {
      // In tracking mode, expense is only for the payer
      setIncludedParticipantIds([paidById])
    }
  }, [paidById, project?.template, project?.trackingOnly])

  // UX: Contextual Reveal - Auto-expand advanced section when needed
  useEffect(() => {
    if (!project) return

    const currentUserId = project.participants[0]?.id
    const shouldAutoExpand =
      paidById !== currentUserId || // Payer is not current user
      splitMode !== 'EQUAL' // Split mode is not equal

    if (shouldAutoExpand && !showAdvancedOptions) {
      setShowAdvancedOptions(true)
    }
  }, [paidById, splitMode, project, showAdvancedOptions])

  // UX: Scroll to participants when manual split is selected
  useEffect(() => {
    if (splitMode === 'MANUAL' && advancedSectionRef.current) {
      setTimeout(() => {
        advancedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 300)
    }
  }, [splitMode])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('پروژه یافت نشد')

      const data = await res.json()
      setProject(data.project)

      // Load template
      const projectTemplate = getTemplate(data.project.template)
      setTemplate(projectTemplate)

      // UX: Smart Defaults - Set defaults to minimize form interactions
      if (data.project.participants.length > 0) {
        setPaidById(data.project.participants[0].id) // Default: current user
        setIncludedParticipantIds(data.project.participants.map((p: Participant) => p.id)) // Default: all participants
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

    // UX: Validation with friendly error messages
    const parsedAmount = parseMoney(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('مبلغ رو وارد کن')
      return
    }

    if (!title.trim()) {
      setError('عنوان خرج رو بنویس')
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

    // Validate custom amounts in MANUAL mode
    if (splitMode === 'MANUAL') {
      const customTotal = includedParticipantIds.reduce((sum, id) => {
        return sum + (parseMoney(customAmounts[id] || '0') || 0)
      }, 0)
      if (Math.abs(customTotal - parsedAmount) > 1) {
        setError('مجموع مبالغ باید برابر با کل هزینه باشد')
        return
      }
    }

    // Validate period for templates that require it
    if (template.periodRequired && !periodKey) {
      setError('انتخاب دوره زمانی الزامی است')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Build customShares for MANUAL mode
      const customShares =
        splitMode === 'MANUAL'
          ? includedParticipantIds.map((id) => ({
              participantId: id,
              amount: parseMoney(customAmounts[id] || '0') || 0,
            }))
          : undefined

      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          description: description.trim() || undefined,
          paidById,
          categoryId: categoryId || undefined,
          periodKey: periodKey || undefined,
          receiptUrl: receiptUrl || undefined,
          includedParticipantIds,
          customShares,
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
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId]
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

  // Calculate custom amounts total and validation
  const getCustomAmountsInfo = () => {
    const parsedAmount = parseMoney(amount) || 0
    const customTotal = includedParticipantIds.reduce((sum, id) => {
      return sum + (parseMoney(customAmounts[id] || '0') || 0)
    }, 0)
    const isValid = parsedAmount > 0 && Math.abs(customTotal - parsedAmount) <= 1
    const remaining = parsedAmount - customTotal
    return { customTotal, isValid, remaining }
  }

  const handleCustomAmountChange = (participantId: string, value: string) => {
    setCustomAmounts((prev) => ({ ...prev, [participantId]: value }))
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
  const isHangout = template.id === 'gathering'
  const parsedAmount = parseMoney(amount)

  // UX: Dynamic CTA label with amount
  const getSubmitButtonLabel = () => {
    if (submitting) return labels.submittingButton
    if (parsedAmount && parsedAmount > 0) {
      // Use formatNumber to avoid duplicate currency (تومان + تومانی)
      return `ثبت خرج ${formatNumber(parsedAmount)}${
        project.currency === 'IRR' ? ' تومانی' : ` ${project.currency}`
      }`
    }
    return labels.submitButton
  }

  return (
    <>
      <FormLayout
        header={
          <UnifiedHeader
            variant={isHangout ? 'hangout' : 'form'}
            title={labels.addExpenseTitle}
            subtitle={isHangout ? labels.addExpenseSubtitle : 'سریع ثبتش کن تا یادت نره ⚡'}
            showBack
            onBack={() => router.back()}
          />
        }
        hero={
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={project.currency}
            label={labels.amountLabel}
            placeholder={labels.amountPlaceholder}
            sharePerPerson={sharePreview}
            participantCount={includedParticipantIds.length}
            participantTerm={labels.participantTerm}
            autoFocus // UX: Auto-focus on amount for fast entry
          />
        }
        footer={
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={
              !amount || // UX: CTA disabled until amount is entered
              parsedAmount === 0 ||
              !title.trim() ||
              !paidById ||
              includedParticipantIds.length === 0 ||
              (template.periodRequired && !periodKey) ||
              (splitMode === 'MANUAL' && !getCustomAmountsInfo().isValid)
            }
            className={`w-full shadow-lg ${
              isHangout
                ? 'shadow-purple-500/20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                : 'shadow-blue-500/20'
            }`}
            size="lg"
          >
            {getSubmitButtonLabel()}
          </Button>
        }
      >
        {/* =================================== */}
        {/* PRIMARY SECTION - Always Visible */}
        {/* =================================== */}

        {/* Error Message */}
        {error && <FormError message={error} />}

        {/* UX: Title Input - Encouraged but optional */}
        <ExpenseTitleInput
          value={title}
          onChange={setTitle}
          label="این خرج چی بود؟"
          placeholder="مثلاً: ناهار توی رستوران"
          helper="یه عنوان کوتاه که بعداً راحت پیداش کنی"
        />

        {/* UX: Category - Optional, lightweight selection */}
        <CategorySelector
          categories={project.categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
          onAddNew={() => setShowAddCategory(true)}
          label="دسته‌بندی"
          helper="اختیاری - می‌تونی بعداً هم اضافه کنی"
        />

        {/* =================================== */}
        {/* ADVANCED OPTIONS - Collapsible */}
        {/* =================================== */}

        {/* UX: Toggle Button for Advanced Section */}
        <div className="pt-2 pb-1">
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all active:scale-[0.98]"
          >
            <div className="flex-1 text-right">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">تنظیمات بیشتر</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                برای بیشتر خرج‌ها نیازی به این بخش نیست
              </p>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                showAdvancedOptions ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* UX: Advanced Section - Conditionally rendered */}
        {showAdvancedOptions && (
          <div ref={advancedSectionRef} className="space-y-5 pt-2 animate-slideDown">
            {/* Period Picker - Only for templates that require it */}
            {template.periodRequired && (
              <PeriodPicker
                value={periodKey}
                onChange={setPeriodKey}
                label="این شارژ مربوط به کدوم ماه‌ه؟"
                required
              />
            )}

            {/* Note - Optional */}
            <FormSection title="یادداشت" optional>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="یه توضیح کوچیک؟ شماره فاکتور؟ هر چی دوست داری..."
                rows={2}
                className="w-full px-4 py-3 text-base border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 dark:focus:border-blue-700 resize-none bg-gray-50/50 dark:bg-gray-800/30 placeholder-gray-400 dark:placeholder-gray-600 transition-all"
              />
            </FormSection>

            {/* Receipt - Optional */}
            <ImageUpload
              value={receiptUrl}
              onChange={setReceiptUrl}
              folder="receipts"
              label="عکس رسید"
              placeholder="اگه رسید داری، بعداً هم می‌تونی اضافه کنی 📸"
            />

            {/* Paid By */}
            <PaidBySelector
              participants={project.participants}
              selectedId={paidById}
              onSelect={setPaidById}
              currentUserId={project.participants[0]?.id}
              label="این خرج رو کی پرداخت کرده؟"
              helper="معمولاً همونی که ثبت می‌کنه"
            />

            {/* Tracking Mode Message - Only for personal template */}
            {project.template === 'personal' && project.trackingOnly ? (
              <FormSection title="این خرج مال کیه؟">
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      این خرج به{' '}
                      <span className="font-semibold">
                        {project.participants.find((p) => p.id === paidById)?.name || 'پرداخت‌کننده'}
                      </span>{' '}
                      تعلق داره (بدون تقسیم)
                    </p>
                  </div>
                </div>
              </FormSection>
            ) : (
              <>
                {/* Split Mode */}
                <FormSection title="چطور تقسیم بشه؟">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSplitMode('EQUAL')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                        splitMode === 'EQUAL'
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      مساوی ⚖️
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode('MANUAL')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                        splitMode === 'MANUAL'
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      دستی ✏️
                    </button>
                  </div>
                </FormSection>

                {/* Split Between - Participants */}
                <ParticipantsSelector
                  participants={project.participants}
                  selectedIds={includedParticipantIds}
                  onToggle={toggleParticipant}
                  onSelectAll={selectAllParticipants}
                  paidById={paidById}
                  sharePerPerson={sharePreview}
                  currency={project.currency}
                  label="تقسیم بین چه کسانی؟"
                  helper="انتخاب کن که کیا باید سهم بدن"
                  participantTerm={labels.participantTerm}
                  onlyForYouMessage={labels.onlyForYouMessage}
                  splitMode={splitMode}
                  customAmounts={customAmounts}
                  onCustomAmountChange={handleCustomAmountChange}
                  totalAmount={parsedAmount || 0}
                />
              </>
            )}
          </div>
        )}
      </FormLayout>

      {/* Add Category Bottom Sheet */}
      <BottomSheet isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} title="افزودن دسته‌بندی جدید">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آیکون</label>
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

          <Button onClick={handleAddCategory} loading={addingCategory} disabled={!newCategoryName.trim()} className="w-full">
            افزودن
          </Button>
        </div>
      </BottomSheet>
    </>
  )
}
