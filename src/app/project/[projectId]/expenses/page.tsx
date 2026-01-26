'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FloatingButton } from '@/components/ui'
import { getTemplate } from '@/lib/domain/templates'
import { getRecentPeriods, formatPeriodKey } from '@/lib/utils/persian-date'
import {
  ExpensesHeader,
  SearchBar,
  ExpensesList,
  FilterSheet,
} from './components'

// ============================================
// Types
// ============================================

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
  periodKey?: string | null
  paidBy: Participant
  paidById: string
  category?: Category
  categoryId?: string
}

interface Project {
  id: string
  template: string
  currency: string
  participants: Participant[]
  categories: Category[]
}

type FilterType = 'all' | 'category' | 'payer' | 'period' | 'dateRange'

interface DateRange {
  startDate: string | null // ISO date string
  endDate: string | null
}

// ============================================
// Helper Functions
// ============================================

/**
 * Groups expenses by formatted Persian date
 */
function groupExpensesByDate(expenses: Expense[]): Record<string, Expense[]> {
  return expenses.reduce(
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
}

/**
 * Filters expenses based on search query and active filters
 */
function filterExpenses(
  expenses: Expense[],
  searchQuery: string,
  filterType: FilterType,
  selectedCategoryId: string | null,
  selectedPayerId: string | null,
  selectedPeriodKey: string | null,
  dateRange: DateRange
): Expense[] {
  return expenses.filter((expense) => {
    // Search filter - matches title, payer name, or category
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

    // Period filter
    if (filterType === 'period' && selectedPeriodKey !== null) {
      if (expense.periodKey !== selectedPeriodKey) return false
    }

    // Date range filter
    if (filterType === 'dateRange') {
      const expenseDate = new Date(expense.expenseDate)
      if (dateRange.startDate) {
        const start = new Date(dateRange.startDate)
        start.setHours(0, 0, 0, 0)
        if (expenseDate < start) return false
      }
      if (dateRange.endDate) {
        const end = new Date(dateRange.endDate)
        end.setHours(23, 59, 59, 999)
        if (expenseDate > end) return false
      }
    }

    return true
  })
}

/**
 * Gets a human-readable label for the active filter
 */
function getFilterLabel(
  filterType: FilterType,
  selectedCategoryId: string | null,
  selectedPayerId: string | null,
  selectedPeriodKey: string | null,
  dateRange: DateRange,
  categories: Category[],
  participants: Participant[]
): string {
  if (filterType === 'category' && selectedCategoryId !== null) {
    if (selectedCategoryId === 'none') return 'بدون دسته'
    const cat = categories.find((c) => c.id === selectedCategoryId)
    return cat ? `${cat.icon} ${cat.name}` : ''
  }
  if (filterType === 'payer' && selectedPayerId !== null) {
    const payer = participants.find((p) => p.id === selectedPayerId)
    return payer ? payer.name : ''
  }
  if (filterType === 'period' && selectedPeriodKey !== null) {
    return formatPeriodKey(selectedPeriodKey)
  }
  if (filterType === 'dateRange') {
    const formatDate = (d: string) => new Date(d).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
    if (dateRange.startDate && dateRange.endDate) {
      return `${formatDate(dateRange.startDate)} تا ${formatDate(dateRange.endDate)}`
    }
    if (dateRange.startDate) return `از ${formatDate(dateRange.startDate)}`
    if (dateRange.endDate) return `تا ${formatDate(dateRange.endDate)}`
  }
  return ''
}

// ============================================
// Main Component
// ============================================

/**
 * Expenses List Page
 *
 * A timeline view of all expenses in a project.
 * Focused on clarity and trust - this is for reviewing expenses,
 * not for accounting calculations.
 *
 * UX Goals:
 * - User instantly understands what this list shows
 * - User feels comfortable scrolling
 * - User knows how to add a new expense
 * - Page does not feel like "finance software"
 */
export default function ExpensesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedPayerId, setSelectedPayerId] = useState<string | null>(null)
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, expensesRes] = await Promise.all([
          // Fetch project without expenses (optimization - avoid duplicate data)
          fetch(`/api/projects/${projectId}?includeExpenses=false`),
          // Fetch with limit of 100 (API max) for now (client-side filtering)
          // TODO: Move filtering to server-side for better performance
          fetch(`/api/projects/${projectId}/expenses?limit=100`),
        ])

        if (projectRes.ok) {
          const { project } = await projectRes.json()
          setProject(project)
        }

        if (expensesRes.ok) {
          const data = await expensesRes.json()
          // Handle both old format (array) and new format (object with pagination)
          setExpenses(data.expenses || data)
        }
      } catch (error) {
        console.error('Error fetching expenses data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId])

  // Check if template supports period filtering
  const templateDef = project ? getTemplate(project.template) : null
  const supportsPeriod = templateDef?.periodRequired || false
  const availablePeriods = useMemo(() => getRecentPeriods(12), [])

  // Computed values
  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, searchQuery, filterType, selectedCategoryId, selectedPayerId, selectedPeriodKey, dateRange),
    [expenses, searchQuery, filterType, selectedCategoryId, selectedPayerId, selectedPeriodKey, dateRange]
  )

  const groupedExpenses = useMemo(
    () => groupExpensesByDate(filteredExpenses),
    [filteredExpenses]
  )

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  )

  const hasActiveFilter = filterType !== 'all'
  const isFiltered = hasActiveFilter || !!searchQuery

  const activeFilterLabel = useMemo(
    () => getFilterLabel(
      filterType,
      selectedCategoryId,
      selectedPayerId,
      selectedPeriodKey,
      dateRange,
      project?.categories || [],
      project?.participants || []
    ),
    [filterType, selectedCategoryId, selectedPayerId, selectedPeriodKey, dateRange, project]
  )

  // Handlers
  const handleBack = useCallback(() => router.back(), [router])

  const handleApplyFilter = useCallback((type: FilterType, id: string | null) => {
    setFilterType(type)
    if (type === 'category') {
      setSelectedCategoryId(id)
      setSelectedPayerId(null)
      setSelectedPeriodKey(null)
      setDateRange({ startDate: null, endDate: null })
    } else if (type === 'payer') {
      setSelectedPayerId(id)
      setSelectedCategoryId(null)
      setSelectedPeriodKey(null)
      setDateRange({ startDate: null, endDate: null })
    } else if (type === 'period') {
      setSelectedPeriodKey(id)
      setSelectedCategoryId(null)
      setSelectedPayerId(null)
      setDateRange({ startDate: null, endDate: null })
    }
    setShowFilters(false)
  }, [])

  const handleApplyDateRange = useCallback((start: string | null, end: string | null) => {
    setFilterType('dateRange')
    setDateRange({ startDate: start, endDate: end })
    setSelectedCategoryId(null)
    setSelectedPayerId(null)
    setSelectedPeriodKey(null)
    setShowFilters(false)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilterType('all')
    setSelectedCategoryId(null)
    setSelectedPayerId(null)
    setSelectedPeriodKey(null)
    setDateRange({ startDate: null, endDate: null })
    setSearchQuery('')
    setShowFilters(false)
  }, [])

  const handleAddExpense = useCallback(
    () => router.push(`/project/${projectId}/add-expense`),
    [router, projectId]
  )

  // Loading state
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10">
        <ExpensesHeader
          totalAmount={totalAmount}
          currency={project?.currency || 'IRR'}
          itemCount={filteredExpenses.length}
          isFiltered={isFiltered}
          onBack={handleBack}
        />
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          hasActiveFilter={hasActiveFilter}
          activeFilterLabel={activeFilterLabel}
          onFilterClick={() => setShowFilters(true)}
        />
      </div>

      {/* Expenses Timeline */}
      <ExpensesList
        expenses={filteredExpenses}
        groupedExpenses={groupedExpenses}
        projectId={projectId}
        currency={project?.currency || 'IRR'}
        isFiltered={isFiltered}
        onClearFilters={handleClearFilters}
        showPeriod={supportsPeriod}
      />

      {/* Floating Add Button - secondary to list items, clear action */}
      <FloatingButton
        onClick={handleAddExpense}
        className="shadow-lg shadow-blue-500/25"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
      >
        ثبت خرج
      </FloatingButton>

      {/* Filter Bottom Sheet */}
      <FilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        categories={project?.categories || []}
        participants={project?.participants || []}
        filterType={filterType}
        selectedCategoryId={selectedCategoryId}
        selectedPayerId={selectedPayerId}
        selectedPeriodKey={selectedPeriodKey}
        dateRange={dateRange}
        onApplyFilter={handleApplyFilter}
        onApplyDateRange={handleApplyDateRange}
        onClearFilters={handleClearFilters}
        supportsPeriod={supportsPeriod}
        availablePeriods={availablePeriods}
      />
    </main>
  )
}
