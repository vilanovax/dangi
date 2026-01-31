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

interface CommonExpense {
  id: string
  title: string
  amount: number
  paidBy: string
  date: string
}

interface YearStats {
  totalExpected: number
  totalPaid: number
  percentage: number
  remaining: number
}

interface CommonExpensesStats {
  total: number
  count: number
  recent: CommonExpense[]
}

interface BuildingStats {
  chargeYear: number
  chargePerUnit: number
  participantsCount: number
  yearStats: YearStats
  monthlyStats: MonthStat[]
  participantStats: ParticipantStat[]
  recentPayments: RecentPayment[]
  commonExpenses?: CommonExpensesStats
}

interface Project {
  id: string
  name: string
  currency: string
}

type TabType = 'overview' | 'months' | 'units' | 'payments' | 'common'

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

  // Month payment modal
  const [selectedMonth, setSelectedMonth] = useState<MonthStat | null>(null)
  const [monthDetails, setMonthDetails] = useState<any>(null)
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  // Fetch month details when a month is selected
  useEffect(() => {
    if (selectedMonth) {
      fetchMonthDetails(selectedMonth.periodKey)
    } else {
      setMonthDetails(null)
    }
  }, [selectedMonth])

  const fetchMonthDetails = async (periodKey: string) => {
    setLoadingMonth(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/month-charge-status?periodKey=${periodKey}`)
      if (res.ok) {
        const data = await res.json()
        setMonthDetails(data)
      }
    } catch (err) {
      console.error('Error fetching month details:', err)
    } finally {
      setLoadingMonth(false)
    }
  }

  const handlePayCharge = async (unitId: string, unitName: string) => {
    if (!selectedMonth || !paymentAmount) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `شارژ ${selectedMonth.monthName} - ${unitName}`,
          amount: parseInt(paymentAmount),
          expenseDate: new Date().toISOString(),
          periodKey: selectedMonth.periodKey,
          paidById: unitId,
          splitEqually: false,
          shares: [{ participantId: unitId, amount: parseInt(paymentAmount) }],
        }),
      })

      if (!res.ok) throw new Error('خطا در ثبت پرداخت')

      // Refresh month details and main data
      await Promise.all([
        fetchMonthDetails(selectedMonth.periodKey),
        fetchData(),
      ])
      setPaymentAmount('')
    } catch (err) {
      alert('خطا در ثبت پرداخت')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!selectedMonth) return
    if (!confirm('آیا از حذف این پرداخت مطمئن هستید؟')) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${paymentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('خطا در حذف پرداخت')

      // Refresh month details and main data
      await Promise.all([
        fetchMonthDetails(selectedMonth.periodKey),
        fetchData(),
      ])
    } catch (err) {
      alert('خطا در حذف پرداخت')
    } finally {
      setSubmitting(false)
    }
  }

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

      {/* Tabs - UX Improved: Icons + Better Visual Hierarchy */}
      <div className="px-4 mt-3">
        <div className="flex rounded-xl p-1 gap-1 overflow-x-auto scrollbar-hide" style={{
          backgroundColor: 'var(--building-surface-muted)'
        }}>
          {[
            {
              key: 'overview',
              label: 'نمای کلی',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )
            },
            {
              key: 'months',
              label: 'ماه‌ها',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              key: 'units',
              label: 'واحدها',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )
            },
            {
              key: 'payments',
              label: 'شارژ',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )
            },
            {
              key: 'common',
              label: 'هزینه‌ها',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              )
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex-1 min-w-[80px] py-2.5 px-3 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === tab.key
                  ? 'shadow-md font-bold'
                  : ''
              }`}
              style={{
                backgroundColor: activeTab === tab.key ? 'var(--building-surface)' : 'transparent',
                color: activeTab === tab.key ? 'var(--building-primary)' : 'var(--building-text-secondary)'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
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
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'months' && (
          <MonthsTab
            stats={stats}
            projectId={projectId}
            currency={project.currency}
            onMonthClick={(month) => setSelectedMonth(month)}
          />
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
        {activeTab === 'common' && (
          <CommonExpensesTab
            commonExpenses={stats.commonExpenses}
            currency={project.currency}
            projectId={projectId}
          />
        )}
      </div>

      {/* FAB - Enhanced with attention animation */}
      <button
        onClick={() => setShowQuickActions(true)}
        className={`fixed bottom-6 left-6 w-16 h-16 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 ${
          (stats.yearStats.percentage < 30 || stats.monthlyStats.find(m => m.month === currentMonthStat?.month)?.paidCount === 0)
            ? 'animate-pulse-scale'
            : ''
        }`}
        style={{
          backgroundColor: 'var(--building-primary)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--building-primary-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--building-primary)'}
        aria-label="عملیات سریع"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Quick Actions Modal - Enhanced */}
      <BottomSheet
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        title="عملیات سریع"
      >
        {/* Subtitle */}
        <div className="mb-3 -mt-1.5">
          <p className="text-sm text-center" style={{ color: 'var(--building-text-secondary)' }}>
            سریع‌ترین کارهای مدیریتی
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Primary Action: ثبت شارژ - Highlighted when no payments */}
          {(() => {
            const hasNoPayments = currentMonthStat?.paidCount === 0
            return (
              <button
                onClick={() => {
                  setShowQuickActions(false)
                  setActiveTab('months')
                }}
                className={`w-full ${hasNoPayments ? 'col-span-2' : ''}`}
              >
                <Card
                  className={`p-4 transition-all duration-300 text-center relative min-h-[120px] flex flex-col items-center justify-center ${
                    hasNoPayments
                      ? 'border-0 shadow-lg animate-subtle-glow active:scale-[0.97] active:shadow-2xl'
                      : 'hover:shadow-lg active:scale-95'
                  }`}
                  style={{
                    background: hasNoPayments
                      ? 'linear-gradient(135deg, var(--building-info), var(--building-info))'
                      : 'var(--building-surface)',
                    borderColor: hasNoPayments ? 'transparent' : 'var(--building-border)'
                  }}
                >
                  {hasNoPayments && (
                    <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm" style={{
                      backgroundColor: 'var(--building-warning)',
                      color: 'var(--building-text-primary)'
                    }}>
                      پیشنهاد می‌شود
                    </div>
                  )}
                  <div
                    className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-2.5 transition-transform"
                    style={{
                      backgroundColor: hasNoPayments
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'var(--building-info-soft)',
                      backdropFilter: hasNoPayments ? 'blur(8px)' : 'none'
                    }}
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{
                        color: hasNoPayments ? 'white' : 'var(--building-info)',
                        filter: hasNoPayments ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none'
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="font-bold" style={{
                    fontSize: hasNoPayments ? '1rem' : '0.875rem',
                    color: hasNoPayments ? 'white' : 'var(--building-text-primary)'
                  }}>
                    ثبت شارژ
                  </p>
                  {hasNoPayments && (
                    <p className="text-xs mt-1.5 px-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      شارژ ماهیانه واحدها را ثبت کنید
                    </p>
                  )}
                </Card>
              </button>
            )
          })()}

          {/* Other Actions - Enhanced with press feedback */}
          <Link href={`/project/${projectId}/add-expense`} onClick={() => setShowQuickActions(false)}>
            <Card className="p-4 hover:shadow-lg transition-all duration-200 active:scale-[0.97] text-center min-h-[120px] flex flex-col items-center justify-center" style={{
              borderColor: 'var(--building-border)'
            }}>
              <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-2.5 shadow-sm" style={{
                backgroundColor: 'var(--building-warning-soft)'
              }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{
                  color: 'var(--building-warning)'
                }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-medium text-sm" style={{ color: 'var(--building-text-primary)' }}>هزینه جدید</p>
            </Card>
          </Link>

          <Link href={`/project/${projectId}/charge-rules`} onClick={() => setShowQuickActions(false)}>
            <Card className="p-4 hover:shadow-lg transition-all duration-200 active:scale-[0.97] text-center min-h-[120px] flex flex-col items-center justify-center" style={{
              borderColor: 'var(--building-border)'
            }}>
              <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-2.5 shadow-sm" style={{
                backgroundColor: 'var(--building-primary-soft)'
              }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{
                  color: 'var(--building-primary)'
                }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-medium text-sm" style={{ color: 'var(--building-text-primary)' }}>تنظیم شارژ</p>
            </Card>
          </Link>

          <Link href={`/project/${projectId}/add-common-expense`} onClick={() => setShowQuickActions(false)}>
            <Card className="p-4 hover:shadow-lg transition-all duration-200 active:scale-[0.97] text-center min-h-[120px] flex flex-col items-center justify-center" style={{
              borderColor: 'var(--building-border)'
            }}>
              <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-2.5 shadow-sm" style={{
                backgroundColor: 'var(--building-warning-soft)'
              }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{
                  color: 'var(--building-warning)'
                }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="font-medium text-sm" style={{ color: 'var(--building-text-primary)' }}>هزینه عمومی</p>
            </Card>
          </Link>

          <Link href={`/project/${projectId}/participants`} onClick={() => setShowQuickActions(false)}>
            <Card className="p-4 hover:shadow-lg transition-all duration-200 active:scale-[0.97] text-center min-h-[120px] flex flex-col items-center justify-center" style={{
              borderColor: 'var(--building-border)'
            }}>
              <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-2.5 shadow-sm" style={{
                backgroundColor: 'var(--building-info-soft)'
              }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{
                  color: 'var(--building-info)'
                }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-medium text-sm" style={{ color: 'var(--building-text-primary)' }}>مدیریت واحدها</p>
            </Card>
          </Link>
        </div>
      </BottomSheet>

      {/* Month Payment Modal */}
      <BottomSheet
        isOpen={!!selectedMonth}
        onClose={() => setSelectedMonth(null)}
        title={`شارژ ${selectedMonth?.monthName || ''}`}
      >
        {selectedMonth && (
          <div className="space-y-4">
            {loadingMonth ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
              </div>
            ) : monthDetails ? (
              <>
                {/* Month Summary - Final Polish */}
                <div className="p-6 rounded-2xl" style={{
                  backgroundColor: 'var(--building-surface)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--building-border)'
                }}>
                  {/* Hero: Collection Percentage */}
                  <div className="text-center mb-5">
                    <div className="flex items-baseline justify-center gap-2 mb-1">
                      <span className="text-5xl font-extrabold tracking-tight" style={{ color: 'var(--building-primary)' }}>
                        {monthDetails.percentage}%
                      </span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--building-text-secondary)' }}>
                      وصول شده
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2.5 rounded-full overflow-hidden mb-5" style={{
                    backgroundColor: 'var(--building-border-muted)'
                  }}>
                    <div
                      className="absolute top-0 left-0 h-full transition-all duration-700 ease-out"
                      style={{
                        width: `${monthDetails.percentage}%`,
                        backgroundColor: 'var(--building-success)'
                      }}
                    />
                  </div>

                  {/* Financial Details - Reduced Emphasis */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-2.5 rounded-lg" style={{
                      backgroundColor: 'var(--building-surface-muted)'
                    }}>
                      <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--building-text-muted)' }}>
                        دریافتی
                      </p>
                      <p className="font-bold text-xs" style={{ color: 'var(--building-text-primary)' }}>
                        {formatMoney(monthDetails.totalPaid, 'IRR')}
                      </p>
                    </div>

                    <div className="text-center p-2.5 rounded-lg" style={{
                      backgroundColor: 'var(--building-surface-muted)'
                    }}>
                      <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--building-text-muted)' }}>
                        مانده
                      </p>
                      <p className="font-bold text-xs" style={{ color: 'var(--building-text-primary)' }}>
                        {formatMoney(monthDetails.totalExpected - monthDetails.totalPaid, 'IRR')}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge - Bottom */}
                  {monthDetails.unpaidCount > 0 ? (
                    <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg" style={{
                      backgroundColor: 'var(--building-warning-alpha)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'var(--building-warning)'
                    }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--building-warning)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold" style={{ color: 'var(--building-warning)' }}>
                        {monthDetails.unpaidCount} واحد منتظر پرداخت
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg" style={{
                      backgroundColor: 'var(--building-success-alpha)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'var(--building-success)'
                    }}>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--building-success)' }}>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-semibold" style={{ color: 'var(--building-success)' }}>
                        تسویه کامل
                      </span>
                    </div>
                  )}
                </div>

                {/* Units List - Final Polish */}
                <div>
                  <h3 className="font-bold mb-4" style={{ color: 'var(--building-text-primary)' }}>
                    لیست واحدها ({monthDetails.units.length})
                  </h3>
                  <div className="space-y-2.5">
                    {monthDetails.units.map((unit: any) => {
                      const isPaid = unit.hasPaid
                      return (
                        <div
                          key={unit.id}
                          className="p-4 rounded-xl transition-all duration-300 ease-out"
                          style={{
                            backgroundColor: isPaid
                              ? 'var(--building-surface-muted)'
                              : 'var(--building-surface)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: isPaid
                              ? 'var(--building-border-muted)'
                              : 'var(--building-warning)',
                            opacity: isPaid ? 0.65 : 1,
                            transform: isPaid ? 'scale(0.98)' : 'scale(1)'
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Status Icon - Subtle for paid */}
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                                style={{
                                  backgroundColor: isPaid
                                    ? 'var(--building-success-alpha)'
                                    : 'var(--building-warning-soft)',
                                  opacity: isPaid ? 0.7 : 1
                                }}
                              >
                                {isPaid ? (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--building-success)' }}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--building-warning)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </div>

                              {/* Unit Info - Name Prominent */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className="font-bold truncate mb-0.5"
                                  style={{
                                    fontSize: isPaid ? '0.9375rem' : '1rem',
                                    color: isPaid ? 'var(--building-text-secondary)' : 'var(--building-text-primary)'
                                  }}
                                >
                                  {unit.name}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--building-text-muted)' }}>
                                  {isPaid ? (
                                    <span>{formatMoney(unit.paidAmount, 'IRR')}</span>
                                  ) : (
                                    <span>شارژ: {formatMoney(unit.expectedAmount, 'IRR')}</span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {!isPaid && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setPaymentAmount(unit.expectedAmount.toString())
                                  handlePayCharge(unit.id, unit.name)
                                }}
                                disabled={submitting}
                                className="transition-all duration-200 active:scale-95 hover:shadow-md flex-shrink-0"
                                style={{
                                  backgroundColor: 'var(--building-primary)',
                                  color: 'white',
                                  paddingLeft: '18px',
                                  paddingRight: '18px',
                                  fontWeight: 600
                                }}
                              >
                                {submitting ? (
                                  <span className="flex items-center gap-1.5">
                                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    ثبت...
                                  </span>
                                ) : (
                                  'ثبت'
                                )}
                              </Button>
                            )}

                            {isPaid && (
                              <button
                                onClick={() => {
                                  if (unit.payments && unit.payments.length > 0) {
                                    handleDeletePayment(unit.payments[0].id)
                                  }
                                }}
                                disabled={submitting}
                                className="transition-all duration-200 active:scale-95 flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                                style={{
                                  backgroundColor: 'transparent',
                                  color: 'var(--building-text-muted)',
                                  borderWidth: '1px',
                                  borderStyle: 'solid',
                                  borderColor: 'var(--building-border)',
                                  opacity: 0.6
                                }}
                              >
                                {submitting ? (
                                  <span className="flex items-center gap-1">
                                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    لغو
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </BottomSheet>

      {/* Unit Detail Modal - Final Polish */}
      <BottomSheet
        isOpen={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        title={`وضعیت ${selectedUnit?.name || ''}`}
      >
        {selectedUnit && (() => {
          const isComplete = selectedUnit.status === 'complete'
          const isLowPayment = selectedUnit.percentage <= 30
          const remaining = selectedUnit.totalExpected - selectedUnit.totalPaid

          return (
            <div className="space-y-5">
              {/* Summary Card */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  backgroundColor: 'var(--building-surface)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--building-border)'
                }}
              >
                {/* Paid Months - Prominent */}
                <div className="text-center mb-4">
                  <p className="text-xs mb-1" style={{ color: 'var(--building-text-muted)' }}>
                    پرداخت شده
                  </p>
                  <p
                    className="text-4xl font-extrabold"
                    style={{
                      color: isComplete
                        ? 'var(--building-success)'
                        : isLowPayment
                        ? 'var(--building-danger)'
                        : 'var(--building-warning)'
                    }}
                  >
                    {selectedUnit.paidMonths}
                    <span className="text-xl font-normal" style={{ color: 'var(--building-text-muted)' }}>
                      {' '}از {selectedUnit.totalMonths}
                    </span>
                  </p>
                </div>

                {/* Progress Bar */}
                <div
                  className="h-2.5 rounded-full overflow-hidden mb-4"
                  style={{ backgroundColor: 'var(--building-border-muted)' }}
                >
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                      width: `${selectedUnit.percentage}%`,
                      backgroundColor: isComplete
                        ? 'var(--building-success)'
                        : isLowPayment
                        ? 'var(--building-danger)'
                        : 'var(--building-warning)'
                    }}
                  />
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="text-center p-2.5 rounded-lg"
                    style={{ backgroundColor: 'var(--building-surface-muted)' }}
                  >
                    <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--building-text-muted)' }}>
                      پرداختی
                    </p>
                    <p className="font-bold text-xs" style={{ color: 'var(--building-text-primary)' }}>
                      {formatMoney(selectedUnit.totalPaid, 'IRR')}
                    </p>
                  </div>

                  <div
                    className="text-center p-2.5 rounded-lg"
                    style={{ backgroundColor: 'var(--building-surface-muted)' }}
                  >
                    <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--building-text-muted)' }}>
                      مجموع
                    </p>
                    <p className="font-bold text-xs" style={{ color: 'var(--building-text-primary)' }}>
                      {formatMoney(selectedUnit.totalExpected, 'IRR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA - Context Aware */}
              <Button
                onClick={() => {
                  setSelectedUnit(null)
                  setActiveTab('months')
                }}
                className="w-full transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: isComplete
                    ? 'var(--building-success)'
                    : isLowPayment
                    ? 'var(--building-danger)'
                    : 'var(--building-primary)',
                  color: 'white',
                  fontWeight: 600,
                  padding: '14px'
                }}
              >
                {isComplete ? 'مشاهده پرداخت‌ها' : 'ثبت پرداخت جدید'}
              </Button>

              {/* Remaining Amount Hint */}
              {!isComplete && remaining > 0 && (
                <div
                  className="flex items-center justify-center gap-2 p-3 rounded-lg"
                  style={{
                    backgroundColor: isLowPayment
                      ? 'var(--building-danger-alpha)'
                      : 'var(--building-warning-alpha)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: isLowPayment
                      ? 'var(--building-danger)'
                      : 'var(--building-warning)'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{
                    color: isLowPayment ? 'var(--building-danger)' : 'var(--building-warning)'
                  }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold" style={{
                    color: isLowPayment ? 'var(--building-danger)' : 'var(--building-warning)'
                  }}>
                    {formatMoney(remaining, 'IRR')} باقی‌مانده
                  </span>
                </div>
              )}
            </div>
          )
        })()}
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
  setActiveTab,
}: {
  stats: BuildingStats
  currentMonth: MonthStat | null | undefined
  projectId: string
  currency: string
  setActiveTab: (tab: TabType) => void
}) {
  // UX Logic: Decision-oriented states
  const hasNoPayments = currentMonth?.paidCount === 0
  const isLowCollection = (stats.yearStats?.percentage || 0) < 30
  const isFullySettled = stats.yearStats?.remaining === 0

  return (
    <div className="space-y-4">
      {/* Smart Hint - Decision Guidance */}
      {isFullySettled ? (
        <Card className="p-4" style={{
          background: `linear-gradient(to right, var(--building-success-soft), var(--building-success-alpha))`,
          borderColor: 'var(--building-success)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
              backgroundColor: 'var(--building-success-alpha)'
            }}>
              <span className="text-2xl">🎉</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: 'var(--building-text-primary)' }}>همه واحدها تسویه شدند!</h3>
              <p className="text-sm" style={{ color: 'var(--building-text-secondary)' }}>وضعیت مالی کاملاً سالم است</p>
            </div>
          </div>
        </Card>
      ) : isLowCollection ? (
        <Card className="p-4" style={{
          background: `linear-gradient(to right, var(--building-warning-soft), var(--building-danger-soft))`,
          borderColor: 'var(--building-warning)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                backgroundColor: 'var(--building-warning-alpha)'
              }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{
                  color: 'var(--building-warning)'
                }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold" style={{ color: 'var(--building-text-primary)' }}>نرخ وصول پایین است</h3>
                <p className="text-sm" style={{ color: 'var(--building-text-secondary)' }}>
                  {stats.participantStats.filter(u => u.status !== 'complete').length} واحد بدهکار دارید
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveTab('units')}
              className="whitespace-nowrap"
              style={{
                backgroundColor: 'var(--building-warning)',
                color: 'white'
              }}
            >
              مشاهده بدهکاران
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Current Month Status - Enhanced CTA */}
      {currentMonth && (
        <Card className="p-4" style={{
          backgroundColor: hasNoPayments ? 'var(--building-warning-soft)' : 'var(--building-surface)',
          borderColor: hasNoPayments ? 'var(--building-warning)' : 'var(--building-border)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold" style={{ color: 'var(--building-text-primary)' }}>
              ماه جاری ({currentMonth.monthName})
            </h3>
            {!hasNoPayments && (
              <button
                onClick={() => setActiveTab('months')}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--building-primary)' }}
              >
                ثبت پرداخت
              </button>
            )}
          </div>

          {hasNoPayments ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{
                backgroundColor: 'var(--building-warning-alpha)'
              }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{
                  color: 'var(--building-warning)'
                }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium mb-1" style={{ color: 'var(--building-text-primary)' }}>
                هنوز پرداختی ثبت نشده
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--building-text-secondary)' }}>
                اولین پرداخت ماه را ثبت کنید
              </p>
              <Button
                onClick={() => setActiveTab('months')}
                style={{
                  backgroundColor: 'var(--building-primary)',
                  color: 'white'
                }}
              >
                ثبت اولین پرداخت
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl" style={{
                backgroundColor: currentMonth.paidCount > 0 ? 'var(--building-success-soft)' : 'var(--building-surface-muted)'
              }}>
                <p className="text-2xl font-bold" style={{
                  color: currentMonth.paidCount > 0 ? 'var(--building-success)' : 'var(--building-text-muted)'
                }}>
                  {currentMonth.paidCount}
                </p>
                <p className="text-xs" style={{ color: 'var(--building-text-secondary)' }}>پرداخت شده</p>
              </div>
              <div className="p-3 rounded-xl" style={{
                backgroundColor: currentMonth.unpaidCount > 0 ? 'var(--building-danger-soft)' : 'var(--building-surface-muted)'
              }}>
                <p className="text-2xl font-bold" style={{
                  color: currentMonth.unpaidCount > 0 ? 'var(--building-danger)' : 'var(--building-text-muted)'
                }}>
                  {currentMonth.unpaidCount}
                </p>
                <p className="text-xs" style={{ color: 'var(--building-text-secondary)' }}>پرداخت نشده</p>
              </div>
              <div className="p-3 rounded-xl" style={{
                backgroundColor: 'var(--building-info-soft)'
              }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--building-info)' }}>
                  {currentMonth.percentage}%
                </p>
                <p className="text-xs" style={{ color: 'var(--building-text-secondary)' }}>وصولی</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Mini Chart - Monthly Trend (with empty state support) */}
      <Card className="p-4">
        <h3 className="font-bold mb-3" style={{ color: 'var(--building-text-primary)' }}>
          روند وصول ماهیانه
        </h3>
        {stats.monthlyStats.every(m => m.percentage === 0) ? (
          <div className="text-center py-8">
            <div className="flex items-end gap-1 h-24 opacity-20 mb-4">
              {stats.monthlyStats.map((month, i) => (
                <div key={month.month} className="flex-1 flex flex-col items-center">
                  <div className="w-full rounded-t" style={{
                    height: `${20 + (i % 3) * 15}%`,
                    backgroundColor: 'var(--building-text-muted)'
                  }} />
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--building-text-secondary)' }}>
              با ثبت پرداخت‌ها، روند ماهیانه نمایش داده می‌شود
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-1 h-24">
            {stats.monthlyStats.map((month, index) => {
              const isCurrentMonth = month.month === currentMonth?.month
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center group cursor-pointer">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max(month.percentage, 5)}%`,
                      opacity: month.percentage > 0 || isCurrentMonth ? 1 : 0.3,
                      backgroundColor: isCurrentMonth
                        ? 'var(--building-primary-hover)'
                        : month.percentage > 0
                        ? 'var(--building-primary)'
                        : 'var(--building-border)'
                    }}
                  />
                  <span className="text-[8px] mt-1 truncate w-full text-center transition-colors" style={{
                    color: isCurrentMonth ? 'var(--building-primary)' : 'var(--building-text-secondary)',
                    fontWeight: isCurrentMonth ? 'bold' : 'normal'
                  }}>
                    {month.monthName.slice(0, 3)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Quick Stats - UX Improved: Clickable + Better hierarchy */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monthly Charge - Clickable → Settings */}
        <Link href={`/project/${projectId}/charge-rules`}>
          <Card className="p-4 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                backgroundColor: 'var(--building-primary-soft)'
              }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{
                  color: 'var(--building-primary)'
                }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: 'var(--building-text-secondary)' }}>شارژ ماهیانه</p>
                <p className="font-extrabold text-lg truncate" style={{ color: 'var(--building-text-primary)' }}>
                  {formatMoney(stats.chargePerUnit, currency)}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* Unit Count - Clickable → Units Tab */}
        <button onClick={() => setActiveTab && setActiveTab('units')} className="text-left">
          <Card className="p-4 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer h-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                backgroundColor: 'var(--building-info-soft)'
              }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{
                  color: 'var(--building-info)'
                }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: 'var(--building-text-secondary)' }}>تعداد واحدها</p>
                <p className="font-extrabold text-lg" style={{ color: 'var(--building-text-primary)' }}>
                  {stats.participantsCount} واحد
                </p>
              </div>
            </div>
          </Card>
        </button>
      </div>
    </div>
  )
}

