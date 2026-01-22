'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, BottomSheet, Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar, type Avatar as AvatarData } from '@/lib/types/avatar'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface ParticipantBalance {
  participantId: string
  participantName: string
  totalPaid: number
  totalShare: number
  balance: number
}

interface Settlement {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

interface ChargeDebt {
  participantId: string
  participantName: string
  chargeDebt: number
  paidMonths: number
  totalMonths: number
}

interface ChargeInfo {
  isBuilding: boolean
  chargeYear: number
  chargePerUnit: number
  currentMonthName: string
  chargeDebts: ChargeDebt[]
  totalChargeDebt: number
}

interface ProjectSummary {
  projectId: string
  projectName: string
  totalExpenses: number
  currency: string
  participantBalances: ParticipantBalance[]
  settlements: Settlement[]
}

interface Project {
  id: string
  template: string
  participants: Participant[]
}

type TabType = 'balance' | 'charge'

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function SummaryPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // ── Data State ──────────────────────────────────────────────
  const [summary, setSummary] = useState<ProjectSummary | null>(null)
  const [chargeInfo, setChargeInfo] = useState<ChargeInfo | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('balance')

  // ── Quick Settlement State ──────────────────────────────────
  const [showQuickSettle, setShowQuickSettle] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ── Fetch Data ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, projectRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/summary`),
        fetch(`/api/projects/${projectId}`),
      ])

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data.summary)
        setChargeInfo(data.chargeInfo)
      }

      if (projectRes.ok) {
        const data = await projectRes.json()
        setProject(data.project)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Handlers ────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleQuickSettle = useCallback((settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setShowQuickSettle(true)
  }, [])

  const handleCloseQuickSettle = useCallback(() => {
    setShowQuickSettle(false)
    setSelectedSettlement(null)
  }, [])

  const confirmQuickSettle = useCallback(async () => {
    if (!selectedSettlement) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: selectedSettlement.fromId,
          toId: selectedSettlement.toId,
          amount: selectedSettlement.amount,
          note: 'تسویه سریع از صفحه خلاصه',
        }),
      })

      if (res.ok) {
        handleCloseQuickSettle()
        fetchData()
      }
    } catch (error) {
      console.error('Error creating settlement:', error)
    } finally {
      setSubmitting(false)
    }
  }, [selectedSettlement, projectId, handleCloseQuickSettle, fetchData])

  // ── Helper: Get Participant Avatar ──────────────────────────

  const getParticipantAvatar = useCallback(
    (participantId: string): AvatarData | null => {
      const participant = project?.participants.find((p) => p.id === participantId)
      if (participant) {
        return deserializeAvatar(participant.avatar || null, participant.name)
      }
      return null
    },
    [project]
  )

  // ── Loading State ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Error State ─────────────────────────────────────────────

  if (!summary) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">😕</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400">خطا در بارگذاری</p>
        <button onClick={handleBack} className="mt-4 px-4 py-2 text-blue-500 hover:underline">
          بازگشت
        </button>
      </div>
    )
  }

  // ── Computed Values ─────────────────────────────────────────

  const isBuilding = chargeInfo?.isBuilding || false
  const hasDebt = summary.settlements.length > 0
  const hasExpenses = summary.totalExpenses > 0
  const hasChargeDebt = (chargeInfo?.totalChargeDebt || 0) > 0
  const participantCount = summary.participantBalances.length
  const sharePerPerson = participantCount > 0 ? summary.totalExpenses / participantCount : 0

  // Sort balances: creditors first, then debtors, then settled
  const sortedBalances = [...summary.participantBalances].sort((a, b) => {
    if (a.balance > 0 && b.balance <= 0) return -1
    if (a.balance <= 0 && b.balance > 0) return 1
    if (a.balance < 0 && b.balance >= 0) return 1
    if (a.balance >= 0 && b.balance < 0) return -1
    return b.balance - a.balance
  })

  // Merge charge debt with balance
  const balancesWithChargeDebt = sortedBalances.map((b) => {
    const chargeDebt = chargeInfo?.chargeDebts.find((d) => d.participantId === b.participantId)
    return {
      ...b,
      chargeDebt: chargeDebt?.chargeDebt || 0,
      paidMonths: chargeDebt?.paidMonths || 0,
      totalMonths: chargeDebt?.totalMonths || 0,
      totalDebt: b.balance + (chargeDebt?.chargeDebt || 0) * -1,
    }
  })

  // Sort by charge debt (most debt first)
  const sortedByChargeDebt = [...(chargeInfo?.chargeDebts || [])].sort(
    (a, b) => b.chargeDebt - a.chargeDebt
  )

  // ── Main Render ─────────────────────────────────────────────

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white px-4 pt-4 pb-6">
          {/* Top Row */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBack}
              className="p-2 -mr-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">خلاصه حساب</h1>
              <p className="text-blue-100 text-sm">{summary.projectName}</p>
            </div>
            <Link
              href={`/project/${projectId}/settlements`}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
              title="تاریخچه تسویه‌ها"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
              <p className="text-blue-100 text-xs mb-1">مجموع هزینه‌ها</p>
              <p className="text-xl font-bold">{formatMoney(summary.totalExpenses, summary.currency)}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
              <p className="text-blue-100 text-xs mb-1">سهم هر نفر</p>
              <p className="text-xl font-bold">{formatMoney(sharePerPerson, summary.currency)}</p>
            </div>
            {isBuilding && hasChargeDebt && (
              <div className="col-span-2 bg-red-500/30 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-xs mb-1">بدهی شارژ (تا {chargeInfo?.currentMonthName})</p>
                    <p className="text-xl font-bold">{formatMoney(chargeInfo?.totalChargeDebt || 0, 'IRR')}</p>
                  </div>
                  <Link
                    href={`/project/${projectId}/charge-dashboard`}
                    className="text-xs bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    پرداخت
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs (only for building template) */}
      {isBuilding && (
        <div className="px-4 pt-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('balance')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'balance'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              وضعیت هزینه‌ها
            </button>
            <button
              onClick={() => setActiveTab('charge')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'charge'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              بدهی شارژ
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-5 space-y-6">
        {/* Balance Tab */}
        {activeTab === 'balance' && (
          <>
            {/* Member Balances */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">وضعیت اعضا</h2>
              <div className="space-y-2">
                {balancesWithChargeDebt.map((p) => (
                  <MemberBalanceCard
                    key={p.participantId}
                    name={p.participantName}
                    avatar={getParticipantAvatar(p.participantId)}
                    totalPaid={p.totalPaid}
                    totalShare={p.totalShare}
                    balance={p.balance}
                    chargeDebt={isBuilding ? p.chargeDebt : 0}
                    currency={summary.currency}
                  />
                ))}
              </div>
            </section>

            {/* Settlement Suggestions */}
            {hasDebt && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">پیشنهاد تسویه</h2>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-medium">
                    {summary.settlements.length} تراکنش
                  </span>
                </div>
                <div className="space-y-2">
                  {summary.settlements.map((s, index) => (
                    <SettlementSuggestionCard
                      key={index}
                      fromName={s.fromName}
                      fromAvatar={getParticipantAvatar(s.fromId)}
                      toName={s.toName}
                      toAvatar={getParticipantAvatar(s.toId)}
                      amount={s.amount}
                      currency={summary.currency}
                      onSettle={() => handleQuickSettle(s)}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                  با انجام این تراکنش‌ها همه تسویه می‌شوند
                </p>
              </section>
            )}

            {/* All Settled State */}
            {!hasDebt && hasExpenses && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                  همه تسویه هستند!
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  هیچ بدهی باقی نمانده
                </p>
              </div>
            )}

            {/* No Expenses State */}
            {!hasExpenses && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📝</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-semibold">
                  هنوز خرجی ثبت نشده
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  اولین خرج رو ثبت کنید
                </p>
                <Button
                  onClick={() => router.push(`/project/${projectId}/add-expense`)}
                  className="mt-4"
                >
                  ثبت اولین خرج
                </Button>
              </div>
            )}
          </>
        )}

        {/* Charge Tab */}
        {activeTab === 'charge' && isBuilding && chargeInfo && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">بدهی شارژ واحدها</h2>
              <span className="text-xs text-gray-500">
                تا ماه {chargeInfo.currentMonthName} {chargeInfo.chargeYear}
              </span>
            </div>

            {chargeInfo.chargeDebts.length > 0 && chargeInfo.chargeDebts[0]?.totalMonths > 0 ? (
              <div className="space-y-2">
                {sortedByChargeDebt.map((debt) => (
                  <Card key={debt.participantId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex-shrink-0">
                          {getParticipantAvatar(debt.participantId) ? (
                            <Avatar
                              avatar={getParticipantAvatar(debt.participantId)!}
                              name={debt.participantName}
                              size="md"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <span className="font-semibold text-gray-600 dark:text-gray-300">
                                {debt.participantName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{debt.participantName}</p>
                          <p className="text-xs text-gray-500">
                            {debt.paidMonths} از {debt.totalMonths} ماه پرداخت شده
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        {debt.chargeDebt > 0 ? (
                          <>
                            <p className="text-red-500 font-bold">
                              {formatMoney(debt.chargeDebt, 'IRR')}
                            </p>
                            <p className="text-xs text-red-400">بدهکار</p>
                          </>
                        ) : (
                          <>
                            <p className="text-green-600 font-bold">تسویه</p>
                            <p className="text-xs text-green-500">همه ماه‌ها</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          debt.paidMonths === debt.totalMonths
                            ? 'bg-green-500'
                            : debt.paidMonths > 0
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${debt.totalMonths > 0 ? (debt.paidMonths / debt.totalMonths) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </Card>
                ))}

                <Link href={`/project/${projectId}/charge-dashboard`}>
                  <Button className="w-full mt-4 !bg-blue-500 hover:!bg-blue-600">
                    ثبت پرداخت شارژ
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                  بدهی شارژی وجود ندارد
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  همه واحدها شارژ خود را پرداخت کرده‌اند
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Quick Settlement Confirmation Sheet */}
      <BottomSheet
        isOpen={showQuickSettle}
        onClose={handleCloseQuickSettle}
        title="تأیید تسویه"
      >
        {selectedSettlement && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="text-center">
                {getParticipantAvatar(selectedSettlement.fromId) ? (
                  <Avatar
                    avatar={getParticipantAvatar(selectedSettlement.fromId)!}
                    name={selectedSettlement.fromName}
                    size="lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                    <span className="font-bold text-red-600">{selectedSettlement.fromName.charAt(0)}</span>
                  </div>
                )}
                <p className="text-sm font-medium mt-2">{selectedSettlement.fromName}</p>
              </div>

              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {formatMoney(selectedSettlement.amount, summary.currency)}
                </p>
              </div>

              <div className="text-center">
                {getParticipantAvatar(selectedSettlement.toId) ? (
                  <Avatar
                    avatar={getParticipantAvatar(selectedSettlement.toId)!}
                    name={selectedSettlement.toName}
                    size="lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <span className="font-bold text-green-600">{selectedSettlement.toName.charAt(0)}</span>
                  </div>
                )}
                <p className="text-sm font-medium mt-2">{selectedSettlement.toName}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCloseQuickSettle} className="flex-1">
                انصراف
              </Button>
              <Button onClick={confirmQuickSettle} loading={submitting} className="flex-1">
                تأیید تسویه
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────────

function MemberBalanceCard({
  name,
  avatar,
  totalPaid,
  totalShare,
  balance,
  chargeDebt,
  currency,
}: {
  name: string
  avatar: AvatarData | null
  totalPaid: number
  totalShare: number
  balance: number
  chargeDebt: number
  currency: string
}) {
  const isCreditor = balance > 0
  const isDebtor = balance < 0
  const hasChargeDebt = chargeDebt > 0

  const borderColor = isCreditor
    ? 'border-r-green-500'
    : isDebtor || hasChargeDebt
    ? 'border-r-red-400'
    : 'border-r-gray-300'

  const statusLabel = isCreditor ? 'طلبکار' : isDebtor ? 'بدهکار' : 'تسویه'
  const statusColor = isCreditor
    ? 'text-green-600 dark:text-green-400'
    : isDebtor
    ? 'text-red-500 dark:text-red-400'
    : 'text-gray-500'

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border-r-4 ${borderColor}`}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 flex-shrink-0">
          {avatar ? (
            <Avatar avatar={avatar} name={name} size="lg" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <span className="font-semibold text-lg text-gray-600 dark:text-gray-300">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>پرداخت: {formatMoney(totalPaid, currency)}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>سهم: {formatMoney(totalShare, currency)}</span>
          </div>
        </div>

        <div className="text-left flex-shrink-0">
          <p className={`font-bold text-lg ${statusColor}`}>
            {isCreditor ? '+' : ''}
            {formatMoney(balance, currency)}
          </p>
          <p className={`text-xs ${statusColor}`}>{statusLabel}</p>
        </div>
      </div>

      {/* Charge debt row */}
      {hasChargeDebt && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500">بدهی شارژ:</span>
          <span className="text-sm font-bold text-red-500">{formatMoney(chargeDebt, 'IRR')}</span>
        </div>
      )}
    </div>
  )
}

function SettlementSuggestionCard({
  fromName,
  fromAvatar,
  toName,
  toAvatar,
  amount,
  currency,
  onSettle,
}: {
  fromName: string
  fromAvatar: AvatarData | null
  toName: string
  toAvatar: AvatarData | null
  amount: number
  currency: string
  onSettle: () => void
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          {fromAvatar ? (
            <Avatar avatar={fromAvatar} name={fromName} size="sm" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="text-sm font-bold text-red-600">{fromName.charAt(0)}</span>
            </div>
          )}
          <span className="font-medium text-sm">{fromName}</span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-medium text-sm">{toName}</span>
          {toAvatar ? (
            <Avatar avatar={toAvatar} name={toName} size="sm" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-sm font-bold text-green-600">{toName.charAt(0)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <p className="text-lg font-bold text-blue-600">{formatMoney(amount, currency)}</p>
        <Button size="sm" onClick={onSettle} className="!bg-green-500 hover:!bg-green-600">
          تسویه
        </Button>
      </div>
    </Card>
  )
}
