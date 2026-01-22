'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, BottomSheet } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { getCurrentPersianYear } from '@/lib/utils/persian-date'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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
  const [success, setSuccess] = useState('')

  // Modals
  const [showPayChargeModal, setShowPayChargeModal] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitStatus | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Current period key
  const currentYear = getCurrentPersianYear()
  const currentMonth = new Date().getMonth() + 1
  const persianMonth = currentMonth <= 3 ? currentMonth + 9 : currentMonth - 3
  const currentPeriodKey = `${currentYear}-${String(persianMonth).padStart(2, '0')}`

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
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
    setError('')
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
          shares: [],
        }),
      })

      if (!res.ok) throw new Error('خطا در ثبت پرداخت')

      setShowPayChargeModal(false)
      setSuccess(`شارژ ${selectedUnit.name} ثبت شد`)
      setTimeout(() => setSuccess(''), 3000)
      fetchData()
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
  if (!project) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-500 mb-4">{error || 'پروژه یافت نشد'}</p>
        <Button onClick={() => router.push('/')}>بازگشت</Button>
      </div>
    )
  }

  // ── No Charge Rules ─────────────────────────────────────────
  if (chargeRules.length === 0) {
    return (
      <main className="min-h-dvh bg-gray-50 dark:bg-gray-950">
        <BuildingHeader
          projectName={project.name}
          onBackClick={() => router.push('/')}
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

  // ── Main Dashboard ──────────────────────────────────────────
  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-8">
      <BuildingHeader
        projectName={project.name}
        onBackClick={() => router.push('/')}
        onSettingsClick={() => router.push(`/project/${projectId}/settings`)}
      />

      {/* Messages */}
      <div className="px-4 -mt-4 space-y-2">
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

      {/* Current Month Card */}
      <div className={`px-4 ${error || success ? 'mt-2' : '-mt-4'}`}>
        <Card className="p-4 bg-gradient-to-l from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-100 text-sm">
              شارژ {currentPeriod?.periodLabel || 'این ماه'}
            </span>
            <Link
              href={`/project/${projectId}/charge-dashboard`}
              className="text-xs bg-white/20 px-2 py-1 rounded-lg hover:bg-white/30 transition-colors"
            >
              مدیریت ماهیانه
            </Link>
          </div>

          <div className="text-3xl font-bold mb-3">
            {formatMoney(totalChargeAmount, project.currency)}
          </div>

          {currentPeriod && (
            <>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-100">
                  {currentPeriod.paidCount} از {currentPeriod.units.length} واحد
                </span>
                <span className="font-medium">
                  {formatMoney(currentPeriod.totalPaid, project.currency)} دریافت شده
                </span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Units List */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">وضعیت واحدها</h2>
          <Link
            href={`/project/${projectId}/participants`}
            className="text-sm text-emerald-600 font-medium"
          >
            مدیریت واحدها
          </Link>
        </div>

        <div className="space-y-2">
          {currentPeriod?.units.map((unit) => (
            <Card
              key={unit.id}
              className="p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <UnitStatusBadge status={unit.status} />
                <div>
                  <p className="font-semibold">{unit.name}</p>
                  <p className="text-xs text-gray-500">
                    سهم: {formatMoney(unit.expectedAmount, project.currency)}
                    {unit.weight > 1 && ` (${unit.weight} متر)`}
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
                  onClick={() => openPayChargeModal(unit)}
                  className="!bg-emerald-500 hover:!bg-emerald-600 !px-4"
                >
                  ثبت پرداخت
                </Button>
              )}
            </Card>
          ))}

          {(!currentPeriod || currentPeriod.units.length === 0) && (
            <Card className="p-8 text-center">
              <p className="text-gray-500">واحدی تعریف نشده است</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/project/${projectId}/participants`)}
                className="mt-3"
              >
                افزودن واحد
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold mb-3">دسترسی سریع</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/project/${projectId}/charge-dashboard`}>
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm">واریز شارژ</p>
                  <p className="text-xs text-gray-500">ثبت پرداخت ماهیانه</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/project/${projectId}/summary`}>
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm">خلاصه حساب</p>
                  <p className="text-xs text-gray-500">بدهی و طلب</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/project/${projectId}/charge-rules`}>
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm">تنظیم شارژ</p>
                  <p className="text-xs text-gray-500">مبلغ ماهیانه</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/project/${projectId}/add-expense`}>
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm">ثبت هزینه</p>
                  <p className="text-xs text-gray-500">هزینه جدید</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Pay Charge Modal */}
      <BottomSheet
        isOpen={showPayChargeModal}
        onClose={() => setShowPayChargeModal(false)}
        title="ثبت پرداخت شارژ"
      >
        <div className="space-y-4">
          {/* Unit Info */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-emerald-800 dark:text-emerald-200 font-semibold">
                {selectedUnit?.name}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                {currentPeriod?.periodLabel}
              </span>
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">
              سهم این واحد: {formatMoney(selectedUnit?.expectedAmount || 0, 'IRR')}
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
      </BottomSheet>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────────

function BuildingHeader({
  projectName,
  onBackClick,
  onSettingsClick,
}: {
  projectName: string
  onBackClick: () => void
  onSettingsClick: () => void
}) {
  return (
    <div className="bg-gradient-to-b from-emerald-600 to-emerald-500 px-4 pt-4 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackClick}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={onSettingsClick}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">{projectName}</h1>
        <p className="text-emerald-100 text-sm mt-1">مدیریت شارژ ساختمان</p>
      </div>
    </div>
  )
}

function UnitStatusBadge({ status }: { status: 'paid' | 'partial' | 'unpaid' }) {
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
