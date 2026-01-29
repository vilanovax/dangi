'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'
import { ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * React Query Provider
 *
 * Wraps the app with QueryClientProvider for data fetching, caching, and state management
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - فقط در development mode */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  )
}
