'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button, Card, BottomSheet, Input } from '@/components/ui'
import { formatMoney, parseMoney } from '@/lib/utils/money'
import { getRecentPeriods, formatPeriodKey } from '@/lib/utils/persian-date'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChargeExpense {
  id: string
  title: string
  amount: number
  expenseDate: string
  receiptUrl?: string | null
}

interface ParticipantStatus {
  id: string
  name: string
  weight: number
  expectedAmount: number
  paidAmount: number
  status: 'paid' | 'partial' | 'unpaid'
  paidDate?: string
  expenses: ChargeExpense[]
}

interface PeriodStatus {
  periodKey: string
  periodLabel: string
  expectedAmount: number
  participants: ParticipantStatus[]
  totalExpected: number
  totalPaid: number
  paidCount: number
  unpaidCount: number
}

interface ChargeRule {
  id: string
  title: string
  amount: number
}

interface ChargeStatusData {
  periods: PeriodStatus[]
  chargeRules: ChargeRule[]
  chargePerUnit: number
  totalChargePerPeriod: number
  participantsCount: number
  message?: string
}

interface CommonExpense {
  id: string
  title: string
  amount: number
  expenseDate: string
  paidBy: {
    id: string
    name: string
  }
  receiptUrl?: string | null
}

interface Participant {
  id: string
  name: string
  weight: number
}

type TabType = 'charge' | 'expenses'

// ─────────────────────────────────────────────────────────────
// localStorage Keys
// ─────────────────────────────────────────────────────────────

