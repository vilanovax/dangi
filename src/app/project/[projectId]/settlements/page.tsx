'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FloatingButton, Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'
import Link from 'next/link'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Settlement {
  id: string
  amount: number
  note?: string | null
  settledAt: string
  from: Participant
  to: Participant
}

interface Project {
  id: string
  currency: string
  participants: Participant[]
}

export default function SettlementsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const [projectRes, settlementsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/settlements`),
      ])

      if (projectRes.ok) {
        const projectData = await projectRes.json()
        setProject(projectData.project)
      }

      if (settlementsRes.ok) {
        const settlementsData = await settlementsRes.json()
        setSettlements(settlementsData.settlements)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter settlements based on search
  const filteredSettlements = useMemo(() => {
    if (!searchQuery) return settlements
    const query = searchQuery.toLowerCase()
    return settlements.filter((s) => {
      return (
        s.from.name.toLowerCase().includes(query) ||
        s.to.name.toLowerCase().includes(query) ||
        s.note?.toLowerCase().includes(query)
      )
    })
  }, [settlements, searchQuery])

  // Group settlements by date
  const groupedSettlements = useMemo(() => {
    return filteredSettlements.reduce(
      (groups, settlement) => {
        const date = new Date(settlement.settledAt).toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(settlement)
        return groups
      },
      {} as Record<string, Settlement[]>
    )
  }, [filteredSettlements])

  // Calculate total
  const totalAmount = useMemo(() => {
    return filteredSettlements.reduce((sum, s) => sum + s.amount, 0)
  }, [filteredSettlements])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10">
        <div className="bg-green-500 text-white px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 -mr-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">تسویه‌ها</h1>
              <p className="text-green-100 text-sm">{filteredSettlements.length} مورد</p>
            </div>
          </div>

          {/* Total Amount Card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-green-100 text-sm mb-1">مجموع تسویه‌ها</p>
            <p className="text-2xl font-bold">{formatMoney(totalAmount, project?.currency || 'IRR')}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
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
              placeholder="جستجو در تسویه‌ها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settlements List */}
      <div className="px-4 py-4">
        {filteredSettlements.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">{searchQuery ? '🔍' : '💸'}</span>
            </div>
            <p className="text-gray-500 font-medium">
              {searchQuery ? 'تسویه‌ای پیدا نشد' : 'هنوز تسویه‌ای ثبت نشده'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery ? 'عبارت دیگری جستجو کنید' : 'اولین تسویه را ثبت کنید'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-green-500 text-sm mt-4 font-medium"
              >
                پاک کردن جستجو
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSettlements).map(([date, dateSettlements]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                  <span className="text-xs text-gray-500 font-medium px-2">{date}</span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                </div>

                {/* Settlement Cards */}
                <div className="space-y-2">
                  {dateSettlements.map((settlement) => (
                    <Link
                      key={settlement.id}
                      href={`/project/${projectId}/settlement/${settlement.id}`}
                      className="block"
                    >
                      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          {/* From Avatar */}
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10">
                              <Avatar
                                avatar={deserializeAvatar(settlement.from.avatar || null, settlement.from.name)}
                                name={settlement.from.name}
                                size="md"
                              />
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex flex-col items-center">
                            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>

                          {/* To Avatar */}
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10">
                              <Avatar
                                avatar={deserializeAvatar(settlement.to.avatar || null, settlement.to.name)}
                                name={settlement.to.name}
                                size="md"
                              />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {settlement.from.name} به {settlement.to.name}
                            </p>
                            {settlement.note && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {settlement.note}
                              </p>
                            )}
                          </div>

                          {/* Amount */}
                          <div className="text-left flex-shrink-0">
                            <p className="font-bold text-green-600">
                              {formatMoney(settlement.amount, project?.currency || 'IRR')}
                            </p>
                          </div>
                        </div>
                      </div>
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
        onClick={() => router.push(`/project/${projectId}/add-settlement`)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
        className="!bg-green-500 hover:!bg-green-600"
      >
        ثبت تسویه
      </FloatingButton>
    </main>
  )
}
