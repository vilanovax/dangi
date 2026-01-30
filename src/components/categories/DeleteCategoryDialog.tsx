'use client'

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'

interface Category {
  id: string
  name: string
  icon?: string | null
  color?: string | null
}

interface DeleteCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  projectId: string
  onSuccess: () => void
}

export function DeleteCategoryDialog({
  isOpen,
  onClose,
  category,
  projectId,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usageCount, setUsageCount] = useState(0)
  const [fetchingUsage, setFetchingUsage] = useState(false)

  // Fetch usage stats when dialog opens
  useEffect(() => {
    if (isOpen && category) {
      fetchUsageStats()
    } else {
      setUsageCount(0)
      setError('')
    }
  }, [isOpen, category])

  const fetchUsageStats = async () => {
    if (!category) return

    setFetchingUsage(true)
    try {
      // Fetch expenses count
      const expensesRes = await fetch(`/api/projects/${projectId}/expenses?categoryId=${category.id}`)
      const expensesData = expensesRes.ok ? await expensesRes.json() : { expenses: [] }

      // Fetch budgets count (family template only)
      const budgetsRes = await fetch(`/api/projects/${projectId}/budgets?categoryId=${category.id}`)
      const budgetsData = budgetsRes.ok ? await budgetsRes.json() : { budgets: [] }

      const totalUsage = (expensesData.expenses?.length || 0) + (budgetsData.budgets?.length || 0)
      setUsageCount(totalUsage)
    } catch (err) {
      console.error('Error fetching usage stats:', err)
      setUsageCount(0)
    } finally {
      setFetchingUsage(false)
    }
  }

  const handleDelete = async () => {
    if (!category) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/categories/${category.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در حذف دسته‌بندی')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'مشکلی پیش آمد، دوباره تلاش کنید')
    } finally {
      setLoading(false)
    }
  }

  if (!category) return null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: '8px 0 24px' }}>
        {/* Title */}
        <h2 className="font-bold text-gray-900 dark:text-white mb-4" style={{ fontSize: '18px' }}>
          حذف «{category.name}»؟
        </h2>

        {/* Usage Warning */}
        {fetchingUsage ? (
          <div className="text-center py-4">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#FF8A00] border-t-transparent"></div>
          </div>
        ) : usageCount > 0 ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
            <p className="text-red-700 dark:text-red-400" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              این دسته‌بندی در <strong>{usageCount.toLocaleString('fa-IR')}</strong> تراکنش استفاده شده.
              با حذف، دسته‌بندی تراکنش‌ها خالی می‌شود.
            </p>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 mb-4" style={{ fontSize: '14px', lineHeight: '1.6' }}>
            این دسته‌بندی در هیچ تراکنشی استفاده نشده و می‌توانید آن را حذف کنید.
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4" style={{ fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{
              backgroundColor: '#EF4444',
              fontSize: '15px',
            }}
          >
            {loading ? 'در حال حذف...' : 'حذف نهایی'}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-full text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ fontSize: '15px' }}
          >
            لغو
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