const SELECTED_MONTH_KEY = 'charge-dashboard-selected-month'

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ChargeDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('charge')

  // Data
  const [data, setData] = useState<ChargeStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Selected month for payment
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodStatus | null>(null)

  // Payment modal
  const [selectedUnit, setSelectedUnit] = useState<ParticipantStatus | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit/Delete modal
  const [editingExpense, setEditingExpense] = useState<ChargeExpense | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ChargeExpense | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Expenses Tab State ───────────────────────────────────────
  const [expenses, setExpenses] = useState<CommonExpense[]>([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string>('')
  const [participants, setParticipants] = useState<Participant[]>([])

  // Add expense modal
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpenseTitle, setNewExpenseTitle] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpensePaidById, setNewExpensePaidById] = useState('')
  const [newExpenseReceipt, setNewExpenseReceipt] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // View receipt modal
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)

  // Edit expense modal
  const [editingCommonExpense, setEditingCommonExpense] = useState<CommonExpense | null>(null)
  const [editCommonExpenseAmount, setEditCommonExpenseAmount] = useState('')
  const [showDeleteCommonExpense, setShowDeleteCommonExpense] = useState<CommonExpense | null>(null)

  // Available periods for expense month selector
  const availablePeriods = useMemo(() => getRecentPeriods(12), [])

  useEffect(() => {
    fetchChargeStatus()
    fetchParticipants()

    // Load selected month from localStorage
    const savedMonth = localStorage.getItem(`${SELECTED_MONTH_KEY}-${projectId}`)
    if (savedMonth) {
      setSelectedExpenseMonth(savedMonth)
    } else if (availablePeriods.length > 0) {
      setSelectedExpenseMonth(availablePeriods[0].key)
    }
  }, [projectId, availablePeriods])

  // Fetch expenses when tab changes to expenses or month changes
  useEffect(() => {
    if (activeTab === 'expenses' && selectedExpenseMonth) {
      fetchExpenses()
    }
  }, [activeTab, selectedExpenseMonth])

  const fetchChargeStatus = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/charge-status?periods=12`)
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات')

      const json = await res.json()
      setData(json)
    } catch {
      setError('خطا در بارگذاری وضعیت شارژ')
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipants = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const { project } = await res.json()
        setParticipants(project.participants || [])
        if (project.participants?.length > 0 && !newExpensePaidById) {
          setNewExpensePaidById(project.participants[0].id)
        }
      }
    } catch {
      console.error('Error fetching participants')
    }
  }

  const fetchExpenses = async () => {
    if (!selectedExpenseMonth) return

    setExpensesLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses`)
      if (res.ok) {
        const { expenses: allExpenses } = await res.json()
        // Filter expenses by selected month (periodKey)
        const filtered = allExpenses.filter(
          (e: CommonExpense & { periodKey?: string }) => e.periodKey === selectedExpenseMonth
        )
        setExpenses(filtered)
      }
    } catch {
      console.error('Error fetching expenses')
    } finally {
      setExpensesLoading(false)
    }
  }

  const handleMonthChange = (monthKey: string) => {
    setSelectedExpenseMonth(monthKey)
    localStorage.setItem(`${SELECTED_MONTH_KEY}-${projectId}`, monthKey)
  }

  // Sort periods from oldest to newest (reverse the API order)
  const sortedPeriods = useMemo(() => {
    if (!data?.periods) return []
    return [...data.periods].reverse()
  }, [data?.periods])

  // Get current period key (first item in original data = current month)
  const currentPeriodKey = data?.periods?.[0]?.periodKey

  const openPeriodDetail = (period: PeriodStatus) => {
    setSelectedPeriod(period)
  }

  const openPaymentModal = (unit: ParticipantStatus) => {
    setSelectedUnit(unit)
    setPaymentAmount(unit.expectedAmount.toString())
  }

  const handlePayCharge = async () => {
    if (!selectedUnit || !selectedPeriod || !paymentAmount) return

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `شارژ ${selectedPeriod.periodLabel} - ${selectedUnit.name}`,
          amount: parseFloat(paymentAmount),
          paidById: selectedUnit.id,
          periodKey: selectedPeriod.periodKey,
          expenseDate: new Date().toISOString().split('T')[0],
          splitEqually: false,
          shares: [],
        }),
      })

      if (!res.ok) throw new Error('خطا در ثبت پرداخت')

      setSelectedUnit(null)
      setSuccess(`شارژ ${selectedUnit.name} برای ${selectedPeriod.periodLabel} ثبت شد`)
      setTimeout(() => setSuccess(''), 3000)

      // Refresh data
      await fetchChargeStatus()

      // Update selected period with new data
      const updatedData = await fetch(`/api/projects/${projectId}/charge-status?periods=12`).then(r => r.json())
      const updatedPeriod = updatedData.periods?.find((p: PeriodStatus) => p.periodKey === selectedPeriod.periodKey)
      if (updatedPeriod) {
        setSelectedPeriod(updatedPeriod)
      }
    } catch {
      setError('خطا در ثبت پرداخت شارژ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditExpense = async () => {
    if (!editingExpense || !editAmount) return

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
        }),
      })

      if (!res.ok) throw new Error('خطا در ویرایش')

      setEditingExpense(null)
      setSuccess('مبلغ شارژ با موفقیت ویرایش شد')
      setTimeout(() => setSuccess(''), 3000)

      // Refresh data
      await fetchChargeStatus()

      // Update selected period with new data
      if (selectedPeriod) {
        const updatedData = await fetch(`/api/projects/${projectId}/charge-status?periods=12`).then(r => r.json())
        const updatedPeriod = updatedData.periods?.find((p: PeriodStatus) => p.periodKey === selectedPeriod.periodKey)
        if (updatedPeriod) {
          setSelectedPeriod(updatedPeriod)
        }
      }
    } catch {
      setError('خطا در ویرایش شارژ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteExpense = async () => {
    if (!showDeleteConfirm) return

    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${showDeleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('خطا در حذف')

      setShowDeleteConfirm(null)
      setSuccess('پرداخت شارژ حذف شد')
      setTimeout(() => setSuccess(''), 3000)

      // Refresh data
      await fetchChargeStatus()

      // Update selected period with new data
      if (selectedPeriod) {
        const updatedData = await fetch(`/api/projects/${projectId}/charge-status?periods=12`).then(r => r.json())
        const updatedPeriod = updatedData.periods?.find((p: PeriodStatus) => p.periodKey === selectedPeriod.periodKey)
        if (updatedPeriod) {
          setSelectedPeriod(updatedPeriod)
        }
      }
    } catch {
      setError('خطا در حذف شارژ')
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = (expense: ChargeExpense) => {
    setEditingExpense(expense)
    setEditAmount(expense.amount.toString())
  }

  // ─── Expense Tab Handlers ─────────────────────────────────────

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingReceipt(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در آپلود')
      }

      const { url } = await res.json()
      setNewExpenseReceipt(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در آپلود تصویر')
    } finally {
      setUploadingReceipt(false)
    }
  }, [])

  const handleAddExpense = async () => {
    if (!newExpenseTitle.trim() || !newExpenseAmount || !newExpensePaidById) return

    const parsedAmount = parseMoney(newExpenseAmount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('مبلغ باید بیشتر از صفر باشد')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newExpenseTitle.trim(),
          amount: parsedAmount,
          paidById: newExpensePaidById,
          periodKey: selectedExpenseMonth,
          expenseDate: new Date().toISOString().split('T')[0],
          receiptUrl: newExpenseReceipt || undefined,
          includedParticipantIds: participants.map(p => p.id),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ثبت هزینه')
      }

      setShowAddExpense(false)
      setNewExpenseTitle('')
      setNewExpenseAmount('')
      setNewExpenseReceipt(null)
      setSuccess('هزینه با موفقیت ثبت شد')
      setTimeout(() => setSuccess(''), 3000)

      // Refresh expenses
      await fetchExpenses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت هزینه')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCommonExpense = async () => {
    if (!editingCommonExpense || !editCommonExpenseAmount) return

    const parsedAmount = parseMoney(editCommonExpenseAmount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('مبلغ باید بیشتر از صفر باشد')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${editingCommonExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
        }),
      })

      if (!res.ok) throw new Error('خطا در ویرایش')

      setEditingCommonExpense(null)
      setSuccess('هزینه با موفقیت ویرایش شد')
      setTimeout(() => setSuccess(''), 3000)

      await fetchExpenses()
    } catch {
      setError('خطا در ویرایش هزینه')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCommonExpense = async () => {
    if (!showDeleteCommonExpense) return

    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${showDeleteCommonExpense.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('خطا در حذف')

      setShowDeleteCommonExpense(null)
      setSuccess('هزینه حذف شد')
      setTimeout(() => setSuccess(''), 3000)

      await fetchExpenses()
    } catch {
      setError('خطا در حذف هزینه')
    } finally {
      setDeleting(false)
    }
  }

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={() => router.back()}>بازگشت</Button>
      </div>
    )
  }

  // ── No Charge Rules ─────────────────────────────────────────
  if (!data || data.message || data.periods.length === 0) {
    return (
      <main className="min-h-dvh bg-gray-50 dark:bg-gray-950">
        <Header onBack={() => router.back()} title="مدیریت شارژ ماهیانه" />

        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📅</span>
          </div>
          <h2 className="text-xl font-bold mb-2">شارژ تعریف نشده</h2>
          <p className="text-gray-500 mb-6 max-w-xs">
            {data?.message || 'برای استفاده از این بخش، ابتدا مبلغ شارژ ماهیانه را تعیین کنید'}
          </p>
          <Button
            onClick={() => router.push(`/project/${projectId}/charge-rules`)}
            className="!bg-emerald-500 hover:!bg-emerald-600"
          >
            تعیین مبلغ شارژ
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-8">
      <Header onBack={() => router.back()} title="مدیریت شارژ ماهیانه" />

      {/* Messages */}
      {(error || success) && (
        <div className="px-4 pt-4 space-y-2">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 p-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('charge')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'charge'
                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            شارژ ماهیانه
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'expenses'
                ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            هزینه‌ها
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'charge' ? (
        <>
          {/* Summary */}
          <div className="px-4 pt-4">
            <Card className="p-4 bg-gradient-to-l from-emerald-500 to-teal-600 text-white border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">شارژ هر واحد</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatMoney(data.chargePerUnit, 'IRR')}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-emerald-100 text-sm">کل ماهیانه</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatMoney(data.totalChargePerPeriod, 'IRR')}
                  </p>
                  <p className="text-emerald-200 text-xs">{data.participantsCount} واحد</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Section Title */}
          <div className="px-4 mt-6 mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 dark:text-gray-200">وضعیت ماه‌ها</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                تکمیل
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                ناقص
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                نشده
              </span>
            </div>
          </div>

          {/* Months Grid - Sorted from oldest to newest */}
          <div className="px-4">
            <div className="grid grid-cols-4 gap-2">
              {sortedPeriods.map((period) => {
                const allPaid = period.paidCount === data.participantsCount
                const nonePaid = period.paidCount === 0
                const isCurrent = period.periodKey === currentPeriodKey

                // Extract month name without year for compact display
                const monthName = period.periodLabel.split(' ')[0]
                const year = period.periodLabel.split(' ')[1]

                return (
                  <button
                    key={period.periodKey}
                    onClick={() => openPeriodDetail(period)}
                    className={`relative p-3 rounded-xl text-center transition-all active:scale-95 ${
                      allPaid
                        ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                        : nonePaid
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    } ${isCurrent ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></span>
                    )}
                    <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                      {monthName}
                    </p>
                    <p className="text-[10px] text-gray-500">{year}</p>
                    <div className="mt-1 flex items-center justify-center gap-0.5">
                      <span className={`text-sm font-bold ${
                        allPaid ? 'text-green-600' : nonePaid ? 'text-red-500' : 'text-yellow-600'
                      }`}>
                        {period.paidCount}
                      </span>
                      <span className="text-gray-400 text-xs">/</span>
                      <span className="text-gray-500 text-xs">{data.participantsCount}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        /* Expenses Tab */
        <div className="px-4 pt-4 space-y-4">
          {/* Month Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              انتخاب ماه
            </label>
            <select
              value={selectedExpenseMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              {availablePeriods.map((period) => (
                <option key={period.key} value={period.key}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {/* Add Expense Button */}
          <Button
            onClick={() => setShowAddExpense(true)}
            className="w-full !bg-orange-500 hover:!bg-orange-600"
          >
            + ثبت هزینه جدید
          </Button>

          {/* Expenses List */}
          {expensesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">هزینه‌ای برای {formatPeriodKey(selectedExpenseMonth)} ثبت نشده</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <Card key={expense.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{expense.title}</p>
                      <p className="text-sm text-gray-500">
                        پرداخت: {expense.paidBy.name} • {expense.expenseDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-orange-600">
                        {formatMoney(expense.amount, 'IRR')}
                      </p>
                      {expense.receiptUrl && (
                        <button
                          onClick={() => setViewingReceipt(expense.receiptUrl!)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="مشاهده رسید"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => {
                        setEditingCommonExpense(expense)
                        setEditCommonExpenseAmount(expense.amount.toString())
                      }}
                      className="flex-1 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      ویرایش
                    </button>
                    <button
                      onClick={() => setShowDeleteCommonExpense(expense)}
                      className="flex-1 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      حذف
                    </button>
                  </div>
                </Card>
              ))}

              {/* Total */}
              <Card className="p-4 bg-gradient-to-l from-orange-500 to-amber-500 text-white border-0 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-orange-100">مجموع هزینه‌های {formatPeriodKey(selectedExpenseMonth, false)}</span>
                  <span className="text-xl font-bold">
                    {formatMoney(expenses.reduce((sum, e) => sum + e.amount, 0), 'IRR')}
                  </span>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Period Detail Modal */}
      <BottomSheet
        isOpen={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
        title={`شارژ ${selectedPeriod?.periodLabel || ''}`}
      >
        {selectedPeriod && (
          <div className="space-y-4">
            {/* Period Summary */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600 dark:text-gray-400">وضعیت کلی</span>
                <span className="font-bold">
                  <span className="text-green-600">{selectedPeriod.paidCount}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span>{data.participantsCount}</span>
                  <span className="text-sm text-gray-500 mr-1">پرداخت شده</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-green-500 to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${(selectedPeriod.paidCount / data.participantsCount) * 100}%`,
                  }}
                />
              </div>

              <div className="flex justify-between mt-3 text-sm">
                <span className="text-gray-500">
                  دریافتی: <span className="text-green-600 font-medium">{formatMoney(selectedPeriod.totalPaid, 'IRR')}</span>
                </span>
                <span className="text-gray-500">
                  باقی‌مانده: <span className="text-red-500 font-medium">{formatMoney(selectedPeriod.totalExpected - selectedPeriod.totalPaid, 'IRR')}</span>
                </span>
              </div>
            </div>

            {/* Units List */}
            <div>
              <h3 className="font-semibold mb-3">وضعیت واحدها</h3>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {selectedPeriod.participants.map((unit) => (
                  <Card
                    key={unit.id}
                    className="p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UnitStatusIcon status={unit.status} />
                        <div>
                          <p className="font-medium">{unit.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatMoney(unit.expectedAmount, 'IRR')}
                          </p>
                        </div>
                      </div>

                      {unit.status === 'paid' ? (
                        <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          پرداخت شده
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => openPaymentModal(unit)}
                          className="!bg-emerald-500 hover:!bg-emerald-600 !px-3 !py-1.5 !text-sm"
                        >
                          ثبت پرداخت
                        </Button>
                      )}
                    </div>

                    {/* List of expenses for this unit */}
                    {unit.expenses && unit.expenses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                        {unit.expenses.map((expense) => (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2"
                          >
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {formatMoney(expense.amount, 'IRR')}
                              </p>
                              <p className="text-xs text-gray-500">{expense.expenseDate}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {expense.receiptUrl && (
                                <button
                                  onClick={() => setViewingReceipt(expense.receiptUrl!)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                  title="مشاهده رسید"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => openEditModal(expense)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="ویرایش"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(expense)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="حذف"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Payment Modal */}
      <BottomSheet
        isOpen={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        title="ثبت پرداخت شارژ"
      >
        {selectedUnit && selectedPeriod && (
          <div className="space-y-4">
            {/* Info */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-emerald-800 dark:text-emerald-200 font-semibold">
                  {selectedUnit.name}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                  {selectedPeriod.periodLabel}
                </span>
              </div>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">
                مبلغ شارژ: {formatMoney(selectedUnit.expectedAmount, 'IRR')}
              </p>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مبلغ پرداختی (تومان)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-2xl font-bold text-center"
                dir="ltr"
                placeholder="0"
              />
            </div>

            <Button
              onClick={handlePayCharge}
              loading={submitting}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              className="w-full !bg-emerald-500 hover:!bg-emerald-600 !py-4 text-lg"
            >
              ثبت پرداخت
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Edit Expense Modal */}
      <BottomSheet
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        title="ویرایش مبلغ شارژ"
      >
        {editingExpense && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                تاریخ پرداخت: {editingExpense.expenseDate}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مبلغ جدید (تومان)
              </label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-2xl font-bold text-center"
                dir="ltr"
                placeholder="0"
              />
            </div>

            <Button
              onClick={handleEditExpense}
              loading={submitting}
              disabled={!editAmount || parseFloat(editAmount) <= 0}
              className="w-full !bg-blue-500 hover:!bg-blue-600 !py-4 text-lg"
            >
              ذخیره تغییرات
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Delete Confirmation Modal */}
      <BottomSheet
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="حذف پرداخت"
      >
        {showDeleteConfirm && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
              <p className="text-red-800 dark:text-red-200">
                آیا مطمئن هستید که می‌خواهید این پرداخت را حذف کنید؟
              </p>
              <p className="text-red-600 dark:text-red-400 text-lg font-bold mt-2">
                {formatMoney(showDeleteConfirm.amount, 'IRR')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                انصراف
              </Button>
              <Button
                onClick={handleDeleteExpense}
                loading={deleting}
                className="flex-1 !bg-red-500 hover:!bg-red-600"
              >
                حذف
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Add Expense Modal */}
      <BottomSheet
        isOpen={showAddExpense}
        onClose={() => {
          setShowAddExpense(false)
          setNewExpenseReceipt(null)
        }}
        title={`ثبت هزینه - ${formatPeriodKey(selectedExpenseMonth)}`}
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              عنوان هزینه
            </label>
            <Input
              value={newExpenseTitle}
              onChange={(e) => setNewExpenseTitle(e.target.value)}
              placeholder="مثلاً: تعمیر موتورخانه"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              مبلغ (تومان)
            </label>
            <Input
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              placeholder="۵۰۰٬۰۰۰"
              inputMode="numeric"
              className="text-left"
              dir="ltr"
            />
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              پرداخت‌کننده
            </label>
            <select
              value={newExpensePaidById}
              onChange={(e) => setNewExpensePaidById(e.target.value)}
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تصویر رسید (اختیاری)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {newExpenseReceipt ? (
              <div className="relative">
                <Image
                  src={newExpenseReceipt}
                  alt="رسید"
                  width={200}
                  height={200}
                  className="w-full h-40 object-cover rounded-xl"
                />
                <button
                  onClick={() => setNewExpenseReceipt(null)}
                  className="absolute top-2 left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingReceipt}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
              >
                {uploadingReceipt ? (
                  <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    انتخاب تصویر
                  </>
                )}
              </button>
            )}
          </div>

          <Button
            onClick={handleAddExpense}
            loading={submitting}
            disabled={!newExpenseTitle.trim() || !newExpenseAmount || !newExpensePaidById}
            className="w-full !bg-orange-500 hover:!bg-orange-600"
          >
            ثبت هزینه
          </Button>
        </div>
      </BottomSheet>

      {/* Edit Common Expense Modal */}
      <BottomSheet
        isOpen={!!editingCommonExpense}
        onClose={() => setEditingCommonExpense(null)}
        title="ویرایش هزینه"
      >
        {editingCommonExpense && (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <p className="font-medium text-orange-800 dark:text-orange-200">
                {editingCommonExpense.title}
              </p>
              <p className="text-orange-600 dark:text-orange-400 text-sm mt-1">
                تاریخ: {editingCommonExpense.expenseDate}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مبلغ جدید (تومان)
              </label>
              <Input
                value={editCommonExpenseAmount}
                onChange={(e) => setEditCommonExpenseAmount(e.target.value)}
                inputMode="numeric"
                className="text-left text-xl font-bold"
                dir="ltr"
              />
            </div>

            <Button
              onClick={handleEditCommonExpense}
              loading={submitting}
              disabled={!editCommonExpenseAmount}
              className="w-full !bg-orange-500 hover:!bg-orange-600"
            >
              ذخیره تغییرات
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Delete Common Expense Confirmation */}
      <BottomSheet
        isOpen={!!showDeleteCommonExpense}
        onClose={() => setShowDeleteCommonExpense(null)}
        title="حذف هزینه"
      >
        {showDeleteCommonExpense && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
              <p className="text-red-800 dark:text-red-200">
                آیا مطمئن هستید که می‌خواهید این هزینه را حذف کنید؟
              </p>
              <p className="font-medium mt-2">{showDeleteCommonExpense.title}</p>
              <p className="text-red-600 dark:text-red-400 text-lg font-bold mt-1">
                {formatMoney(showDeleteCommonExpense.amount, 'IRR')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteCommonExpense(null)}
                className="flex-1"
              >
                انصراف
              </Button>
              <Button
                onClick={handleDeleteCommonExpense}
                loading={deleting}
                className="flex-1 !bg-red-500 hover:!bg-red-600"
              >
                حذف
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* View Receipt Modal */}
      <BottomSheet
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        title="تصویر رسید"
      >
        {viewingReceipt && (
          <div className="flex justify-center">
            <Image
              src={viewingReceipt}
              alt="رسید"
              width={400}
              height={400}
              className="max-w-full max-h-[60vh] object-contain rounded-xl"
            />
          </div>
        )}
      </BottomSheet>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────────

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
    </div>
  )
}

function UnitStatusIcon({ status }: { status: 'paid' | 'partial' | 'unpaid' }) {
  if (status === 'paid') {
    return (
      <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }

  if (status === 'partial') {
    return (
      <div className="w-9 h-9 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}
