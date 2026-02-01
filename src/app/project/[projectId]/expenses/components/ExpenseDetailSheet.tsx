'use client'

import { useState, useEffect, useMemo } from 'react'
import { BottomSheet, Input } from '@/components/ui'
import { formatMoney, parseMoney } from '@/lib/utils/money'

interface ExpenseDetail {
  id: string
  title: string
  amount: number
  currency: string
  expenseDate: string
  description?: string
  paidBy: {
    id: string
    name: string
  }
  category?: {
    id: string
    name: string
    icon: string
    color: string
  } | null
  periodKey?: string | null
}

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

interface ExpenseDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  expense: ExpenseDetail | null
  projectId: string
  onEdit: () => void
  onDelete: () => void
}

// Persian months
const PERSIAN_MONTHS = [
  { key: '01', name: 'فروردین' },
  { key: '02', name: 'اردیبهشت' },
  { key: '03', name: 'خرداد' },
  { key: '04', name: 'تیر' },
  { key: '05', name: 'مرداد' },
  { key: '06', name: 'شهریور' },
  { key: '07', name: 'مهر' },
  { key: '08', name: 'آبان' },
  { key: '09', name: 'آذر' },
  { key: '10', name: 'دی' },
  { key: '11', name: 'بهمن' },
  { key: '12', name: 'اسفند' },
]

// Common expense categories for buildings
const COMMON_EXPENSE_TYPES = [
  { id: 'maintenance', icon: '🔧', name: 'تعمیرات', color: '#F59E0B' },
  { id: 'cleaning', icon: '🧹', name: 'نظافت', color: '#10B981' },
  { id: 'electricity', icon: '💡', name: 'برق مشاع', color: '#3B82F6' },
  { id: 'water', icon: '💧', name: 'آب مشاع', color: '#06B6D4' },
  { id: 'gas', icon: '🔥', name: 'گاز مشاع', color: '#EF4444' },
  { id: 'security', icon: '🔒', name: 'نگهبانی', color: '#8B5CF6' },
  { id: 'elevator', icon: '🛗', name: 'آسانسور', color: '#EC4899' },
  { id: 'parking', icon: '🚗', name: 'پارکینگ', color: '#6366F1' },
  { id: 'garden', icon: '🌿', name: 'فضای سبز', color: '#22C55E' },
  { id: 'other', icon: '📝', name: 'سایر', color: '#6B7280' },
]

/**
 * Expense Detail Bottom Sheet - With Inline Editing
 *
 * UX Intent:
 * - Quick view of expense details with clear hierarchy
 * - Inline editing without separate page
 * - Amount as primary visual element
 * - Contextual badges for expense type
 * - Clear actions with proper semantics
 * - Uses building design tokens for consistency
 */
