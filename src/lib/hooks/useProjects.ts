'use client'

import useSWR from 'swr'
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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<ProjectsResponse>(
    '/api/projects',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  // Memoize to prevent infinite re-renders when data is undefined
  const projects = useMemo(() => data?.projects || [], [data?.projects])
  const user = useMemo(() => data?.user || null, [data?.user])

  return {
    projects,
    user,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
