'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Card, BottomSheet } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ParticipantStatus {
  id: string
  name: string
  weight: number
  expectedAmount: number
  paidAmount: number
  status: 'paid' | 'partial' | 'unpaid'
  paidDate?: string
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

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ChargeDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

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

  useEffect(() => {
    fetchChargeStatus()
  }, [projectId])

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
      <div className="px-4 space-y-2">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 p-3 rounded-xl text-sm">
            {success}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="px-4 mt-4">
        <Card className="p-4 bg-gradient-to-l from-emerald-500 to-teal-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">شارژ ماهیانه هر واحد</p>
              <p className="text-2xl font-bold mt-1">
                {formatMoney(data.chargePerUnit, 'IRR')}
              </p>
            </div>
            <div className="text-left">
              <p className="text-emerald-100 text-sm">کل دریافتی ماهیانه</p>
              <p className="text-2xl font-bold mt-1">
                {formatMoney(data.totalChargePerPeriod, 'IRR')}
              </p>
              <p className="text-emerald-200 text-xs">{data.participantsCount} واحد</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Instruction */}
      <div className="px-4 mt-6">
        <p className="text-sm text-gray-500 mb-3">
          برای ثبت پرداخت، روی ماه مورد نظر کلیک کنید
        </p>
      </div>

      {/* Months Grid */}
      <div className="px-4 mt-2">
        <div className="grid grid-cols-3 gap-3">
          {data.periods.map((period) => {
            const allPaid = period.paidCount === data.participantsCount
            const nonePaid = period.paidCount === 0
            const somePaid = !allPaid && !nonePaid

            return (
              <button
                key={period.periodKey}
                onClick={() => openPeriodDetail(period)}
                className={`p-4 rounded-2xl text-center transition-all active:scale-95 ${
                  allPaid
                    ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700'
                    : nonePaid
                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700'
                }`}
              >
                <p className="font-bold text-gray-800 dark:text-gray-200">
                  {period.periodLabel}
                </p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <span className={`text-lg font-bold ${
                    allPaid ? 'text-green-600' : somePaid ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {period.paidCount}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-500">{data.participantsCount}</span>
                </div>
                <p className={`text-xs mt-1 ${
                  allPaid
                    ? 'text-green-600'
                    : nonePaid
                    ? 'text-red-500'
                    : 'text-yellow-600'
                }`}>
                  {allPaid ? 'تکمیل ✓' : nonePaid ? 'پرداخت نشده' : 'ناقص'}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>تکمیل</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>ناقص</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>پرداخت نشده</span>
          </div>
        </div>
      </div>

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
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
              <div className="space-y-2">
                {selectedPeriod.participants.map((unit) => (
                  <Card
                    key={unit.id}
                    className="p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <UnitStatusIcon status={unit.status} />
                      <div>
                        <p className="font-medium">{unit.name}</p>
                        <p className="text-xs text-gray-500">
                          سهم: {formatMoney(unit.expectedAmount, 'IRR')}
                        </p>
                      </div>
                    </div>

                    {unit.status === 'paid' ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">پرداخت شده</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => openPaymentModal(unit)}
                        className="!bg-emerald-500 hover:!bg-emerald-600 !px-4"
                      >
                        ثبت پرداخت
                      </Button>
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
                سهم این واحد: {formatMoney(selectedUnit.expectedAmount, 'IRR')}
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
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────────

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 px-4 py-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
    </div>
  )
}

function UnitStatusIcon({ status }: { status: 'paid' | 'partial' | 'unpaid' }) {
  if (status === 'paid') {
    return (
      <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }

  if (status === 'partial') {
    return (
      <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}
