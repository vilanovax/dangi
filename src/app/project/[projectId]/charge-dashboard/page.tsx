'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

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
  totalChargePerPeriod: number
  participantsCount: number
  message?: string
}

export default function ChargeDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [data, setData] = useState<ChargeStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)

  useEffect(() => {
    fetchChargeStatus()
  }, [projectId])

  const fetchChargeStatus = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/charge-status?periods=12`)
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات')

      const json = await res.json()
      setData(json)

      // Select first period by default
      if (json.periods?.length > 0) {
        setSelectedPeriod(json.periods[0].periodKey)
      }
    } catch {
      setError('خطا در بارگذاری وضعیت شارژ')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: 'paid' | 'partial' | 'unpaid') => {
    switch (status) {
      case 'paid':
        return (
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'partial':
        return (
          <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )
    }
  }

  const getStatusLabel = (status: 'paid' | 'partial' | 'unpaid') => {
    switch (status) {
      case 'paid':
        return 'پرداخت شده'
      case 'partial':
        return 'ناقص'
      default:
        return 'پرداخت نشده'
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center">
        <p className="text-gray-500">{error || 'خطا در بارگذاری'}</p>
      </div>
    )
  }

  if (data.message || data.periods.length === 0) {
    return (
      <main className="min-h-dvh">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">داشبورد شارژ</h1>
          </div>
        </div>

        <div className="p-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            {data.message || 'برای استفاده از داشبورد شارژ، ابتدا قاعده شارژ تعریف کنید'}
          </p>
          <button
            onClick={() => router.push(`/project/${projectId}/charge-rules`)}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            تعریف قاعده شارژ
          </button>
        </div>
      </main>
    )
  }

  const selectedPeriodData = data.periods.find((p) => p.periodKey === selectedPeriod)

  return (
    <main className="min-h-dvh pb-8">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
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
            <h1 className="text-xl font-bold">داشبورد شارژ</h1>
            <p className="text-xs text-gray-500">
              شارژ ماهیانه: {formatMoney(data.totalChargePerPeriod, 'IRR')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Period Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {data.periods.map((period) => {
            const isSelected = period.periodKey === selectedPeriod
            const allPaid = period.paidCount === data.participantsCount
            const nonePaid = period.paidCount === 0

            return (
              <button
                key={period.periodKey}
                onClick={() => setSelectedPeriod(period.periodKey)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : allPaid
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-200 dark:border-green-800'
                    : nonePaid
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border border-yellow-200 dark:border-yellow-800'
                }`}
              >
                {period.periodLabel}
              </button>
            )
          })}
        </div>

        {/* Summary Card */}
        {selectedPeriodData && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{selectedPeriodData.periodLabel}</h2>
              <span className="text-sm text-gray-500">
                {selectedPeriodData.paidCount}/{data.participantsCount} پرداخت شده
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${
                    selectedPeriodData.totalExpected > 0
                      ? (selectedPeriodData.totalPaid / selectedPeriodData.totalExpected) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                جمع دریافتی: <span className="text-green-600 font-medium">{formatMoney(selectedPeriodData.totalPaid, 'IRR')}</span>
              </span>
              <span className="text-gray-500">
                باقی‌مانده: <span className="text-red-600 font-medium">{formatMoney(selectedPeriodData.totalExpected - selectedPeriodData.totalPaid, 'IRR')}</span>
              </span>
            </div>
          </Card>
        )}

        {/* Participants List */}
        {selectedPeriodData && (
          <Card className="divide-y divide-gray-100 dark:divide-gray-800">
            {selectedPeriodData.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(participant.status)}
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    <p className="text-xs text-gray-500">
                      {participant.weight > 1 && `وزن: ${participant.weight} • `}
                      سهم: {formatMoney(participant.expectedAmount, 'IRR')}
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <p className={`text-sm font-medium ${
                    participant.status === 'paid'
                      ? 'text-green-600'
                      : participant.status === 'partial'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {getStatusLabel(participant.status)}
                  </p>
                  {participant.paidAmount > 0 && (
                    <p className="text-xs text-gray-500">
                      {formatMoney(participant.paidAmount, 'IRR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Charge Rules Info */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">قواعد شارژ فعال</h3>
          <Card className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.chargeRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-gray-700 dark:text-gray-300">{rule.title}</span>
                <span className="text-gray-500">{formatMoney(rule.amount, 'IRR')}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </main>
  )
}
