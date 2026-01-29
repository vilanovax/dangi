import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Query Keys for Projects
 */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: any) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  summary: (id: string) => [...projectKeys.detail(id), 'summary'] as const,
  expenses: (id: string) => [...projectKeys.detail(id), 'expenses'] as const,
  settlements: (id: string) => [...projectKeys.detail(id), 'settlements'] as const,
  familyStats: (id: string, period?: string) => [
    ...projectKeys.detail(id),
    'family-stats',
    period,
  ] as const,
}

/**
 * Hook: Get all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
  })
}

/**
 * Hook: Get single project
 */
export function useProject(projectId: string, options?: { includeExpenses?: boolean }) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.includeExpenses === false) {
        params.set('includeExpenses', 'false')
      }
      const url = `/api/projects/${projectId}${params.toString() ? `?${params.toString()}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch project')
      return res.json()
    },
    enabled: !!projectId,
  })
}

/**
 * Hook: Get project summary
 */
export function useProjectSummary(projectId: string) {
  return useQuery({
    queryKey: projectKeys.summary(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/summary`)
      if (!res.ok) throw new Error('Failed to fetch summary')
      return res.json()
    },
    enabled: !!projectId,
  })
}

/**
 * Hook: Get project expenses
 */
export function useProjectExpenses(projectId: string, limit = 100) {
  return useQuery({
    queryKey: [...projectKeys.expenses(projectId), limit],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/expenses?limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch expenses')
      return res.json()
    },
    enabled: !!projectId,
  })
}

/**
 * Hook: Get project settlements
 */
export function useProjectSettlements(projectId: string) {
  return useQuery({
    queryKey: projectKeys.settlements(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/settlements`)
      if (!res.ok) throw new Error('Failed to fetch settlements')
      return res.json()
    },
    enabled: !!projectId,
  })
}

/**
 * Hook: Get family stats
 */
export function useFamilyStats(projectId: string, period?: string) {
  return useQuery({
    queryKey: projectKeys.familyStats(projectId, period),
    queryFn: async () => {
      const url = period
        ? `/api/projects/${projectId}/family-stats?period=${period}`
        : `/api/projects/${projectId}/family-stats`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch family stats')
      return res.json()
    },
    enabled: !!projectId,
  })
}

/**
 * Hook: Delete project mutation
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete project')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate projects list after delete
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

/**
 * Hook: Create expense mutation
 */
export function useCreateExpense(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create expense')
      }
      return res.json()
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.expenses(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.summary(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.settlements(projectId) })
    },
  })
}

/**
 * Hook: Create settlement mutation
 */
export function useCreateSettlement(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/projects/${projectId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create settlement')
      }
      return res.json()
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.summary(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.settlements(projectId) })
    },
  })
}
