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
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF8A00] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300" style={{ fontSize: '14px' }}>در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#FFFDF8' }}>
        <div className="text-center p-8">
          <p className="mb-4" style={{ fontSize: '14px', color: '#EF4444' }}>خطا در بارگذاری داده‌ها</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 rounded-2xl transition-colors"
            style={{ backgroundColor: '#FF8A00', color: 'white' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E67A00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8A00'}
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
      <div className="px-4 py-6" style={{ backgroundColor: 'rgba(255, 253, 248, 0.8)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '22px', lineHeight: '1.3' }}>
                {isPersonal ? 'حساب شخصی' : 'حساب خانواده'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '13px', marginTop: '2px' }}>
                {monthName} {year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                aria-label="بازگشت به خانه"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <button
                onClick={() => refetch()}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                aria-label="بارگذاری مجدد"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => router.push(`/project/${projectId}/family/settings`)}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                aria-label="تنظیمات"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 space-y-6" style={{ paddingTop: '16px', paddingBottom: '24px' }}>
        {/* 2️⃣ Hero Card - Monthly Financial Status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm" style={{ padding: '24px' }}>
          <p className="text-gray-500 dark:text-gray-400 mb-3" style={{ fontSize: '13px' }}>
            وضعیت مالی این ماه
          </p>

          <div className="mb-6">
            <p
              className="font-extrabold"
              style={{
                fontSize: '32px',
                lineHeight: '1.2',
                color: netBalance >= 0 ? '#22C55E' : '#EF4444'
              }}
            >
              {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString('fa-IR')}
              <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#9CA3AF' }}> تومان</span>
            </p>
            <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '13px', marginTop: '4px' }}>
              مانده خالص
            </p>
          </div>

          <div
            className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800"
            style={{ paddingTop: '16px', fontSize: '13px' }}
          >
            <div>
              <span className="text-gray-500 dark:text-gray-400">درآمد: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalIncome.toLocaleString('fa-IR')}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">هزینه: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalExpenses.toLocaleString('fa-IR')}
              </span>
            </div>
          </div>
        </div>

        {/* 3️⃣ Stats Row - Three quick indicators */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div
              className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              <svg className="w-5 h-5" style={{ color: '#EF4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div className="text-gray-500 dark:text-gray-400 mb-1" style={{ fontSize: '12px' }}>
              هزینه
            </div>
            <div className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '18px' }}>
              {formatLarge(totalExpenses)}
            </div>
          </div>

          <div className="text-center">
            <div
              className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
            >
              <svg className="w-5 h-5" style={{ color: '#22C55E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <div className="text-gray-500 dark:text-gray-400 mb-1" style={{ fontSize: '12px' }}>
              درآمد
            </div>
            <div className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '18px' }}>
              {formatLarge(totalIncome)}
            </div>
          </div>

          <div className="text-center">
            <div
              className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 138, 0, 0.1)' }}
            >
              <svg className="w-5 h-5" style={{ color: '#FF8A00' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-gray-500 dark:text-gray-400 mb-1" style={{ fontSize: '12px' }}>
              پس‌انداز
            </div>
            <div className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '18px' }}>
              {savingsRate.toFixed(0)}٪
            </div>
          </div>
        </div>

        {/* 4️⃣ Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/project/${projectId}/family/add-expense`}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
            style={{ padding: '16px' }}
          >
            <svg className="w-5 h-5" style={{ color: '#EF4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            <span className="font-semibold text-gray-900 dark:text-white" style={{ fontSize: '14px' }}>
              ثبت خرج
            </span>
          </Link>

          <Link
            href={`/project/${projectId}/family/add-income`}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
            style={{ padding: '16px' }}
          >
            <svg className="w-5 h-5" style={{ color: '#22C55E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-semibold text-gray-900 dark:text-white" style={{ fontSize: '14px' }}>
              ثبت درآمد
            </span>
          </Link>

          <Link
            href={`/project/${projectId}/family/reports`}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
            style={{ padding: '16px' }}
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-semibold text-gray-900 dark:text-white" style={{ fontSize: '14px' }}>
              گزارش‌ها
            </span>
          </Link>

          <Link
            href={`/project/${projectId}/family/budgets`}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
            style={{ padding: '16px' }}
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-gray-900 dark:text-white" style={{ fontSize: '14px' }}>
              بودجه
            </span>
          </Link>
        </div>

        {/* 5️⃣ Recent Transactions - Max 3 items */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white" style={{ fontSize: '16px' }}>
              آخرین تراکنش‌ها
            </h2>
            <Link
              href={`/project/${projectId}/family/transactions`}
              className="hover:opacity-80 transition-opacity"
              style={{ fontSize: '13px', color: '#FF8A00' }}
            >
              مشاهده همه ←
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
                <div key={idx} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: transaction.type === 'expense'
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(34, 197, 94, 0.1)'
                      }}
                    >
                      {transaction.type === 'expense' ? (
                        <svg className="w-4 h-4" style={{ color: '#EF4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" style={{ color: '#22C55E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white" style={{ fontSize: '14px' }}>
                      {transaction.title}
                    </span>
                  </div>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: '14px',
                      color: transaction.type === 'expense' ? '#EF4444' : '#22C55E'
                    }}
                  >
                    {transaction.type === 'expense' ? '-' : '+'}{transaction.amount.toLocaleString('fa-IR')}
                  </span>
                </div>
              ))}

            {/* Empty State */}
            {(!stats.recentExpenses?.length && !stats.recentIncomes?.length) && (
              <div className="text-center" style={{ padding: '32px 0' }}>
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 138, 0, 0.1)' }}
                >
                  <svg className="w-8 h-8" style={{ color: '#FF8A00' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium mb-1" style={{ fontSize: '14px' }}>
                  هنوز تراکنشی ثبت نشده
                </p>
                <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>
                  با ثبت اولین تراکنش، همه‌چیز شفاف می‌شه
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Budget Overview - Optional section */}
        {stats.budgets && stats.budgets.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm" style={{ padding: '20px' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white" style={{ fontSize: '16px' }}>
                بودجه ماه
              </h2>
              <Link
                href={`/project/${projectId}/family/budgets/set`}
                className="hover:opacity-80 transition-opacity"
                style={{ fontSize: '13px', color: '#FF8A00' }}
              >
                تنظیم
              </Link>
            </div>

            {/* Overall progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2" style={{ fontSize: '12px' }}>
                <span>استفاده شده</span>
                <span>{stats.budgetUtilization?.toFixed(0)}٪</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(stats.budgetUtilization ?? 0, 100)}%`,
                    backgroundColor:
                      (stats.budgetUtilization ?? 0) > 100
                        ? '#EF4444'
                        : (stats.budgetUtilization ?? 0) > 80
                          ? '#F59E0B'
                          : '#22C55E'
                  }}
                />
              </div>
            </div>

            {/* Top 3 budgets */}
            <div className="space-y-3">
              {stats.budgets.slice(0, 3).map((budget) => (
                <div key={budget.categoryId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '18px' }}>{budget.categoryIcon || '📦'}</span>
                    <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px' }}>
                      {budget.categoryName}
                    </span>
                  </div>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: '14px',
                      color: budget.isOverBudget ? '#EF4444' : '#6B7280'
                    }}
                  >
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