export function ExpenseDetailSheet({
  isOpen,
  onClose,
  expense,
  projectId,
  onEdit,
  onDelete,
}: ExpenseDetailSheetProps) {
  // Edit mode state
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Project data for edit mode
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paidById, setPaidById] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [periodKey, setPeriodKey] = useState<string | null>(null)

  // Modal state
  const [showPayerSheet, setShowPayerSheet] = useState(false)
  const [showPeriodSheet, setShowPeriodSheet] = useState(false)

  // Period picker state
  const currentPersianYear = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear() - 621
    const month = now.getMonth()
    if (month < 2 || (month === 2 && now.getDate() < 21)) {
      return year - 1
    }
    return year
  }, [])

  const [selectedYear, setSelectedYear] = useState(currentPersianYear)
  const [selectedMonth, setSelectedMonth] = useState('01')

  // Available years
  const availableYears = useMemo(() => {
    const years = []
    for (let y = currentPersianYear; y >= currentPersianYear - 3; y--) {
      years.push(y)
    }
    return years
  }, [currentPersianYear])

  // Fetch project data when entering edit mode
  useEffect(() => {
    if (editMode && isOpen) {
      fetchProjectData()
    }
  }, [editMode, isOpen, projectId])

  // Reset form when expense changes
  useEffect(() => {
    if (expense && isOpen) {
      setTitle(expense.title)
      setAmount(expense.amount.toString())
      setDescription(expense.description || '')
      setPaidById(expense.paidBy.id)
      setSelectedCategoryId(expense.category?.id || null)
      setPeriodKey(expense.periodKey || null)

      // Set period picker state
      if (expense.periodKey) {
        const [year, month] = expense.periodKey.split('-')
        setSelectedYear(parseInt(year))
        setSelectedMonth(month)
      }

      setEditMode(false)
      setError('')
    }
  }, [expense, isOpen])

  const fetchProjectData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const { project } = await res.json()
        setParticipants(project.participants || [])
        setCategories(project.categories || [])
      }
    } catch (err) {
      console.error('Error fetching project data:', err)
    }
  }

  if (!expense) return null

  const formattedDate = new Date(expense.expenseDate).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Parse period key to readable format (e.g. "1404-01" → "فروردین ۱۴۰۴")
  const formatPeriodKey = (periodKey: string | null | undefined) => {
    if (!periodKey) return null
    const [year, month] = periodKey.split('-')
    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ]
    const monthIndex = parseInt(month, 10) - 1
    return `${monthNames[monthIndex]} ${year}`
  }

  const isRecurring = expense.periodKey !== null && expense.periodKey !== undefined

  // Handlers
  const handleEditClick = () => {
    setEditMode(true)
  }

  const handleCancelEdit = () => {
    // Reset to original values
    if (expense) {
      setTitle(expense.title)
      setAmount(expense.amount.toString())
      setDescription(expense.description || '')
      setPaidById(expense.paidBy.id)
      setSelectedCategoryId(expense.category?.id || null)
      setPeriodKey(expense.periodKey || null)
      if (expense.periodKey) {
        const [year, month] = expense.periodKey.split('-')
        setSelectedYear(parseInt(year))
        setSelectedMonth(month)
      }
    }
    setEditMode(false)
    setError('')
  }

  const handlePeriodConfirm = () => {
    const newPeriod = `${selectedYear}-${selectedMonth}`
    setPeriodKey(newPeriod)
    setShowPeriodSheet(false)
  }

  const handleSaveExpense = async () => {
    // Validation
    if (!title.trim()) {
      setError('عنوان را وارد کنید')
      return
    }

    const parsedAmount = parseMoney(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('مبلغ باید بیشتر از صفر باشد')
      return
    }

    if (!paidById) {
      setError('پرداخت‌کننده را انتخاب کنید')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          description: description.trim() || undefined,
          paidById,
          categoryId: selectedCategoryId || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ویرایش هزینه')
      }

      // Update local expense data
      const { expense: updatedExpense } = await res.json()

      // Close edit mode and refresh
      setEditMode(false)
      onClose()

      // Trigger page refresh
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ویرایش هزینه')
    } finally {
      setSaving(false)
    }
  }

  const selectedPayer = participants.find(p => p.id === paidById)

  // Use project categories if available, otherwise fallback to static ones
  const availableCategories = categories.length > 0 ? categories : COMMON_EXPENSE_TYPES.map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
  }))

  const selectedCategory = availableCategories.find(c => c.id === selectedCategoryId)

  // Period display for edit mode
  const periodDisplay = useMemo(() => {
    if (!periodKey) return null
    const [year, month] = periodKey.split('-')
    const monthInfo = PERSIAN_MONTHS.find(m => m.key === month)
    return `${monthInfo?.name} ${year}`
  }, [periodKey])

  // If in edit mode, render edit form
  if (editMode) {
    return (
      <BottomSheet isOpen={isOpen} onClose={handleCancelEdit} title="ویرایش خرج">
        <div className="space-y-5">
          {/* Error Message */}
          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'var(--building-danger-alpha)',
                color: 'var(--building-danger)',
              }}
            >
              {error}
            </div>
          )}

          {/* Period Selection (if recurring) */}
          {periodKey && (
            <section>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--building-text-secondary)' }}
              >
                این هزینه مربوط به کدوم ماه‌ه؟
              </label>
              <button
                type="button"
                onClick={() => setShowPeriodSheet(true)}
                className="w-full px-4 py-3.5 rounded-xl text-right transition-all"
                style={{
                  backgroundColor: periodKey
                    ? 'var(--building-primary-alpha)'
                    : 'var(--building-surface-muted)',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: periodKey ? 'var(--building-primary)' : 'transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <svg
                    className="w-5 h-5"
                    style={{ color: 'var(--building-text-secondary)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className={periodKey ? 'font-medium' : ''} style={{ color: periodKey ? 'var(--building-text-primary)' : 'var(--building-text-secondary)' }}>
                    {periodDisplay || 'انتخاب ماه'}
                  </span>
                </div>
              </button>
            </section>
          )}

          {/* Category Selection */}
          <section>
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: 'var(--building-text-secondary)' }}
            >
              نوع هزینه
            </label>
            <div className="grid grid-cols-5 gap-2">
              {availableCategories.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedCategoryId(type.id)}
                  className="flex flex-col items-center p-3 rounded-xl transition-all"
                  style={{
                    backgroundColor:
                      selectedCategoryId === type.id
                        ? 'var(--building-primary-alpha)'
                        : 'var(--building-surface-muted)',
                    borderWidth: selectedCategoryId === type.id ? '2px' : '0',
                    borderStyle: 'solid',
                    borderColor: selectedCategoryId === type.id ? 'var(--building-primary)' : 'transparent',
                  }}
                >
                  <span className="text-2xl mb-1">{type.icon}</span>
                  <span
                    className="text-xs text-center leading-tight"
                    style={{ color: 'var(--building-text-secondary)' }}
                  >
                    {type.name}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Title */}
          <section>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--building-text-secondary)' }}
            >
              عنوان هزینه
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: تعمیر موتورخانه" />
          </section>

          {/* Amount */}
          <section>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--building-text-secondary)' }}
            >
              مبلغ کل (تومان)
            </label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="۲٬۰۰۰٬۰۰۰"
              inputMode="numeric"
              className="text-left text-xl font-bold"
              dir="ltr"
            />
          </section>

          {/* Paid By */}
          <section>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--building-text-secondary)' }}
            >
              پرداخت‌کننده
            </label>
            <button
              onClick={() => setShowPayerSheet(true)}
              className="w-full p-4 rounded-xl flex items-center justify-between"
              style={{
                backgroundColor: 'var(--building-surface-muted)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--building-border)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--building-primary-alpha)',
                  }}
                >
                  <span className="font-semibold" style={{ color: 'var(--building-primary)' }}>
                    {selectedPayer?.name.charAt(0) || '?'}
                  </span>
                </div>
                <span className="font-medium" style={{ color: 'var(--building-text-primary)' }}>
                  {selectedPayer?.name || 'انتخاب کنید'}
                </span>
              </div>
              <svg className="w-5 h-5" style={{ color: 'var(--building-text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </section>

          {/* Description */}
          <section>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--building-text-secondary)' }}
            >
              توضیحات (اختیاری)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات تکمیلی در صورت نیاز..."
              className="w-full p-3 rounded-xl resize-none h-20"
              style={{
                backgroundColor: 'var(--building-surface-muted)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--building-border)',
                color: 'var(--building-text-primary)',
              }}
            />
          </section>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {/* Cancel Button */}
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="flex-1 py-3.5 px-4 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--building-surface-muted)',
                color: 'var(--building-text-primary)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--building-border)',
                opacity: saving ? 0.5 : 1,
              }}
            >
              لغو
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveExpense}
              disabled={saving || !title.trim() || !amount || !paidById}
              className="flex-1 py-3.5 px-4 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--building-success)',
                color: 'white',
                opacity: saving || !title.trim() || !amount || !paidById ? 0.5 : 1,
              }}
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </div>

        {/* Payer Selection Sheet */}
        <BottomSheet
          isOpen={showPayerSheet}
          onClose={() => setShowPayerSheet(false)}
          title="انتخاب پرداخت‌کننده"
        >
          <div className="space-y-2">
            {participants.map((participant) => (
              <button
                key={participant.id}
                onClick={() => {
                  setPaidById(participant.id)
                  setShowPayerSheet(false)
                }}
                className="w-full p-4 rounded-xl flex items-center justify-between transition-colors"
                style={{
                  backgroundColor:
                    paidById === participant.id
                      ? 'var(--building-primary-alpha)'
                      : 'var(--building-surface-muted)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--building-surface-muted)',
                    }}
                  >
                    <span className="font-semibold" style={{ color: 'var(--building-text-primary)' }}>
                      {participant.name.charAt(0)}
                    </span>
                  </div>
                  <span className="font-medium" style={{ color: 'var(--building-text-primary)' }}>
                    {participant.name}
                  </span>
                </div>
                {paidById === participant.id && (
                  <svg className="w-5 h-5" style={{ color: 'var(--building-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </BottomSheet>

        {/* Period Selection Sheet */}
        <BottomSheet
          isOpen={showPeriodSheet}
          onClose={() => setShowPeriodSheet(false)}
          title="انتخاب دوره"
        >
          <div className="space-y-4">
            {/* Year Selector */}
            <div>
              <label className="block text-xs mb-2" style={{ color: 'var(--building-text-secondary)' }}>
                سال
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0"
                    style={{
                      backgroundColor:
                        selectedYear === year ? 'var(--building-primary)' : 'var(--building-surface-muted)',
                      color: selectedYear === year ? 'white' : 'var(--building-text-primary)',
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Month Grid */}
            <div>
              <label className="block text-xs mb-2" style={{ color: 'var(--building-text-secondary)' }}>
                ماه
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PERSIAN_MONTHS.map((month) => (
                  <button
                    key={month.key}
                    type="button"
                    onClick={() => setSelectedMonth(month.key)}
                    className="px-3 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor:
                        selectedMonth === month.key ? 'var(--building-primary)' : 'var(--building-surface-muted)',
                      color: selectedMonth === month.key ? 'white' : 'var(--building-text-primary)',
                    }}
                  >
                    {month.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handlePeriodConfirm}
              className="w-full py-3 rounded-xl font-medium transition-colors"
              style={{
                backgroundColor: 'var(--building-primary)',
                color: 'white',
              }}
            >
              تأیید - {PERSIAN_MONTHS.find((m) => m.key === selectedMonth)?.name} {selectedYear}
            </button>
          </div>
        </BottomSheet>
      </BottomSheet>
    )
  }

  // View mode - original design
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="جزئیات خرج">
      <div className="space-y-5">
        {/* Badges - Context indicators */}
        <div className="flex flex-wrap gap-2">
          {/* Public Expense Badge */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: 'var(--building-info-alpha)',
              color: 'var(--building-info)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            هزینه عمومی
          </span>

          {/* Recurring Badge */}
          {isRecurring && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: 'var(--building-primary-alpha)',
                color: 'var(--building-primary)',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {formatPeriodKey(expense.periodKey)}
            </span>
          )}
        </div>

        {/* Amount - Primary Visual Element */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--building-primary) 0%, var(--building-success) 100%)',
          }}
        >
          <p className="text-xs mb-1.5 text-white/80 font-medium">
            مبلغ
          </p>
          <p className="text-4xl font-bold text-white">
            {formatMoney(expense.amount, expense.currency)}
          </p>
        </div>

        {/* Category & Title */}
        <div className="flex items-start gap-3">
          {expense.category && (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${expense.category.color}15`,
              }}
            >
              <span className="text-xl">{expense.category.icon}</span>
            </div>
          )}
          <div className="flex-1">
            <h2
              className="text-lg font-bold leading-tight mb-1"
              style={{ color: 'var(--building-text-primary)' }}
            >
              {expense.title}
            </h2>
            {expense.category && (
              <p className="text-sm" style={{ color: 'var(--building-text-secondary)' }}>
                {expense.category.name}
              </p>
            )}
          </div>
        </div>

        {/* Details Grid - Improved spacing and dividers */}
        <div
          className="rounded-xl"
          style={{
            backgroundColor: 'var(--building-surface-muted)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--building-border)',
          }}
        >
          {/* Payer */}
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{
              borderBottomWidth: '1px',
              borderBottomStyle: 'solid',
              borderBottomColor: 'var(--building-border)',
            }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--building-text-secondary)' }}>
              پرداخت‌کننده
            </span>
            <span className="font-bold text-sm" style={{ color: 'var(--building-text-primary)' }}>
              {expense.paidBy.name}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium" style={{ color: 'var(--building-text-secondary)' }}>
              تاریخ
            </span>
            <span className="font-bold text-sm" style={{ color: 'var(--building-text-primary)' }}>
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Description (if available) */}
        {expense.description && (
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--building-surface-muted)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--building-border)',
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--building-text-secondary)' }}>
              توضیحات
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--building-text-primary)' }}>
              {expense.description}
            </p>
          </div>
        )}

        {/* Actions - Improved semantics */}
        <div className="flex gap-3 pt-2">
          {/* Edit Button - Primary action */}
          <button
            onClick={handleEditClick}
            className="flex-1 py-3.5 px-4 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--building-surface-muted)',
              color: 'var(--building-text-primary)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--building-border)',
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            ویرایش خرج
          </button>

          {/* Delete Button - Destructive action */}
          <button
            onClick={onDelete}
            className="px-5 py-3.5 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center"
            style={{
              backgroundColor: 'var(--building-danger-alpha)',
              color: 'var(--building-danger)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--building-danger)',
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
