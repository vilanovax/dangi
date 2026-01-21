'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, FloatingButton, Avatar, BottomSheet } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'
import Link from 'next/link'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Expense {
  id: string
  title: string
  amount: number
  expenseDate: string
  paidBy: Participant
  paidById: string
  category?: Category
  categoryId?: string
}

interface Project {
  id: string
  currency: string
  participants: Participant[]
  categories: Category[]
}

type FilterType = 'all' | 'category' | 'payer'

export default function ExpensesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedPayerId, setSelectedPayerId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const [projectRes, expensesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/expenses`),
      ])

      if (projectRes.ok) {
        const projectData = await projectRes.json()
        setProject(projectData.project)
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        setExpenses(expensesData.expenses)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter expenses based on search and filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = expense.title.toLowerCase().includes(query)
        const matchesPayer = expense.paidBy.name.toLowerCase().includes(query)
        const matchesCategory = expense.category?.name.toLowerCase().includes(query)
        if (!matchesTitle && !matchesPayer && !matchesCategory) {
          return false
        }
      }

      // Category filter
      if (filterType === 'category' && selectedCategoryId !== null) {
        if (selectedCategoryId === 'none') {
          if (expense.categoryId) return false
        } else {
          if (expense.categoryId !== selectedCategoryId) return false
        }
      }

      // Payer filter
      if (filterType === 'payer' && selectedPayerId !== null) {
        if (expense.paidById !== selectedPayerId) return false
      }

      return true
    })
  }, [expenses, searchQuery, filterType, selectedCategoryId, selectedPayerId])

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    return filteredExpenses.reduce(
      (groups, expense) => {
        const date = new Date(expense.expenseDate).toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(expense)
        return groups
      },
      {} as Record<string, Expense[]>
    )
  }, [filteredExpenses])

  const clearFilters = () => {
    setFilterType('all')
    setSelectedCategoryId(null)
    setSelectedPayerId(null)
    setShowFilters(false)
  }

  const applyFilter = (type: FilterType, id: string | null) => {
    setFilterType(type)
    if (type === 'category') {
      setSelectedCategoryId(id)
      setSelectedPayerId(null)
    } else if (type === 'payer') {
      setSelectedPayerId(id)
      setSelectedCategoryId(null)
    }
    setShowFilters(false)
  }

  const hasActiveFilter = filterType !== 'all'

  // Get active filter label
  const getActiveFilterLabel = () => {
    if (filterType === 'category' && selectedCategoryId !== null) {
      if (selectedCategoryId === 'none') return 'بدون دسته'
      const cat = project?.categories.find((c) => c.id === selectedCategoryId)
      return cat ? `${cat.icon} ${cat.name}` : ''
    }
    if (filterType === 'payer' && selectedPayerId !== null) {
      const payer = project?.participants.find((p) => p.id === selectedPayerId)
      return payer ? payer.name : ''
    }
    return ''
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <main className="min-h-dvh pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg z-10 border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold flex-1">همه هزینه‌ها</h1>
            <span className="text-sm text-gray-500">{filteredExpenses.length} هزینه</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="جستجو در هزینه‌ها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setShowFilters(true)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all ${
              hasActiveFilter
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>فیلتر</span>
          </button>

          {hasActiveFilter && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full text-sm bg-blue-500 text-white flex items-center gap-1.5">
                {getActiveFilterLabel()}
                <button onClick={clearFilters} className="hover:bg-blue-600 rounded-full p-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expenses List */}
      <div className="px-4 py-4">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">{searchQuery || hasActiveFilter ? '🔍' : '📭'}</div>
            <p className="text-gray-500">
              {searchQuery || hasActiveFilter ? 'هزینه‌ای پیدا نشد' : 'هنوز هزینه‌ای ثبت نشده'}
            </p>
            {(searchQuery || hasActiveFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  clearFilters()
                }}
                className="text-blue-500 text-sm mt-2"
              >
                پاک کردن فیلترها
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
              <div key={date}>
                <h3 className="text-sm text-gray-500 mb-2 sticky top-[140px] bg-gray-50 dark:bg-gray-950 py-1 z-[5]">
                  {date}
                </h3>
                <div className="space-y-2">
                  {dateExpenses.map((expense) => (
                    <Link
                      key={expense.id}
                      href={`/project/${projectId}/expense/${expense.id}`}
                      className="block"
                    >
                      <Card className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: (expense.category?.color || '#6B7280') + '20' }}
                        >
                          <span className="text-xl">{expense.category?.icon || '📝'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{expense.title}</p>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Avatar
                              avatar={deserializeAvatar(
                                expense.paidBy.avatar || null,
                                expense.paidBy.name
                              )}
                              name={expense.paidBy.name}
                              size="sm"
                            />
                            <span>{expense.paidBy.name} پرداخت کرد</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {formatMoney(expense.amount, project?.currency || 'IRR')}
                          </p>
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <FloatingButton
        onClick={() => router.push(`/project/${projectId}/add-expense`)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
      >
        ثبت هزینه
      </FloatingButton>

      {/* Filter Bottom Sheet */}
      <BottomSheet isOpen={showFilters} onClose={() => setShowFilters(false)} title="فیلتر هزینه‌ها">
        <div className="space-y-6">
          {/* Filter by Category */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              بر اساس دسته‌بندی
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyFilter('category', 'none')}
                className={`px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                  filterType === 'category' && selectedCategoryId === 'none'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                بدون دسته
              </button>
              {project?.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => applyFilter('category', cat.id)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm transition-all flex items-center gap-1.5 ${
                    filterType === 'category' && selectedCategoryId === cat.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter by Payer */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              بر اساس پرداخت‌کننده
            </h3>
            <div className="flex flex-wrap gap-2">
              {project?.participants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyFilter('payer', p.id)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm transition-all flex items-center gap-2 ${
                    filterType === 'payer' && selectedPayerId === p.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Avatar
                    avatar={deserializeAvatar(p.avatar || null, p.name)}
                    name={p.name}
                    size="sm"
                  />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="w-full py-3 text-center text-red-500 text-sm font-medium"
            >
              پاک کردن فیلتر
            </button>
          )}
        </div>
      </BottomSheet>
    </main>
  )
}
