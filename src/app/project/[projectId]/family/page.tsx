/**
 * Modern Personal Finance Dashboard
 * Based on clean, minimal wireframe design
 */

'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { projectKeys } from '@/hooks/useProjects'
import type { FamilyDashboardStats } from '@/types/family'

interface PageProps {
  params: Promise<{
    projectId: string
  }>
}

async function fetchFamilyStats(projectId: string, period?: string) {
  const url = period
    ? `/api/projects/${projectId}/family-stats?period=${period}`
    : `/api/projects/${projectId}/family-stats`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch family stats')
  }
  return res.json()
}

async function fetchProject(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}`)
  if (!res.ok) {
    throw new Error('Failed to fetch project')
  }
  return res.json()
}

export default function FamilyDashboardPage({ params }: PageProps) {
  const { projectId } = use(params)
  const router = useRouter()

  // Fetch project info
  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
  })

  // Fetch family stats
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...projectKeys.familyStats(projectId)],
    queryFn: () => fetchFamilyStats(projectId),
  })

  const stats: FamilyDashboardStats | null = data?.stats || null
  const project = projectData?.project || null

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#FFFDF8' }}>
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#FFFDF8' }}>
        <div className="text-center p-8">
          <p className="text-red-600 dark:text-red-400 mb-4">خطا در بارگذاری داده‌ها</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }

  const totalIncome = stats?.totalIncome ?? 0
  const totalExpenses = stats?.totalExpenses ?? 0
  const netBalance = totalIncome - totalExpenses
  const savingsRate = stats?.savingsRate ?? 0
  const periodKey = stats?.periodKey ?? '1403-01'

  // Parse period for display
  const [year, month] = periodKey.split('-')
  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]
  const monthName = monthNames[parseInt(month, 10) - 1]

  const isPersonal = project?.template === 'personal'

  // Format large numbers (millions)
  const formatLarge = (num: number) => {
    const millions = num / 1000000
    return millions.toFixed(1) + 'M'
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#FFFDF8' }}>
      {/* 1️⃣ Header - Minimal and calm */}
      <div className="bg-blue-50/40 dark:bg-blue-950/20 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {isPersonal ? 'حساب شخصی' : 'حساب خانواده'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{monthName} {year}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 2️⃣ Hero Card - Monthly Financial Status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">وضعیت مالی این ماه</p>

          <div className="mb-4">
            <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString('fa-IR')} <span className="text-base font-normal">تومان</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">مانده خالص</p>
          </div>

          <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-gray-500 dark:text-gray-400">درآمد: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {totalIncome.toLocaleString('fa-IR')}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">هزینه: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {totalExpenses.toLocaleString('fa-IR')}
              </span>
            </div>
          </div>
        </div>

        {/* 3️⃣ Stats Row - Three quick indicators */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl mb-1">🔴</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">هزینه</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatLarge(totalExpenses)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl mb-1">🟢</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">درآمد</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatLarge(totalIncome)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">پس‌انداز</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {savingsRate.toFixed(0)}٪
            </div>
          </div>
        </div>

        {/* 4️⃣ Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/project/${projectId}/family/add-expense`}
            className="bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl p-4 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">➕</span>
            <span className="font-medium text-gray-900 dark:text-white">ثبت خرج</span>
          </Link>

          <Link
            href={`/project/${projectId}/family/add-income`}
            className="bg-green-50/50 dark:bg-green-950/20 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-xl p-4 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">➕</span>
            <span className="font-medium text-gray-900 dark:text-white">ثبت درآمد</span>
          </Link>

          <Link
            href={`/project/${projectId}/family/reports`}
            className="bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl p-4 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">📊</span>
            <span className="font-medium text-gray-900 dark:text-white">گزارش‌ها</span>
          </Link>

          <Link
            href={`/project/${projectId}/family/budgets`}
            className="bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl p-4 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">🎯</span>
            <span className="font-medium text-gray-900 dark:text-white">بودجه</span>
          </Link>
        </div>

        {/* 5️⃣ Recent Transactions - Max 3 items */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">آخرین تراکنش‌ها</h2>
            <Link
              href={`/project/${projectId}/family/transactions`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              مشاهده همه →
            </Link>
          </div>

          <div className="space-y-3">
            {/* Combine and show max 3 */}
            {[
              ...(stats.recentExpenses?.slice(0, 2).map(e => ({ ...e, type: 'expense' })) || []),
              ...(stats.recentIncomes?.slice(0, 1).map(i => ({ ...i, type: 'income' })) || [])
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3)
              .map((transaction, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{transaction.type === 'expense' ? '💸' : '💰'}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{transaction.title}</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    transaction.type === 'expense'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {transaction.type === 'expense' ? '-' : '+'}{transaction.amount.toLocaleString('fa-IR')}
                  </span>
                </div>
              ))}

            {/* Empty State */}
            {(!stats.recentExpenses?.length && !stats.recentIncomes?.length) && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">
                  هنوز خرجی ثبت نکردی
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  با ثبت اولین خرج، همه‌چیز شفاف می‌شه
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Budget Overview - Optional section */}
        {stats.budgets && stats.budgets.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">بودجه ماه</h2>
              <Link
                href={`/project/${projectId}/family/budgets/set`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                تنظیم
              </Link>
            </div>

            {/* Overall progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>استفاده شده</span>
                <span>{stats.budgetUtilization?.toFixed(0)}٪</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    (stats.budgetUtilization ?? 0) > 100
                      ? 'bg-red-500'
                      : (stats.budgetUtilization ?? 0) > 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stats.budgetUtilization ?? 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Top 3 budgets */}
            <div className="space-y-2">
              {stats.budgets.slice(0, 3).map((budget) => (
                <div key={budget.categoryId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{budget.categoryIcon || '📦'}</span>
                    <span className="text-gray-700 dark:text-gray-300">{budget.categoryName}</span>
                  </div>
                  <span className={`font-medium ${
                    budget.isOverBudget ? 'text-red-600' : 'text-gray-900 dark:text-white'
                  }`}>
                    {budget.percentage.toFixed(0)}٪
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
