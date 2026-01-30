/**
 * Cash Flow Timeline Card
 * Simplified placeholder - shows text summary
 */

'use client'

interface CashFlowTimelineProps {
  projectId: string
  periodKey?: string
}

export function CashFlowTimeline({ projectId, periodKey = '1403-01' }: CashFlowTimelineProps) {
  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">
          📈 جریان نقدی
        </h2>
        <p className="text-amber-700 dark:text-amber-300">
          نمایش روند درآمد و هزینه
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          نمودار جریان نقدی برای دوره {periodKey}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          (نمودار تعاملی به‌زودی اضافه خواهد شد)
        </p>
      </div>
    </div>
  )
}
