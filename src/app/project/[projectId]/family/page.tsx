import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/utils/auth'
import { getProjectById } from '@/lib/services/project.service'
import { calculateFamilyStats } from '@/lib/domain/calculators/familyStats'
import {
  getCurrentPeriodKey,
  getPersianPeriodBounds,
} from '@/lib/utils/persian-date'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function FamilyDashboardPage({ params }: PageProps) {
  const { projectId } = await params

  // Auth check
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/auth')
  }

  // Get project
  const project = await getProjectById(projectId)
  if (!project) {
    redirect('/')
  }

  // Verify this is a family template
  if (project.template !== 'family') {
    redirect(`/project/${projectId}`)
  }

  // Get current period (Persian/Shamsi calendar)
  const periodKey = getCurrentPeriodKey() // e.g., "1403-10"

  // Calculate period dates (convert Persian to Gregorian)
  const { startDate, endDate } = getPersianPeriodBounds(periodKey)

  // Fetch dashboard data
  const stats = await calculateFamilyStats(projectId, periodKey, startDate, endDate)

  // Parse period for display
  const [year, month] = periodKey.split('-')
  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]
  const monthName = monthNames[parseInt(month) - 1]

  // Calculate net balance
  const netBalance = stats.totalIncome - stats.totalExpenses

  // Combine recent activity - SMART: Show only 5 items
  const allTransactions = [
    ...stats.recentIncomes.map((income) => ({
      id: income.id,
      title: income.title,
      amount: income.amount,
      date: income.date,
      type: 'INCOME' as const,
      categoryName: income.categoryName,
      categoryIcon: income.categoryIcon,
      personName: income.receivedByName,
    })),
    ...stats.recentExpenses.map((expense) => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      type: 'EXPENSE' as const,
      categoryName: expense.categoryName,
      categoryIcon: expense.categoryIcon,
      personName: expense.paidByName,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5) // Only 5 items for dashboard

  // Smart aggregation: Group similar consecutive transactions
  const smartTransactions = allTransactions.reduce((acc, transaction, index) => {
    if (index === 0) {
      return [{
        ...transaction,
        count: 1,
        totalAmount: transaction.amount,
      }]
    }

    const lastItem = acc[acc.length - 1]
    const isSameTitle = lastItem.title === transaction.title
    const isSameCategory = lastItem.categoryName === transaction.categoryName
    const isSameType = lastItem.type === transaction.type

    // Aggregate if same title, category, and type
    if (isSameTitle && isSameCategory && isSameType) {
      lastItem.count += 1
      lastItem.totalAmount += transaction.amount
      return acc
    }

    return [...acc, {
      ...transaction,
      count: 1,
      totalAmount: transaction.amount,
    }]
  }, [] as Array<{
    id: string
    title: string
    amount: number
    date: Date
    type: 'INCOME' | 'EXPENSE'
    categoryName?: string
    categoryIcon?: string
    personName: string
    count: number
    totalAmount: number
  }>)

  // Simple relative time formatter
  function getRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'همین الان'
    if (diffMins < 60) return `${diffMins} دقیقه پیش`
    if (diffHours < 24) return `${diffHours} ساعت پیش`
    if (diffDays < 7) return `${diffDays} روز پیش`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} هفته پیش`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ماه پیش`
    return `${Math.floor(diffDays / 365)} سال پیش`
  }

  // Smart messages based on financial status
  const getSavingsMessage = () => {
    if (stats.savingsRate >= 20) return 'عالی پیش می‌ری 👏'
    if (stats.savingsRate >= 10) return 'بد نیست، می‌تونه بهتر بشه'
    if (stats.savingsRate >= 0) return 'این ماه کمتر پس‌انداز داشتی'
    return 'هشدار! خرج‌ها بیشتر از درآمد شده'
  }

  const getBalanceMessage = () => {
    if (netBalance >= 0) return 'بعد از همه درآمدها و هزینه‌ها'
    return 'خرج‌هات بیشتر از درآمدت شده ⚠️'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFDF8' }}>
      {/* Header - Compact با گرادیان نارنجی استاندارد */}
      <div
        className="text-white p-5 shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #FF8A00 0%, #FFA94D 100%)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-bold" style={{ fontSize: '20px' }}>خانواده خرج</h1>
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <span style={{ fontSize: '12px', fontWeight: '500' }}>{monthName} {year}</span>
              </div>
            </div>
            <p className="text-white/75 mt-1" style={{ fontSize: '11px' }}>
              خلاصه مالی این ماه 📊
            </p>
          </div>
          <Link
            href={`/project/${projectId}/family/settings`}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <span className="text-base">⚙️</span>
          </Link>
        </div>
      </div>

      {/* Monthly Stats Cards */}
      <div className="p-4 space-y-4">
        {/* Net Balance - Hero Card (Compact) */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB'
          }}
        >
          <div className="text-center">
            <div
              className="mb-2 uppercase tracking-wide"
              style={{
                fontSize: '11px',
                color: '#9CA3AF'
              }}
            >
              وضعیت مالی این ماه
            </div>
            <div
              className="font-black mb-2"
              style={{
                fontSize: '48px',
                color: netBalance >= 0 ? '#22C55E' : '#EF4444'
              }}
            >
              {netBalance >= 0 ? '+' : ''}{(netBalance / 10).toLocaleString('fa-IR')}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }} className="mb-2">تومان</div>
            <div
              style={{
                fontSize: '11px',
                color: netBalance >= 0 ? '#22C55E' : '#EF4444'
              }}
            >
              {getBalanceMessage()}
            </div>
          </div>
        </div>

        {/* Income and Expense Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/project/${projectId}/family/transactions?filter=income`}
            className="rounded-2xl p-5 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: '#EAFBF1',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#22C55E' }}
              >
                <span className="text-sm">💰</span>
              </div>
              <span
                className="font-semibold"
                style={{ fontSize: '12px', color: '#22C55E' }}
              >
                درآمد
              </span>
            </div>
            <div
              className="font-bold mb-1"
              style={{ fontSize: '24px', color: '#22C55E' }}
            >
              {(stats.totalIncome / 10).toLocaleString('fa-IR')}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>مجموع درآمدها</div>
          </Link>

          <Link
            href={`/project/${projectId}/family/transactions?filter=expense`}
            className="rounded-2xl p-5 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: '#FEECEC',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#EF4444' }}
              >
                <span className="text-sm">💸</span>
              </div>
              <span
                className="font-semibold"
                style={{ fontSize: '12px', color: '#EF4444' }}
              >
                هزینه
              </span>
            </div>
            <div
              className="font-bold mb-1"
              style={{ fontSize: '24px', color: '#EF4444' }}
            >
              {(stats.totalExpenses / 10).toLocaleString('fa-IR')}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>مجموع هزینه‌ها</div>
          </Link>
        </div>

        {/* Quick Stats - Savings & Budget */}
        <div className="grid grid-cols-2 gap-3">
          {/* Savings Widget */}
          <Link
            href={`/project/${projectId}/family/reports`}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border border-blue-100"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                <span className="text-base">📊</span>
              </div>
              <span className="text-xs text-blue-800 font-semibold">پس‌انداز</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 mb-2">
              {stats.savingsRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-blue-600 leading-relaxed">
              {getSavingsMessage()}
            </div>
          </Link>

          {/* Budget Widget */}
          {stats.budgetUtilization === 0 ? (
            <Link
              href={`/project/${projectId}/family/budgets/set`}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                  <span className="text-base">🎯</span>
                </div>
                <span className="text-xs text-amber-800 font-semibold">بودجه</span>
              </div>
              <div className="text-sm font-bold text-amber-700 mb-2">
                هنوز بودجه‌ای تعیین نکردی
              </div>
              <div className="text-[10px] text-amber-600">
                🎯 تنظیم بودجه
              </div>
            </Link>
          ) : (
            <Link
              href={`/project/${projectId}/family/budgets`}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                  <span className="text-base">🎯</span>
                </div>
                <span className="text-xs text-amber-800 font-semibold">بودجه</span>
              </div>
              <div className="text-2xl font-bold text-amber-700 mb-2">
                {stats.budgetUtilization.toFixed(0)}%
              </div>
              <div className="text-[10px] text-amber-600">
                استفاده شده از کل بودجه
              </div>
            </Link>
          )}
        </div>

        {/* Recent Activity - Smart (5 items max) */}
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-stone-800">آخرین فعالیت‌ها</h2>
              <p className="text-[10px] text-stone-500 mt-0.5">
                خلاصه‌ی خرج‌ها و درآمدهای اخیر
              </p>
            </div>
            <Link
              href={`/project/${projectId}/family/transactions`}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
            >
              مشاهده همه
              <span>←</span>
            </Link>
          </div>

          {smartTransactions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-sm text-stone-600 font-medium mb-1">
                هنوز خرج یا درآمدی ثبت نکردی
              </p>
              <p className="text-xs text-stone-500">
                از دکمه + پایین صفحه شروع کن
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {smartTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`rounded-xl p-3 transition-all hover:scale-[1.01] ${
                    transaction.type === 'INCOME'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100'
                      : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                          transaction.type === 'INCOME'
                            ? 'bg-green-200 ring-2 ring-green-100'
                            : 'bg-red-200 ring-2 ring-red-100'
                        }`}
                      >
                        <span className="text-lg">
                          {transaction.categoryIcon ||
                            (transaction.type === 'INCOME' ? '💰' : '💸')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-stone-800 text-sm truncate">
                          {transaction.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {transaction.count > 1 && (
                            <>
                              <span className="text-[10px] text-stone-600 font-medium">
                                {transaction.count} بار
                              </span>
                              <span className="text-[8px] text-stone-400">•</span>
                            </>
                          )}
                          {transaction.categoryName && (
                            <>
                              <span className="text-[10px] text-stone-500">
                                {transaction.categoryName}
                              </span>
                              <span className="text-[8px] text-stone-400">•</span>
                            </>
                          )}
                          <span className="text-[10px] text-stone-500">
                            {getRelativeTime(transaction.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <div
                        className={`text-base font-black ${
                          transaction.type === 'INCOME' ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '−'}
                        {(transaction.totalAmount / 10).toLocaleString('fa-IR')}
                      </div>
                      {transaction.count > 1 && (
                        <div className="text-[9px] text-stone-500 text-left">
                          جمع {transaction.count} مورد
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivational Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-stone-500">
            خرج‌هات رو ساده و شفاف ببین 🌱
          </p>
        </div>
      </div>
    </div>
  )
}
