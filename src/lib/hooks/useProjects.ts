'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

interface User {
  id: string
  name: string
  phone: string
  avatar?: string | null
}

interface Project {
  id: string
  name: string
  template: string
  currency: string
  participantCount: number
  expenseCount: number
  totalExpenses: number
  myBalance: number
  myParticipantId: string
  myName: string
  myRole: string
  isArchived: boolean
  createdAt: string
}

interface ProjectsResponse {
  projects: Project[]
  user: User | null
}

/**
 * Hook: Get all projects (migrated from SWR to React Query)
 *
 * این hook از React Query استفاده می‌کند برای:
 * - Automatic caching
 * - Background refetching
 * - Dedupe requests
 */
export function useProjects() {
  const { data, error, isLoading, refetch } = useQuery<ProjectsResponse>({
    queryKey: ['projects', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Refetch on reconnect
    refetchOnReconnect: true,
    // Stale time: 5 seconds (کمتر از قبل برای data freshness بیشتر)
    staleTime: 5000,
  })

  // Memoize to prevent infinite re-renders when data is undefined
  const projects = useMemo(() => data?.projects || [], [data?.projects])
  const user = useMemo(() => data?.user || null, [data?.user])

  return {
    projects,
    user,
    isLoading,
    isError: error,
    refresh: refetch,
  }
}
