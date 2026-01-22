'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, BottomSheet } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface MonthStat {
  month: string
  monthName: string
  periodKey: string
  paidCount: number
  unpaidCount: number
  totalPaid: number
  totalExpected: number
  percentage: number
}

interface ParticipantStat {
  id: string
  name: string
  paidMonths: number
  totalMonths: number
  totalPaid: number
  totalExpected: number
  percentage: number
  status: 'complete' | 'partial' | 'none'
}

interface RecentPayment {
  id: string
  title: string
  amount: number
  paidBy: string
  periodKey: string | null
  date: string
}

interface YearStats {
  totalExpected: number
  totalPaid: number
  percentage: number
  remaining: number
}

interface BuildingStats {
  chargeYear: number
  chargePerUnit: number
  participantsCount: number
  yearStats: YearStats
  monthlyStats: MonthStat[]
  participantStats: ParticipantStat[]
  recentPayments: RecentPayment[]
}

interface Project {
  id: string
  name: string
  currency: string
}

type TabType = 'overview' | 'months' | 'units' | 'payments'

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function BuildingDashboard() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // State
  const [project, setProject] = useState<Project | null>(null)
  const [stats, setStats] = useState<BuildingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Payment modal
  const [selectedUnit, setSelectedUnit] = useState<ParticipantStat | null>(null)
  const [showQuickActions, setShowQuickActions] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const [projectRes, statsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/building-stats`),
      ])

      if (!projectRes.ok) throw new Error('پروژه یافت نشد')

      const projectData = await projectRes.json()
      setProject(projectData.project)

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch {
      setError('خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  // Calculate current month status
  const currentMonthStat = useMemo(() => {
    if (!stats) return null
    const now = new Date()
    const month = now.getMonth()
    const day = now.getDate()

    // Approximate Persian month
    const monthMapping: Record<number, string> = {
      0: day < 21 ? '10' : '11',
      1: day < 20 ? '11' : '12',
      2: day < 21 ? '12' : '01',
      3: day < 21 ? '01' : '02',
      4: day < 22 ? '02' : '03',
      5: day < 22 ? '03' : '04',
      6: day < 23 ? '04' : '05',
      7: day < 23 ? '05' : '06',
      8: day < 23 ? '06' : '07',
      9: day < 23 ? '07' : '08',
      10: day < 22 ? '08' : '09',
      11: day < 22 ? '09' : '10',
    }
    const currentMonth = monthMapping[month] || '01'
    return stats.monthlyStats.find((m) => m.month === currentMonth)
  }, [stats])

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

  // ── No Stats ───────────────────────────────────────────────
  if (!stats || stats.chargePerUnit === 0) {
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
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-24">
      <BuildingHeader
        projectName={project.name}
        yearStats={stats.yearStats}
        chargeYear={stats.chargeYear}
        participantsCount={stats.participantsCount}
        onBackClick={() => router.push('/')}
        onSettingsClick={() => router.push(`/project/${projectId}/settings`)}
      />

      {/* Tabs */}
      <div className="px-4 mt-3">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          {[
            { key: 'overview', label: 'نمای کلی' },
            { key: 'months', label: 'ماه‌ها' },
            { key: 'units', label: 'واحدها' },
            { key: 'payments', label: 'پرداخت‌ها' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-4">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            currentMonth={currentMonthStat}
            projectId={projectId}
            currency={project.currency}
          />
        )}
        {activeTab === 'months' && (
          <MonthsTab stats={stats} projectId={projectId} currency={project.currency} />
        )}
        {activeTab === 'units' && (
          <UnitsTab
            stats={stats}
            currency={project.currency}
            onUnitClick={(unit) => setSelectedUnit(unit)}
          />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab payments={stats.recentPayments} currency={project.currency} />
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowQuickActions(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Quick Actions Modal */}
      <BottomSheet
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        title="عملیات سریع"
      >
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/project/${projectId}/charge-dashboard`} onClick={() => setShowQuickActions(false)}>
            <Card className="p-4 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-medium text-sm">ثبت شارژ</p>
            </Card>
          </Link>

          <Link href={`/project/${projectId}/add-expense`} onClick={() => setShowQuickActions(false)}>
            <Card className="p-4 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-medium text-sm">هزینه جدید</p>
            </Card>
          </Link>

          <Link href={`/project/${projectId}/charge-rules`} onClick={() => setShowQuickActions(false)}>
            <Card className="p-4 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-medium text-sm">تنظیم شارژ</p>
            </Card>
          </Link>

          <Link href={`/project/${projectId}/participants`} onClick={() => setShowQuickActions(false)}>
            <Card className="p-4 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-medium text-sm">مدیریت واحدها</p>
            </Card>
          </Link>
        </div>
      </BottomSheet>

      {/* Unit Detail Modal */}
      <BottomSheet
        isOpen={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        title={`وضعیت ${selectedUnit?.name || ''}`}
      >
        {selectedUnit && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600 dark:text-gray-400">وضعیت پرداخت</span>
                <span className={`font-bold ${
                  selectedUnit.status === 'complete' ? 'text-green-600' :
                  selectedUnit.status === 'partial' ? 'text-yellow-600' : 'text-red-500'
                }`}>
                  {selectedUnit.paidMonths} از {selectedUnit.totalMonths} ماه
                </span>
              </div>

              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    selectedUnit.status === 'complete' ? 'bg-green-500' :
                    selectedUnit.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${selectedUnit.percentage}%` }}
                />
              </div>

              <div className="flex justify-between mt-3 text-sm">
                <span>پرداختی: {formatMoney(selectedUnit.totalPaid, 'IRR')}</span>
                <span>از کل: {formatMoney(selectedUnit.totalExpected, 'IRR')}</span>
              </div>
            </div>

            <Link href={`/project/${projectId}/charge-dashboard`}>
              <Button className="w-full !bg-emerald-500 hover:!bg-emerald-600">
                ثبت پرداخت جدید
              </Button>
            </Link>
          </div>
        )}
      </BottomSheet>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Tab Components
// ─────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  currentMonth,
  projectId,
  currency,
}: {
  stats: BuildingStats
  currentMonth: MonthStat | null | undefined
  projectId: string
  currency: string
}) {
  return (
    <div className="space-y-4">
      {/* Current Month Status */}
      {currentMonth && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">ماه جاری ({currentMonth.monthName})</h3>
            <Link
              href={`/project/${projectId}/charge-dashboard`}
              className="text-sm text-emerald-600 font-medium"
            >
              ثبت پرداخت
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{currentMonth.paidCount}</p>
              <p className="text-xs text-gray-500">پرداخت شده</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-2xl font-bold text-red-500">{currentMonth.unpaidCount}</p>
              <p className="text-xs text-gray-500">پرداخت نشده</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{currentMonth.percentage}%</p>
              <p className="text-xs text-gray-500">وصولی</p>
            </div>
          </div>
        </Card>
      )}

      {/* Mini Chart - Monthly Trend */}
      <Card className="p-4">
        <h3 className="font-bold mb-3">روند وصول ماهیانه</h3>
        <div className="flex items-end gap-1 h-24">
          {stats.monthlyStats.map((month) => (
            <div key={month.month} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-emerald-500 rounded-t transition-all"
                style={{
                  height: `${Math.max(month.percentage, 5)}%`,
                  opacity: month.percentage > 0 ? 1 : 0.3,
                }}
              />
              <span className="text-[8px] text-gray-500 mt-1 truncate w-full text-center">
                {month.monthName.slice(0, 3)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">شارژ ماهیانه</p>
              <p className="font-bold">{formatMoney(stats.chargePerUnit, currency)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">تعداد واحدها</p>
              <p className="font-bold">{stats.participantsCount} واحد</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function MonthsTab({
  stats,
  projectId,
  currency,
}: {
  stats: BuildingStats
  projectId: string
  currency: string
}) {
  return (
    <div className="space-y-2">
      {stats.monthlyStats.map((month) => (
        <Link key={month.periodKey} href={`/project/${projectId}/charge-dashboard`}>
          <Card className="p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  month.percentage === 100 ? 'bg-green-100 dark:bg-green-900/30' :
                  month.percentage > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <span className={`text-sm font-bold ${
                    month.percentage === 100 ? 'text-green-600' :
                    month.percentage > 0 ? 'text-yellow-600' : 'text-gray-400'
                  }`}>
                    {month.percentage}%
                  </span>
                </div>
                <div>
                  <p className="font-medium">{month.monthName}</p>
                  <p className="text-xs text-gray-500">
                    {month.paidCount} از {stats.participantsCount} واحد
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-emerald-600">
                  {formatMoney(month.totalPaid, currency)}
                </p>
                <p className="text-xs text-gray-500">از {formatMoney(month.totalExpected, currency)}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function UnitsTab({
  stats,
  currency,
  onUnitClick,
}: {
  stats: BuildingStats
  currency: string
  onUnitClick: (unit: ParticipantStat) => void
}) {
  // Sort by payment status
  const sortedUnits = [...stats.participantStats].sort((a, b) => {
    const order = { complete: 0, partial: 1, none: 2 }
    return order[a.status] - order[b.status]
  })

  return (
    <div className="space-y-2">
      {sortedUnits.map((unit) => (
        <Card
          key={unit.id}
          className="p-3 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onUnitClick(unit)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                unit.status === 'complete' ? 'bg-green-100 dark:bg-green-900/30' :
                unit.status === 'partial' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-red-50 dark:bg-red-900/20'
              }`}>
                {unit.status === 'complete' ? (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-sm font-bold ${
                    unit.status === 'partial' ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {unit.paidMonths}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">{unit.name}</p>
                <p className="text-xs text-gray-500">
                  {unit.paidMonths} از {unit.totalMonths} ماه پرداخت شده
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className={`text-sm font-medium ${
                unit.status === 'complete' ? 'text-green-600' :
                unit.status === 'partial' ? 'text-yellow-600' : 'text-red-500'
              }`}>
                {unit.percentage}%
              </p>
              <p className="text-xs text-gray-500">{formatMoney(unit.totalPaid, currency)}</p>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                unit.status === 'complete' ? 'bg-green-500' :
                unit.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${unit.percentage}%` }}
            />
          </div>
        </Card>
      ))}
    </div>
  )
}

function PaymentsTab({
  payments,
  currency,
}: {
  payments: RecentPayment[]
  currency: string
}) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">پرداختی ثبت نشده است</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <Card key={payment.id} className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{payment.paidBy}</p>
              <p className="text-xs text-gray-500">{payment.date}</p>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-emerald-600">
                {formatMoney(payment.amount, currency)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────────

function BuildingHeader({
  projectName,
  yearStats,
  chargeYear,
  participantsCount,
  onBackClick,
  onSettingsClick,
}: {
  projectName: string
  yearStats?: { totalPaid: number; totalExpected: number; percentage: number; remaining: number }
  chargeYear?: number
  participantsCount?: number
  onBackClick: () => void
  onSettingsClick: () => void
}) {
  return (
    <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-4 pt-4 pb-6">
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

        <div className="text-center flex-1">
          <h1 className="text-xl font-bold text-white">{projectName}</h1>
          <p className="text-emerald-100 text-xs">داشبورد مدیریت ساختمان</p>
        </div>

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

      {/* Year Stats - Integrated */}
      {yearStats && (
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-emerald-100 text-sm">گزارش سال {chargeYear}</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">
              {participantsCount} واحد
            </span>
          </div>

          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-emerald-100 text-xs">دریافت شده</p>
              <p className="text-2xl font-bold text-white">{formatMoney(yearStats.totalPaid, 'IRR')}</p>
            </div>
            <div className="text-left">
              <p className="text-emerald-100 text-xs">از کل</p>
              <p className="text-lg font-medium text-white">{formatMoney(yearStats.totalExpected, 'IRR')}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${yearStats.percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-white">
            <span className="text-emerald-100">{yearStats.percentage}% وصول شده</span>
            <span className="font-medium">
              {formatMoney(yearStats.remaining, 'IRR')} باقی‌مانده
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
