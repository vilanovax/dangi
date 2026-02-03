'use client'

import { useState, useCallback } from 'react'
import { BottomSheet, Toast } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

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
  projectName?: string
}

/**
 * Settlement history display - Clean, scannable transaction log
 *
 * UX Principles:
 * - High information density
 * - Fast vertical scanning
 * - Minimal visual noise
 * - Read-only log (no editing, no deletion)
 * - Export/share for auditability
 */
export function SettlementHistorySheet({
  isOpen,
  onClose,
  settlements,
  currency,
  projectName = '',
}: SettlementHistorySheetProps) {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'long',
      day: 'numeric',
    }).format(d)
  }

  const formatFullDate = (date: Date) => {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  // Calculate total amount
  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0)

  // Generate shareable text summary
  const generateShareText = useCallback(() => {
    const today = formatFullDate(new Date())
    const title = projectName ? `تاریخچه تسویه‌ها – ${projectName}` : 'تاریخچه تسویه‌ها'

    const lines = [
      title,
      today,
      '',
      ...settlements.map(s =>
        `${s.from.name} → ${s.to.name}   ${formatMoney(s.amount, currency)}`
      ),
      '',
      `جمع کل تسویه‌ها: ${formatMoney(totalAmount, currency)}`,
    ]

    return lines.join('\n')
  }, [settlements, currency, projectName, totalAmount])

  // Share using Web Share API or fallback to clipboard
  const handleShare = useCallback(async () => {
    setShowExportMenu(false)
    setIsExporting(true)

    const text = generateShareText()

    try {
      // Try native share first
      if (navigator.share) {
        await navigator.share({
          title: projectName ? `تاریخچه تسویه‌ها – ${projectName}` : 'تاریخچه تسویه‌ها',
          text,
        })
        setToast({ message: 'اشتراک‌گذاری شد', type: 'success' })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(text)
        setToast({ message: 'در کلیپ‌بورد کپی شد', type: 'success' })
      }
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== 'AbortError') {
        // Try clipboard as last resort
        try {
          await navigator.clipboard.writeText(text)
          setToast({ message: 'در کلیپ‌بورد کپی شد', type: 'success' })
        } catch {
          setToast({ message: 'خطا در اشتراک‌گذاری', type: 'error' })
        }
      }
    } finally {
      setIsExporting(false)
    }
  }, [generateShareText, projectName])

  // Export as CSV
  const handleExportCSV = useCallback(() => {
    setShowExportMenu(false)
    setIsExporting(true)

    try {
      const headers = ['تاریخ', 'پرداخت‌کننده', 'دریافت‌کننده', 'مبلغ', 'توضیحات']
      const rows = settlements.map(s => [
        formatDate(s.settledAt),
        s.from.name,
        s.to.name,
        formatMoney(s.amount, currency),
        s.note || '-'
      ])

      // Add total row
      rows.push(['', '', 'جمع کل:', formatMoney(totalAmount, currency), ''])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Download CSV with UTF-8 BOM for Excel compatibility
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `settlements-${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      setToast({ message: 'فایل دانلود شد', type: 'success' })
    } catch {
      setToast({ message: 'خطا در دانلود', type: 'error' })
    } finally {
      setIsExporting(false)
    }
  }, [settlements, currency, totalAmount])

  const hasSettlements = settlements.length > 0

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col max-h-[70vh]">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                تاریخچه تسویه‌ها
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                همه پرداخت‌هایی که برای صاف‌کردن حساب ثبت شده
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 -mt-1 -mr-1">
              {/* Export Menu Button */}
              {hasSettlements && (
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isExporting}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                    title="اشتراک‌گذاری تاریخچه"
                  >
                    {isExporting ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    )}
                  </button>

                  {/* Export Dropdown */}
                  {showExportMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]">
                        <button
                          onClick={handleShare}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-right hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span className="text-sm text-gray-700 dark:text-gray-300">اشتراک‌گذاری خلاصه</span>
                        </button>
                        <button
                          onClick={handleExportCSV}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-right hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="text-sm text-gray-700 dark:text-gray-300">دانلود CSV</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto">
          {!hasSettlements ? (
            /* Empty State */
            <div className="text-center py-12 px-5">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📋</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                هنوز تسویه‌ای ثبت نشده
              </p>
            </div>
          ) : (
            /* Compact List */
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {settlements.map((settlement) => (
                <div
                  key={settlement.id}
                  className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Primary Row: Direction + Amount (LTR for arrow) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0" dir="ltr">
                      {/* From Initial */}
                      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {settlement.from.name.charAt(0)}
                        </span>
                      </div>

                      {/* Names + Arrow */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {settlement.from.name}
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {settlement.to.name}
                        </span>
                      </div>

                      {/* To Initial */}
                      <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {settlement.to.name.charAt(0)}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400 flex-shrink-0 tabular-nums">
                      {formatMoney(settlement.amount, currency)}
                    </span>
                  </div>

                  {/* Secondary Row: Date + Receipt link */}
                  <div className="flex items-center justify-between mt-1.5 mr-9">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {formatDate(settlement.settledAt)}
                    </span>
                    {settlement.receiptUrl && (
                      <a
                        href={settlement.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-500 dark:text-blue-400 hover:underline"
                      >
                        رسید
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Count + Total Summary */}
        {hasSettlements && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {settlements.length} تسویه ثبت شده
              </p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                جمع: {formatMoney(totalAmount, currency)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast
        isOpen={!!toast}
        onClose={() => setToast(null)}
        message={toast?.message || ''}
        type={toast?.type || 'success'}
        duration={2000}
      />
    </BottomSheet>
  )
}
