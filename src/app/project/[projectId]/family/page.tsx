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
import { FamilyButton } from './components/FamilyButton'
import { FamilyIcon } from './components/FamilyIcon'
import { getBackgroundClass, getTextColorClass } from '@/styles/family-theme'

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
      <div className={`flex min-h-screen items-center justify-center ${getBackgroundClass()}`}>
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF8A00] dark:border-[#FFA94D] border-t-transparent mx-auto"></div>
          <p className={`mt-4 text-[14px] ${getTextColorClass('primary')}`}>در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${getBackgroundClass()}`}>
        <div className="text-center p-8">
          <p className={`mb-4 text-[14px] ${getTextColorClass('danger')}`}>خطا در بارگذاری داده‌ها</p>
          <FamilyButton variant="primary" onClick={() => refetch()} size="md">
            تلاش مجدد
          </FamilyButton>
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

  // Format large numbers (millions) - with Persian digits
  const formatLarge = (num: number) => {
    const millions = num / 10000000 // Convert to millions (تومان to میلیون)
    return millions.toLocaleString('fa-IR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + 'M'
  }

  return (
    <div className={`min-h-screen pb-24 ${getBackgroundClass()}`}>
      {/* 1️⃣ Header - Minimal and calm */}
      <div className="px-4 py-6" style={{ backgroundColor: 'rgba(255, 253, 248, 0.8)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-[22px] font-bold leading-tight ${getTextColorClass('primary')}`}>
                {isPersonal ? 'حساب شخصی' : 'حساب خانواده'}
              </h1>
              <p className={`text-[13px] mt-0.5 ${getTextColorClass('secondary')}`}>
                {monthName} {year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                aria-label="بازگشت به خانه"
              >
                <FamilyIcon name="home" size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => refetch()}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                aria-label="بارگذاری مجدد"
              >
                <FamilyIcon name="recurring" size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => router.push(`/project/${projectId}/family/settings`)}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                aria-label="تنظیمات"
              >
                <FamilyIcon name="settings" size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 space-y-6" style={{ paddingTop: '16px', paddingBottom: '24px' }}>
        {/* 2️⃣ Hero Card - Monthly Financial Status (Clickable) */}
        <button
          onClick={() => router.push(`/project/${projectId}/family/reports/${periodKey}`)}
          className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 text-right hover:shadow-md transition-all active:scale-[0.99]"
        >
          <p className={`text-[13px] mb-3 ${getTextColorClass('secondary')}`}>
            وضعیت مالی این ماه
          </p>

          <div className="mb-6">
            <p className={`text-[32px] font-extrabold leading-tight ${netBalance >= 0 ? 'text-[#22C55E] dark:text-[#4ADE80]' : 'text-[#EF4444] dark:text-[#F87171]'}`}>
              {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString('fa-IR')}
              <span className="text-[14px] font-normal text-gray-400 dark:text-gray-500"> تومان</span>
            </p>
            <p className={`text-[13px] mt-1 ${getTextColorClass('secondary')}`}>
              مانده خالص
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 text-[13px]">
            <div>
              <span className={getTextColorClass('secondary')}>درآمد: </span>
              <span className={`font-semibold ${getTextColorClass('primary')}`}>
                {totalIncome.toLocaleString('fa-IR')}
              </span>
            </div>
            <div>
              <span className={getTextColorClass('secondary')}>هزینه: </span>
              <span className={`font-semibold ${getTextColorClass('primary')}`}>
                {totalExpenses.toLocaleString('fa-IR')}
              </span>
            </div>
          </div>

          {/* Tap hint */}
          <div className="flex items-center justify-center gap-1 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className={`text-[11px] ${getTextColorClass('secondary')}`}>
              ضربه بزن برای جزئیات
            </span>
            <FamilyIcon name="back" size={12} className="text-gray-400 dark:text-gray-600 rotate-180" />
          </div>
        </button>

        {/* 3️⃣ Stats Row - Three quick indicators */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-red-50 dark:bg-red-950/30">
              <FamilyIcon name="expense" size={20} className="text-[#EF4444] dark:text-[#F87171]" />
            </div>
            <div className={`text-[12px] mb-1 ${getTextColorClass('secondary')}`}>
              هزینه
            </div>
            <div className={`text-[18px] font-bold ${getTextColorClass('primary')}`}>
              {formatLarge(totalExpenses)}
            </div>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-green-50 dark:bg-green-950/30">
              <FamilyIcon name="income" size={20} className="text-[#22C55E] dark:text-[#4ADE80]" />
            </div>
            <div className={`text-[12px] mb-1 ${getTextColorClass('secondary')}`}>
              درآمد
            </div>
            <div className={`text-[18px] font-bold ${getTextColorClass('primary')}`}>
              {formatLarge(totalIncome)}
            </div>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-orange-50 dark:bg-orange-950/30">
              <FamilyIcon name="savings" size={20} className="text-[#FF8A00] dark:text-[#FFA94D]" />
            </div>
            <div className={`text-[12px] mb-1 ${getTextColorClass('secondary')}`}>
              پس‌انداز
            </div>
            <div className={`text-[18px] font-bold ${getTextColorClass('primary')}`}>
              {savingsRate.toFixed(0)}٪
            </div>
          </div>
        </div>

        {/* 4️⃣ Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/project/${projectId}/family/add-expense`}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 p-4"
          >
            <FamilyIcon name="expense" size={20} className="text-[#EF4444] dark:text-[#F87171]" />
            <span className={`text-[14px] font-semibold ${getTextColorClass('primary')}`}>
              ثبت خرج
            </span>
          </Link>

          <Link
            href={`/project/${projectId}/family/add-income`}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 p-4"
          >
            <FamilyIcon name="income" size={20} className="text-[#22C55E] dark:text-[#4ADE80]" />
            <span className={`text-[14px] font-semibold ${getTextColorClass('primary')}`}>
              ثبت درآمد
            </span>
          </Link>

          <Link
            href={`/project/${projectId}/family/reports`}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 p-4"
          >
            <FamilyIcon name="reports" size={20} className="text-gray-600 dark:text-gray-400" />
            <span className={`text-[14px] font-semibold ${getTextColorClass('primary')}`}>
              گزارش‌ها
            </span>
          </Link>

          <Link
            href={`/project/${projectId}/family/budgets`}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 p-4"
          >
            <FamilyIcon name="budget" size={20} className="text-gray-600 dark:text-gray-400" />
            <span className={`text-[14px] font-semibold ${getTextColorClass('primary')}`}>
              بودجه
            </span>
          </Link>
        </div>

        {/* Full Report CTA - Prominent */}
        <button
          onClick={() => router.push(`/project/${projectId}/family/reports/${periodKey}`)}
          className="w-full bg-gradient-to-br from-[#4F6EF7] to-[#6D83FF] dark:from-[#6D83FF] dark:to-[#818CF8] hover:from-[#6D83FF] hover:to-[#4F6EF7] rounded-2xl p-5 shadow-lg transition-all text-white group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="text-right">
              <div className="font-bold text-[15px] mb-1">
                مشاهده گزارش کامل {monthName}
              </div>
              <div className="text-[12px] opacity-90">
                تحلیل عمیق درآمدها، هزینه‌ها و دسته‌بندی‌ها
              </div>
            </div>
            <FamilyIcon
              name="back"
              size={20}
              className="text-white rotate-180 group-hover:translate-x-1 transition-transform"
            />
          </div>
        </button>

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
