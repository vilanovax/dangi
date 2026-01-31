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
import { designTokens as dt } from '@/styles/design-tokens'
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
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent mx-auto"
            style={{
              borderColor: dt.colors.brand.primary,
              borderTopColor: 'transparent'
            }}
          ></div>
          <p
            className={`mt-4 ${getTextColorClass('primary')}`}
            style={{ fontSize: dt.typography.sizes.body }}
          >
            در حال بارگذاری...
          </p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${getBackgroundClass()}`}>
        <div className="text-center" style={{ padding: dt.spacing[8] }}>
          <p
            className={`mb-4 ${getTextColorClass('danger')}`}
            style={{ fontSize: dt.typography.sizes.body }}
          >
            خطا در بارگذاری داده‌ها
          </p>
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
    <div className={`min-h-screen ${getBackgroundClass()}`} style={{ paddingBottom: dt.layout.bottomNavHeight }}>
      {/* 1️⃣ Header - Minimal and calm */}
      <div style={{ padding: `${dt.spacing[6]}px ${dt.spacing[4]}px`, backgroundColor: dt.colors.background.app }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`font-bold leading-tight ${getTextColorClass('primary')}`}
                style={{ fontSize: dt.typography.sizes.headline }}
              >
                {isPersonal ? 'حساب شخصی' : 'حساب خانواده'}
              </h1>
              <p
                className={`mt-0.5 ${getTextColorClass('secondary')}`}
                style={{ fontSize: dt.typography.sizes.caption }}
              >
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
      <div
        className="max-w-2xl mx-auto space-y-6"
        style={{
          paddingLeft: dt.layout.pagePadding,
          paddingRight: dt.layout.pagePadding,
          paddingTop: dt.spacing[4],
          paddingBottom: dt.layout.sectionGap
        }}
      >
        {/* 2️⃣ Hero Card - Monthly Financial Status (Clickable) */}
        <button
          onClick={() => router.push(`/project/${projectId}/family/reports/${periodKey}`)}
          className="w-full bg-white dark:bg-gray-900 text-right hover:shadow-md transition-all active:scale-[0.99]"
          style={{
            borderRadius: dt.radius.lg,
            boxShadow: dt.shadow.card,
            padding: dt.spacing[6]
          }}
        >
          <p
            className={`mb-3 ${getTextColorClass('secondary')}`}
            style={{ fontSize: dt.typography.sizes.caption }}
          >
            وضعیت مالی این ماه
          </p>

          <div style={{ marginBottom: dt.spacing[6] }}>
            <p
              className="font-extrabold leading-tight"
              style={{
                fontSize: 32,
                color: netBalance >= 0 ? dt.colors.semantic.income : dt.colors.semantic.expense
              }}
            >
              {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString('fa-IR')}
              <span
                className="font-normal"
                style={{
                  fontSize: dt.typography.sizes.body,
                  color: dt.colors.text.muted
                }}
              >
                {' '}تومان
              </span>
            </p>
            <p
              className={`mt-1 ${getTextColorClass('secondary')}`}
              style={{ fontSize: dt.typography.sizes.caption }}
            >
              مانده خالص
            </p>
          </div>

          <div
            className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800"
            style={{
              paddingTop: dt.spacing[4],
              fontSize: dt.typography.sizes.caption
            }}
          >
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
          <div
            className="flex items-center justify-center gap-1 border-t border-gray-100 dark:border-gray-800"
            style={{
              marginTop: dt.spacing[4],
              paddingTop: dt.spacing[3]
            }}
          >
            <span
              className={getTextColorClass('secondary')}
              style={{ fontSize: dt.typography.sizes.caption }}
            >
              ضربه بزن برای جزئیات
            </span>
            <FamilyIcon name="back" size={12} className="text-gray-400 dark:text-gray-600 rotate-180" />
          </div>
        </button>

        {/* 3️⃣ Stats Row - Three quick indicators */}
        <div className="grid grid-cols-3" style={{ gap: dt.spacing[4] }}>
          <div className="text-center">
            <div
              className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-red-50 dark:bg-red-950/30"
              style={{ marginBottom: dt.spacing[2] }}
            >
              <FamilyIcon name="expense" size={20} style={{ color: dt.colors.semantic.expense }} />
            </div>
            <div
              className={`mb-1 ${getTextColorClass('secondary')}`}
              style={{ fontSize: dt.typography.sizes.caption }}
            >
              هزینه
            </div>
            <div
              className={`font-bold ${getTextColorClass('primary')}`}
              style={{ fontSize: dt.typography.sizes.title }}
            >
              {formatLarge(totalExpenses)}
            </div>
          </div>

          <div className="text-center">
            <div
              className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-green-50 dark:bg-green-950/30"
              style={{ marginBottom: dt.spacing[2] }}
            >
              <FamilyIcon name="income" size={20} style={{ color: dt.colors.semantic.income }} />
            </div>
            <div
              className={`mb-1 ${getTextColorClass('secondary')}`}
              style={{ fontSize: dt.typography.sizes.caption }}
            >
              درآمد
            </div>
            <div
              className={`font-bold ${getTextColorClass('primary')}`}
              style={{ fontSize: dt.typography.sizes.title }}
            >
              {formatLarge(totalIncome)}
            </div>
          </div>

          <div className="text-center">
            <div
              className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-orange-50 dark:bg-orange-950/30"
              style={{ marginBottom: dt.spacing[2] }}
            >
              <FamilyIcon name="savings" size={20} style={{ color: dt.colors.brand.primary }} />
            </div>
            <div
              className={`mb-1 ${getTextColorClass('secondary')}`}
              style={{ fontSize: dt.typography.sizes.caption }}
            >
              پس‌انداز
            </div>
            <div
              className={`font-bold ${getTextColorClass('primary')}`}
              style={{ fontSize: dt.typography.sizes.title }}
            >
              {savingsRate.toFixed(0)}٪
            </div>
          </div>
        </div>

        {/* 4️⃣ Primary Actions - ONLY add transactions */}
        <div className="grid grid-cols-2" style={{ gap: dt.spacing[3] }}>
          <Link
            href={`/project/${projectId}/family/add-expense`}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:shadow-md active:scale-95 flex items-center justify-center"
            style={{
              borderRadius: dt.radius.lg,
              boxShadow: dt.shadow.card,
              padding: dt.spacing[4],
              gap: dt.spacing[2]
            }}
          >
            <FamilyIcon name="expense" size={20} style={{ color: dt.colors.semantic.expense }} />
            <span
              className={`font-semibold ${getTextColorClass('primary')}`}
              style={{ fontSize: dt.typography.sizes.body }}
            >
              ثبت خرج
            </span>
          </Link>

          <Link
            href={`/project/${projectId}/family/add-income`}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:shadow-md active:scale-95 flex items-center justify-center"
            style={{
              borderRadius: dt.radius.lg,
              boxShadow: dt.shadow.card,
              padding: dt.spacing[4],
              gap: dt.spacing[2]
            }}
          >
            <FamilyIcon name="income" size={20} style={{ color: dt.colors.semantic.income }} />
            <span
              className={`font-semibold ${getTextColorClass('primary')}`}
              style={{ fontSize: dt.typography.sizes.body }}
            >
              ثبت درآمد
            </span>
          </Link>
        </div>

        {/* 5️⃣ Recent Transactions Preview */}
        <div
          className="bg-white dark:bg-gray-900"
          style={{
            borderRadius: dt.radius.lg,
            boxShadow: dt.shadow.card,
            padding: dt.spacing[5]
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: dt.spacing[4] }}>
            <h2
              className="font-semibold text-gray-900 dark:text-white"
              style={{ fontSize: dt.typography.sizes.bodyLarge }}
            >
              آخرین تراکنش‌ها
            </h2>
            <Link
              href={`/project/${projectId}/family/transactions`}
              className="hover:opacity-80 transition-opacity"
              style={{
                fontSize: dt.typography.sizes.caption,
                color: dt.colors.brand.primary
              }}
            >
              مشاهده همه ←
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[3] }}>
            {/* Combine and show max 3 */}
            {[
              ...(stats.recentExpenses?.slice(0, 2).map(e => ({ ...e, type: 'expense' })) || []),
              ...(stats.recentIncomes?.slice(0, 1).map(i => ({ ...i, type: 'income' })) || [])
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3)
              .map((transaction, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between"
                  style={{ paddingTop: dt.spacing[2], paddingBottom: dt.spacing[2] }}
                >
                  <div className="flex items-center" style={{ gap: dt.spacing[3] }}>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: transaction.type === 'expense'
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(34, 197, 94, 0.1)'
                      }}
                    >
                      {transaction.type === 'expense' ? (
                        <svg
                          className="w-4 h-4"
                          style={{ color: dt.colors.semantic.expense }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          style={{ color: dt.colors.semantic.income }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-gray-900 dark:text-white"
                      style={{ fontSize: dt.typography.sizes.body }}
                    >
                      {transaction.title}
                    </span>
                  </div>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: dt.typography.sizes.body,
                      color: transaction.type === 'expense' ? dt.colors.semantic.expense : dt.colors.semantic.income
                    }}
                  >
                    {transaction.type === 'expense' ? '-' : '+'}{transaction.amount.toLocaleString('fa-IR')}
                  </span>
                </div>
              ))}

            {/* Empty State */}
            {(!stats.recentExpenses?.length && !stats.recentIncomes?.length) && (
              <div
                className="text-center"
                style={{ paddingTop: dt.spacing[7], paddingBottom: dt.spacing[7] }}
              >
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                  style={{
                    backgroundColor: dt.colors.brand.primarySoft,
                    marginBottom: dt.spacing[4]
                  }}
                >
                  <svg
                    className="w-8 h-8"
                    style={{ color: dt.colors.brand.primary }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p
                  className="text-gray-600 dark:text-gray-300 font-medium mb-1"
                  style={{ fontSize: dt.typography.sizes.body }}
                >
                  هنوز تراکنشی ثبت نشده
                </p>
                <p
                  className="text-gray-400 dark:text-gray-500"
                  style={{ fontSize: dt.typography.sizes.caption }}
                >
                  با ثبت اولین تراکنش، همه‌چیز شفاف می‌شه
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 6️⃣ Budget Status Preview */}
        {stats.budgets && stats.budgets.length > 0 ? (
          <div
            className="bg-white dark:bg-gray-900"
            style={{
              borderRadius: dt.radius.lg,
              boxShadow: dt.shadow.card,
              padding: dt.spacing[5]
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: dt.spacing[4] }}>
              <h2
                className="font-semibold text-gray-900 dark:text-white"
                style={{ fontSize: dt.typography.sizes.bodyLarge }}
              >
                وضعیت بودجه ماه
              </h2>
              <Link
                href={`/project/${projectId}/family/budgets`}
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontSize: dt.typography.sizes.caption,
                  color: dt.colors.brand.primary
                }}
              >
                مشاهده همه ←
              </Link>
            </div>

            {/* Overall progress */}
            <div style={{ marginBottom: dt.spacing[4] }}>
              <div
                className="flex items-center justify-between text-gray-500 dark:text-gray-400"
                style={{
                  fontSize: dt.typography.sizes.caption,
                  marginBottom: dt.spacing[2]
                }}
              >
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
                        ? dt.colors.semantic.expense
                        : (stats.budgetUtilization ?? 0) > 80
                          ? dt.colors.semantic.warning
                          : dt.colors.semantic.income
                  }}
                />
              </div>
            </div>

            {/* Top 3 budgets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[3] }}>
              {stats.budgets.slice(0, 3).map((budget) => (
                <div key={budget.categoryId} className="flex items-center justify-between">
                  <div className="flex items-center" style={{ gap: dt.spacing[3] }}>
                    <span style={{ fontSize: dt.typography.sizes.title }}>{budget.categoryIcon || '📦'}</span>
                    <span
                      className="text-gray-700 dark:text-gray-300"
                      style={{ fontSize: dt.typography.sizes.body }}
                    >
                      {budget.categoryName}
                    </span>
                  </div>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: dt.typography.sizes.body,
                      color: budget.isOverBudget ? dt.colors.semantic.expense : dt.colors.text.secondary
                    }}
                  >
                    {budget.percentage.toFixed(0)}٪
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="bg-white dark:bg-gray-900 text-center"
            style={{
              borderRadius: dt.radius.lg,
              boxShadow: dt.shadow.card,
              padding: dt.spacing[6]
            }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-orange-50 dark:bg-orange-950/30"
              style={{ marginBottom: dt.spacing[3] }}
            >
              <FamilyIcon name="budget" size={28} style={{ color: dt.colors.brand.primary }} />
            </div>
            <h3
              className={`font-semibold mb-1 ${getTextColorClass('primary')}`}
              style={{ fontSize: dt.typography.sizes.body }}
            >
              هنوز بودجه‌ای تعیین نکردی
            </h3>
            <p
              className={getTextColorClass('secondary')}
              style={{
                fontSize: dt.typography.sizes.caption,
                marginBottom: dt.spacing[4]
              }}
            >
              با تنظیم بودجه، خرج‌ها رو بهتر کنترل کن
            </p>
            <Link
              href={`/project/${projectId}/family/budgets/set`}
              className="inline-flex items-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300"
              style={{
                gap: dt.spacing[2],
                paddingLeft: dt.spacing[4],
                paddingRight: dt.spacing[4],
                paddingTop: dt.spacing[2],
                paddingBottom: dt.spacing[2],
                borderRadius: dt.radius.md,
                fontSize: dt.typography.sizes.caption
              }}
            >
              تنظیم بودجه ←
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