function MonthsTab({
  stats,
  projectId,
  currency,
  onMonthClick,
}: {
  stats: BuildingStats
  projectId: string
  currency: string
  onMonthClick: (month: MonthStat) => void
}) {
  return (
    <div className="space-y-2">
      {stats.monthlyStats.map((month) => (
        <button
          key={month.periodKey}
          onClick={() => onMonthClick(month)}
          className="w-full"
        >
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
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
        </button>
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
  // Sort by payment status (none first, then partial, then complete)
  const sortedUnits = [...stats.participantStats].sort((a, b) => {
    const order = { none: 0, partial: 1, complete: 2 }
    return order[a.status] - order[b.status]
  })

  return (
    <div className="space-y-2.5">
      {sortedUnits.map((unit) => {
        // Visual priority logic
        const isComplete = unit.status === 'complete'
        const isLowPayment = unit.percentage <= 30
        const isPartial = unit.status === 'partial'

        return (
          <Card
            key={unit.id}
            className="p-4 cursor-pointer transition-all duration-200 active:scale-[0.99]"
            onClick={() => onUnitClick(unit)}
            style={{
              backgroundColor: isComplete
                ? 'var(--building-surface-muted)'
                : 'var(--building-surface)',
              borderWidth: '1.5px',
              borderStyle: 'solid',
              borderColor: isComplete
                ? 'var(--building-border-muted)'
                : isLowPayment
                ? 'var(--building-danger)'
                : isPartial
                ? 'var(--building-warning)'
                : 'var(--building-border)',
              opacity: isComplete ? 0.7 : 1
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Status Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isComplete
                      ? 'var(--building-success-alpha)'
                      : isLowPayment
                      ? 'var(--building-danger-soft)'
                      : 'var(--building-warning-soft)'
                  }}
                >
                  {isComplete ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--building-success)' }}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-base font-bold" style={{
                      color: isLowPayment ? 'var(--building-danger)' : 'var(--building-warning)'
                    }}>
                      {unit.paidMonths}
                    </span>
                  )}
                </div>

                {/* Unit Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-base mb-0.5 truncate"
                    style={{
                      color: isComplete
                        ? 'var(--building-text-secondary)'
                        : 'var(--building-text-primary)'
                    }}
                  >
                    {unit.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--building-text-muted)' }}>
                    {unit.paidMonths} از {unit.totalMonths} ماه
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="text-left flex-shrink-0">
                <p
                  className="text-base font-bold mb-0.5"
                  style={{
                    color: isComplete
                      ? 'var(--building-success)'
                      : isLowPayment
                      ? 'var(--building-danger)'
                      : 'var(--building-warning)'
                  }}
                >
                  {unit.percentage}%
                </p>
                <p className="text-xs" style={{ color: 'var(--building-text-muted)' }}>
                  {formatMoney(unit.totalPaid, currency)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--building-border-muted)' }}
            >
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${unit.percentage}%`,
                  backgroundColor: isComplete
                    ? 'var(--building-success)'
                    : isLowPayment
                    ? 'var(--building-danger)'
                    : 'var(--building-warning)'
                }}
              />
            </div>
          </Card>
        )
      })}
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

function CommonExpensesTab({
  commonExpenses,
  currency,
  projectId,
}: {
  commonExpenses?: CommonExpensesStats
  currency: string
  projectId: string
}) {
  if (!commonExpenses || commonExpenses.count === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-gray-500 mb-4">هزینه عمومی ثبت نشده است</p>
        <Link href={`/project/${projectId}/add-common-expense`}>
          <Button className="!bg-amber-500 hover:!bg-amber-600">
            ثبت هزینه عمومی
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="p-4 bg-gradient-to-l from-amber-500 to-orange-500 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-100 text-sm">مجموع هزینه‌های عمومی</p>
            <p className="text-2xl font-bold">{formatMoney(commonExpenses.total, currency)}</p>
          </div>
          <div className="text-left">
            <p className="text-amber-100 text-sm">{commonExpenses.count} هزینه</p>
          </div>
        </div>
      </Card>

      {/* Add Button */}
      <Link href={`/project/${projectId}/add-common-expense`}>
        <Button className="w-full !bg-amber-500 hover:!bg-amber-600">
          + ثبت هزینه عمومی جدید
        </Button>
      </Link>

      {/* Recent Common Expenses */}
      <div className="space-y-2">
        <h3 className="font-bold text-gray-900 dark:text-white">هزینه‌های اخیر</h3>
        {commonExpenses.recent.map((expense) => (
          <Card key={expense.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{expense.title}</p>
                <p className="text-xs text-gray-500">
                  پرداخت: {expense.paidBy} • {expense.date}
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-amber-600">
                  {formatMoney(expense.amount, currency)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
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
    <div className="px-4 pt-4 pb-6" style={{
      background: 'linear-gradient(135deg, var(--building-primary) 0%, var(--building-primary-hover) 100%)'
    }}>
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
          <p className="text-white/80 text-xs">داشبورد مدیریت ساختمان</p>
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

      {/* Year Stats - UX Improved: Emphasize received vs remaining */}
      {yearStats && (
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/90 text-sm font-medium">گزارش سال {chargeYear}</span>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg font-medium text-white">
              {participantsCount} واحد
            </span>
          </div>

          {/* Primary Metric: Received Amount (Large & Bold) */}
          <div className="mb-4">
            <p className="text-white/80 text-xs mb-1">دریافت شده</p>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              {formatMoney(yearStats.totalPaid, 'IRR')}
            </p>
          </div>

          {/* Dual Progress Bar: Success (received) + Danger (remaining) */}
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            {/* Received */}
            <div
              className="absolute top-0 left-0 h-full transition-all duration-500"
              style={{
                width: `${yearStats.percentage}%`,
                backgroundColor: 'var(--building-success)'
              }}
            />
            {/* Remaining (visual only) */}
            <div
              className="absolute top-0 right-0 h-full opacity-40"
              style={{
                width: `${100 - yearStats.percentage}%`,
                backgroundColor: 'var(--building-danger-soft)'
              }}
            />
          </div>

          {/* Stats Row: Percentage + Remaining */}
          <div className="flex items-center justify-between text-sm">
            {/* Percentage Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-bold text-white" style={{
                backgroundColor: 'var(--building-success-alpha)'
              }}>
                {yearStats.percentage}% وصول شده
              </span>
            </div>

            {/* Remaining Amount (Attention-catching) */}
            <div className="text-left">
              <p className="text-white/70 text-xs">باقی‌مانده</p>
              <p className="font-bold text-sm" style={{ color: 'var(--building-warning-soft)' }}>
                {formatMoney(yearStats.remaining, 'IRR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
