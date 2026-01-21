'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, FloatingButton } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

interface Participant {
  id: string
  name: string
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
  category?: Category
}

export default function ExpensesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [currency, setCurrency] = useState('IRR')
  const [loading, setLoading] = useState(true)

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
        setCurrency(projectData.project.currency)
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

  // Group expenses by date
  const groupedExpenses = expenses.reduce((groups, expense) => {
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
  }, {} as Record<string, Expense[]>)

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
      <div className="sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg z-10 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">همه هزینه‌ها</h1>
        </div>
      </div>

      {/* Expenses List */}
      <div className="px-4 py-4">
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">هنوز هزینه‌ای ثبت نشده</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
              <div key={date}>
                <h3 className="text-sm text-gray-500 mb-2 sticky top-14 bg-gray-50 dark:bg-gray-950 py-1">
                  {date}
                </h3>
                <div className="space-y-2">
                  {dateExpenses.map((expense) => (
                    <Card key={expense.id} className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: (expense.category?.color || '#6B7280') + '20' }}
                      >
                        <span className="text-xl">{expense.category?.icon || '📝'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{expense.title}</p>
                        <p className="text-sm text-gray-500">
                          {expense.paidBy.name} پرداخت کرد
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatMoney(expense.amount, currency)}
                      </p>
                    </Card>
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
    </main>
  )
}
