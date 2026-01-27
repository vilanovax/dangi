'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

interface Category {
  id: string
  name: string
  icon?: string | null
}

interface BudgetInput {
  categoryId: string
  amount: number
}

export default function SetBudgetsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Get current period (current month)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const periodKey = `${year}-${month}`

  // State
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Record<string, string>>({}) // categoryId -> amount string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchLoading, setFetchLoading] = useState(true)

  // Fetch categories and existing budgets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, budgetsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/categories`),
          fetch(`/api/projects/${projectId}/budgets?period=${periodKey}`),
        ])

        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(data.categories || [])
        }

        if (budgetsRes.ok) {
          const data = await budgetsRes.json()
          // Populate existing budgets
          const existingBudgets: Record<string, string> = {}
          data.budgets?.forEach((budget: any) => {
            existingBudgets[budget.categoryId] = String(budget.amount)
          })
          setBudgets(existingBudgets)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('خطا در بارگذاری اطلاعات')
      } finally {
        setFetchLoading(false)
      }
    }

    fetchData()
  }, [projectId, periodKey])

  const handleBudgetChange = (categoryId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [categoryId]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Prepare budget data (only non-empty amounts)
    const budgetInputs: BudgetInput[] = []
    Object.entries(budgets).forEach(([categoryId, amountStr]) => {
      const amount = parseFloat(amountStr)
      if (amountStr && !isNaN(amount) && amount > 0) {
        budgetInputs.push({ categoryId, amount })
      }
    })

    if (budgetInputs.length === 0) {
      setError('لطفاً حداقل یک بودجه را تنظیم کنید')
      return
    }

    setLoading(true)

    try {
      // Save each budget (upsert)
      const promises = budgetInputs.map((input) =>
        fetch(`/api/projects/${projectId}/budgets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: input.categoryId,
            amount: input.amount,
            periodKey,
          }),
        })
      )

      const results = await Promise.all(promises)
      const failedRequests = results.filter((res) => !res.ok)

      if (failedRequests.length > 0) {
        throw new Error('برخی از بودجه‌ها ذخیره نشدند')
      }

      // Success - navigate back to dashboard
      router.push(`/project/${projectId}/family`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره بودجه‌ها')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-stone-600">در حال بارگذاری...</div>
      </div>
    )
  }

  // Parse period for display
  const monthNames = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ]
  const monthName = monthNames[parseInt(month, 10) - 1]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">تنظیم بودجه</h1>
        </div>
        <p className="text-amber-100 text-sm mr-14">
          {monthName} {year}
        </p>
      </div>

      {/* Form */}
      <div className="p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info card */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="font-bold text-stone-800 mb-1">
                  بودجه‌بندی ماهانه
                </h3>
                <p className="text-sm text-stone-600">
                  برای هر دسته‌بندی، سقف هزینه ماهانه را مشخص کنید. فیلدهای خالی
                  بودجه ندارند.
                </p>
              </div>
            </div>
          </div>

          {/* Categories list */}
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-2xl p-4 shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Category info */}
                  <div className="flex items-center gap-3 flex-1">
                    {category.icon && (
                      <span className="text-2xl">{category.icon}</span>
                    )}
                    <div>
                      <div className="font-medium text-stone-800">
                        {category.name}
                      </div>
                      {budgets[category.id] && (
                        <div className="text-xs text-stone-500">
                          بودجه فعلی:{' '}
                          {parseFloat(budgets[category.id]).toLocaleString(
                            'fa-IR'
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amount input */}
                  <div className="w-40">
                    <input
                      type="number"
                      value={budgets[category.id] || ''}
                      onChange={(e) =>
                        handleBudgetChange(category.id, e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-left text-sm"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-stone-600">
              هیچ دسته‌بندی‌ای یافت نشد
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading || categories.length === 0}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'در حال ذخیره...' : '💾 ذخیره بودجه‌ها'}
          </Button>
        </form>
      </div>
    </div>
  )
}
