import { QueryClient } from '@tanstack/react-query'

/**
 * React Query Configuration
 *
 * Global settings for all queries and mutations in the app
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: داده‌ها تا 5 دقیقه fresh هستند
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache time: داده‌ها تا 10 دقیقه در cache باقی می‌مانند
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime in v4)

      // Refetch on window focus (برای data freshness)
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Retry failed requests 2 times
      retry: 2,

      // Retry delay (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
})
