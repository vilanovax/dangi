'use client'

import useSWR from 'swr'

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

  return {
    projects: data?.projects || [],
    user: data?.user || null,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
