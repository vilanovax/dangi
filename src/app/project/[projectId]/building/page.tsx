'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, BottomSheet } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { formatPeriodKey, getCurrentPersianYear, PERSIAN_MONTHS } from '@/lib/utils/persian-date'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Participant {
  id: string
  name: string
  weight: number
  avatar?: string | null
}

interface ChargeRule {
  id: string
  title: string
  amount: number
}

interface UnitStatus {
  id: string
  name: string
  weight: number
  expectedAmount: number
  paidAmount: number
  status: 'paid' | 'partial' | 'unpaid'
}

interface PeriodData {
  periodKey: string
  periodLabel: string
  units: UnitStatus[]
  totalExpected: number
  totalPaid: number
  paidCount: number
  unpaidCount: number
}

interface Project {
  id: string
  name: string
  currency: string
  participants: Participant[]
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function BuildingDashboard() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // State
  const [project, setProject] = useState<Project | null>(null)
  const [chargeRules, setChargeRules] = useState<ChargeRule[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<PeriodData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals
  const [showPayChargeModal, setShowPayChargeModal] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitStatus | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Current period key (e.g., "1403-11")
  const currentYear = getCurrentPersianYear()
  const currentMonth = new Date().getMonth() + 1
  // Map Gregorian month to Persian month (approximate)
  const persianMonth = currentMonth <= 3 ? currentMonth + 9 : currentMonth - 3
  const currentPeriodKey = `${currentYear}-${String(persianMonth).padStart(2, '0')}`

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      // Fetch project and charge status in parallel
      const [projectRes, chargeRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/charge-status?periods=1`),
      ])

      if (!projectRes.ok) throw new Error('پروژه یافت نشد')

      const projectData = await projectRes.json()
      setProject(projectData.project)

      if (chargeRes.ok) {
        const chargeData = await chargeRes.json()
        setChargeRules(chargeData.chargeRules || [])

        if (chargeData.periods?.length > 0) {
          const period = chargeData.periods[0]
          setCurrentPeriod({
            periodKey: period.periodKey,
            periodLabel: period.periodLabel,
            units: period.participants,
            totalExpected: period.totalExpected,
            totalPaid: period.totalPaid,
            paidCount: period.paidCount,
            unpaidCount: period.unpaidCount,
          })
        }
      }
    } catch {
      setError('خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const totalChargeAmount = chargeRules.reduce((sum, r) => sum + r.amount, 0)

  const openPayChargeModal = (unit: UnitStatus) => {
    setSelectedUnit(unit)
    setPaymentAmount(unit.expectedAmount.toString())
    setShowPayChargeModal(true)
  }

  const handlePayCharge = async () => {
    if (!selectedUnit || !paymentAmount) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `شارژ ${currentPeriod?.periodLabel || 'ماهیانه'} - ${selectedUnit.name}`,
          amount: parseFloat(paymentAmount),
          paidById: selectedUnit.id,
          periodKey: currentPeriod?.periodKey || currentPeriodKey,
          expenseDate: new Date().toISOString().split('T')[0],
          splitEqually: false,
          shares: [], // No shares for charge payment
        }),
      })

      if (!res.ok) throw new Error('خطا در ثبت پرداخت')

      setShowPayChargeModal(false)
      fetchData() // Refresh data
    } catch {
      setError('خطا در ثبت پرداخت شارژ')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading State ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Error State ───────────────────────────────────────────
  if (error || !project) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center">
        <p className="text-gray-500">{error || 'پروژه یافت نشد'}</p>
      </div>
    )
  }

  // ── No Charge Rules ───────────────────────────────────────
  if (chargeRules.length === 0) {
    return (
      <main className="min-h-dvh">
        <BuildingHeader
          projectName={project.name}
          onSettingsClick={() => router.push(`/project/${projectId}/settings`)}
        />

        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🏢</span>
          </div>
          <h2 className="text-xl font-bold mb-2">خوش آمدید!</h2>
          <p className="text-gray-500 mb-6 max-w-xs">
            برای شروع، ابتدا مبلغ شارژ ماهیانه را تعیین کنید
          </p>
          <Button onClick={() => router.push(`/project/${projectId}/charge-rules`)}>
            تعیین مبلغ شارژ
          </Button>
        </div>
      </main>
    )
  }

  // ── Main Dashboard ────────────────────────────────────────
  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-24">
      <BuildingHeader
        projectName={project.name}
        onSettingsClick={() => router.push(`/project/${projectId}/settings`)}
      />

      {/* Current Month Charge Card */}
      <div className="px-4 -mt-4">
        <Card className="p-4 bg-gradient-to-l from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-emerald-100 text-sm">
              شارژ {currentPeriod?.periodLabel || 'این ماه'}
            </span>
            <Link
              href={`/project/${projectId}/charge-dashboard`}
              className="text-xs text-emerald-200 hover:text-white"
            >
              تاریخچه ←
            </Link>
          </div>

          <div className="text-3xl font-bold mb-4">
            {formatMoney(totalChargeAmount, project.currency)}
          </div>

          {currentPeriod && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-100">
                {currentPeriod.paidCount} از {currentPeriod.units.length} واحد پرداخت کرده
              </span>
              <span className="font-medium">
                {formatMoney(currentPeriod.totalPaid, project.currency)}
              </span>
            </div>
          )}

          {/* Progress */}
          {currentPeriod && (
            <div className="mt-3 h-2 bg-emerald-400/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{
                  width: `${
                    currentPeriod.totalExpected > 0
                      ? (currentPeriod.totalPaid / currentPeriod.totalExpected) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Units List */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">وضعیت واحدها</h2>
          <Link
            href={`/project/${projectId}/participants`}
            className="text-sm text-blue-500"
          >
            مدیریت واحدها
          </Link>
        </div>

        <Card className="divide-y divide-gray-100 dark:divide-gray-800">
          {currentPeriod?.units.map((unit) => (
            <div
              key={unit.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <UnitStatusIcon status={unit.status} />
                <div>
                  <p className="font-medium">{unit.name}</p>
                  <p className="text-xs text-gray-500">
                    {unit.weight > 1 && `${unit.weight} متر • `}
                    سهم: {formatMoney(unit.expectedAmount, project.currency)}
                  </p>
                </div>
              </div>

              {unit.status !== 'paid' ? (
                <Button
                  size="sm"
                  onClick={() => openPayChargeModal(unit)}
                  className="!bg-emerald-500 hover:!bg-emerald-600"
                >
                  ثبت پرداخت
                </Button>
              ) : (
                <span className="text-sm text-green-600 font-medium">
                  پرداخت شده ✓
                </span>
              )}
            </div>
          ))}

          {(!currentPeriod || currentPeriod.units.length === 0) && (
            <div className="py-8 text-center text-gray-500">
              واحدی تعریف نشده است
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/project/${projectId}/expenses`}>
            <Card className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="text-2xl mb-2">📋</div>
              <p className="text-sm font-medium">هزینه‌های مشترک</p>
              <p className="text-xs text-gray-500 mt-1">تعمیرات، نظافت و...</p>
            </Card>
          </Link>

          <Link href={`/project/${projectId}/summary`}>
            <Card className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium">خلاصه حساب</p>
              <p className="text-xs text-gray-500 mt-1">بدهی و طلب هر واحد</p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Pay Charge Modal */}
      <BottomSheet
        isOpen={showPayChargeModal}
        onClose={() => setShowPayChargeModal(false)}
        title={`ثبت پرداخت شارژ - ${selectedUnit?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              دوره
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center font-medium">
              {currentPeriod?.periodLabel || 'این ماه'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              مبلغ پرداختی
            </label>
            <div className="relative">
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full p-3 pr-16 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-lg font-medium text-left"
                dir="ltr"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                تومان
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              سهم این واحد: {formatMoney(selectedUnit?.expectedAmount || 0, 'IRR')}
            </p>
          </div>

          <Button
            onClick={handlePayCharge}
            loading={submitting}
            disabled={!paymentAmount}
            className="w-full !bg-emerald-500 hover:!bg-emerald-600"
          >
            ثبت پرداخت شارژ
          </Button>
        </div>
      </BottomSheet>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────────

function BuildingHeader({
  projectName,
  onSettingsClick,
}: {
  projectName: string
  onSettingsClick: () => void
}) {
  return (
    <div className="bg-gradient-to-b from-emerald-600 to-emerald-500 px-4 pt-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{projectName}</h1>
          <p className="text-emerald-100 text-sm">مدیریت شارژ ساختمان</p>
        </div>
        <button
          onClick={onSettingsClick}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function UnitStatusIcon({ status }: { status: 'paid' | 'partial' | 'unpaid' }) {
  if (status === 'paid') {
    return (
      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }

  if (status === 'partial') {
    return (
      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }

  return (
    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  )
}
