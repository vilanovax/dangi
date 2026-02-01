'use client'

import { useState } from 'react'
import { BottomSheet, Button, Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar, type Avatar as AvatarData } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Settlement {
  id: string
  amount: number
  fromId: string
  toId: string
  note?: string | null
  receiptUrl?: string | null
  settledAt: string | Date
  from: Participant
  to: Participant
  createdAt: string | Date
}

interface SettlementHistorySheetProps {
  isOpen: boolean
  onClose: () => void
  settlements: Settlement[]
  currency: string
}

/**
 * Settlement history display with filtering and export options
 *
 * UX Principle: Transparency = Trust + Auditability
 * This is a read-only log. No editing, no deletion, no recalculation.
 * Focus on scannability, clarity of payment direction, and trust.
 */
export function SettlementHistorySheet({
  isOpen,
  onClose,
  settlements,
  currency,
}: SettlementHistorySheetProps) {
  const [showCount, setShowCount] = useState(5)
  const [filter, setFilter] = useState<'all' | 'last20' | 'lastWeek'>('all')

  // Apply filters
  const filteredSettlements = settlements.filter((settlement) => {
    if (filter === 'all') return true

    if (filter === 'last20') {
      return settlements.indexOf(settlement) < 20
    }

    if (filter === 'lastWeek') {
      const settleDate = new Date(settlement.settledAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return settleDate >= weekAgo
    }

    return true
  })

  const displayedSettlements = filteredSettlements.slice(0, showCount)
  const hasMore = filteredSettlements.length > showCount

  // Helper function for filter label
  const getFilterLabel = () => {
    switch (filter) {
      case 'all':
        return 'همه تسویه‌ها'
      case 'last20':
        return '۲۰ تای آخر'
      case 'lastWeek':
        return 'هفته اخیر'
      default:
        return 'همه تسویه‌ها'
    }
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  const handleExport = () => {
    // UX: CSV export is a secondary, safe action for auditability
    const headers = ['تاریخ', 'پرداخت‌کننده', 'دریافت‌کننده', 'مبلغ', 'توضیحات']
    const rows = filteredSettlements.map(s => [
      formatDate(s.settledAt),
      s.from.name,
      s.to.name,
      formatMoney(s.amount, currency),
      s.note || '-'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Download CSV with UTF-8 BOM for Excel compatibility
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `settlements-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        {/* Header with subtitle for context */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-100 dark:border-gray-800 -mt-6 pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                تاریخچه تسویه‌ها
              </h2>
              {/* UX: Subtitle clarifies the purpose of this log */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                همه پرداخت‌هایی که برای صاف‌کردن حساب ثبت شده
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Options with improved active state */}
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            {/* UX: Filter chips using history design tokens */}
            <button
              onClick={() => setFilter('all')}
              style={{
                transition: `all var(--history-motion-fast, 120ms) var(--history-motion-ease, ease-out)`
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setFilter('last20')}
              style={{
                transition: `all var(--history-motion-fast, 120ms) var(--history-motion-ease, ease-out)`
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'last20'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              ۲۰ تای آخر
            </button>
            <button
              onClick={() => setFilter('lastWeek')}
              style={{
                transition: `all var(--history-motion-fast, 120ms) var(--history-motion-ease, ease-out)`
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'lastWeek'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              هفته اخیر
            </button>
          </div>
          {/* UX: Helper text shows current filter for clarity */}
          <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
            نمایش: {getFilterLabel()}
          </p>
        </div>

        {/* CSV Export with helper caption */}
        <div className="space-y-1.5">
          <button
            onClick={handleExport}
            disabled={filteredSettlements.length === 0}
            className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>📥</span>
            خروجی CSV
          </button>
          {/* UX: Caption explains the purpose of CSV export (secondary, safe action) */}
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            دانلود برای نگه‌داری یا ارسال
          </p>
        </div>

        {/* Settlements List */}
        {displayedSettlements.length === 0 ? (
          /* UX: Improved empty state with clearer messaging */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
              هنوز تسویه‌ای انجام نشده
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              وقتی پرداختی ثبت بشه، اینجا می‌بینیش
            </p>
          </div>
        ) : (
          /* UX: Improved spacing and rhythm for long lists */
          <div className="space-y-3">
            {displayedSettlements.map((settlement) => (
              <div
                key={settlement.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                {/* UX: Top row shows participants visually */}
                <div className="flex items-center gap-3">
                  {/* From (Payer) */}
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar
                      avatar={deserializeAvatar(settlement.from.avatar || null, settlement.from.name)}
                      name={settlement.from.name}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {settlement.from.name}
                    </span>
                  </div>

                  {/* Arrow indicating payment direction */}
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>

                  {/* To (Receiver) */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {settlement.to.name}
                    </span>
                    <Avatar
                      avatar={deserializeAvatar(settlement.to.avatar || null, settlement.to.name)}
                      name={settlement.to.name}
                      size="sm"
                    />
                  </div>
                </div>

                {/* UX: NEW - Second row clarifies payment direction in plain language */}
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  پرداخت از <span className="font-medium text-gray-700 dark:text-gray-300">{settlement.from.name}</span> به <span className="font-medium text-gray-700 dark:text-gray-300">{settlement.to.name}</span>
                </p>

                {/* UX: Amount on its own line for scannability */}
                <div className="flex items-baseline justify-between pt-1">
                  {/* Date/time in muted text */}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(settlement.settledAt)}
                  </span>
                  {/* Amount emphasized with calm success color (history token) */}
                  {/* Note: Using --history-amount-success (calm green #16a34a) not bright alert green */}
                  <span
                    className="text-xl font-bold tabular-nums"
                    style={{ color: 'var(--history-amount-success, #16a34a)' }}
                  >
                    {formatMoney(settlement.amount, currency)}
                  </span>
                </div>

                {/* UX: Receipt link as subtle secondary action */}
                {settlement.receiptUrl && (
                  <a
                    href={settlement.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>📎</span>
                    مشاهده رسید
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Show More Button */}
        {hasMore && (
          <button
            onClick={() => setShowCount(prev => prev + 10)}
            className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            نمایش بیشتر ({filteredSettlements.length - showCount} تسویه باقی‌مانده)
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
