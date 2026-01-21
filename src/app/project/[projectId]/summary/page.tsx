'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Button } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

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

interface ProjectSummary {
  projectId: string
  projectName: string
  totalExpenses: number
  currency: string
  participantBalances: ParticipantBalance[]
  settlements: Settlement[]
}

export default function SummaryPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [summary, setSummary] = useState<ProjectSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [projectId])

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/summary`)
      if (!res.ok) throw new Error('خطا در دریافت خلاصه')

      const data = await res.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4">
        <p className="text-gray-500">خطا در بارگذاری</p>
      </div>
    )
  }

  return (
    <main className="min-h-dvh pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg z-10 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">تسویه حساب</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Total */}
        <Card className="text-center py-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-blue-100 text-sm mb-1">مجموع هزینه‌ها</p>
          <p className="text-3xl font-bold">
            {formatMoney(summary.totalExpenses, summary.currency)}
          </p>
          <p className="text-blue-100 text-sm mt-2">
            سهم هر نفر: {formatMoney(summary.totalExpenses / summary.participantBalances.length, summary.currency)}
          </p>
        </Card>

        {/* Balances */}
        <div>
          <h2 className="text-lg font-semibold mb-3">وضعیت اعضا</h2>
          <div className="space-y-2">
            {summary.participantBalances.map((p) => (
              <Card key={p.participantId} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="font-medium">{p.participantName.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{p.participantName}</p>
                  <p className="text-xs text-gray-500">
                    پرداخت: {formatMoney(p.totalPaid, summary.currency)}
                  </p>
                </div>
                <div className="text-left">
                  <p
                    className={`font-semibold ${
                      p.balance > 0
                        ? 'text-green-600'
                        : p.balance < 0
                        ? 'text-red-500'
                        : 'text-gray-500'
                    }`}
                  >
                    {p.balance > 0 ? '+' : ''}
                    {formatMoney(p.balance, summary.currency)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.balance > 0 ? 'طلبکار' : p.balance < 0 ? 'بدهکار' : 'تسویه'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Settlements */}
        {summary.settlements.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">برای تسویه</h2>
            <Card className="divide-y divide-gray-100 dark:divide-gray-800">
              {summary.settlements.map((s, index) => (
                <div key={index} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        {s.fromName.charAt(0)}
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {s.toName.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{formatMoney(s.amount, summary.currency)}</p>
                    <p className="text-xs text-gray-500">
                      {s.fromName} به {s.toName}
                    </p>
                  </div>
                </div>
              ))}
            </Card>

            <p className="text-center text-sm text-gray-500 mt-4">
              با {summary.settlements.length} تراکنش همه تسویه می‌شوند
            </p>
          </div>
        )}

        {summary.settlements.length === 0 && summary.totalExpenses > 0 && (
          <Card className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-600 font-medium">همه تسویه هستند!</p>
          </Card>
        )}

        {summary.totalExpenses === 0 && (
          <Card className="text-center py-8">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500">هنوز هزینه‌ای ثبت نشده</p>
            <Button
              onClick={() => router.push(`/project/${projectId}/add-expense`)}
              className="mt-4"
            >
              ثبت اولین هزینه
            </Button>
          </Card>
        )}
      </div>
    </main>
  )
}
