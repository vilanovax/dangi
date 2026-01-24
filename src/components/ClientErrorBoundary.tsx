'use client'

import { ErrorBoundary } from './ErrorBoundary'
import type { ReactNode } from 'react'

/**
 * Client-side wrapper for ErrorBoundary to use in server components
 */
export function ClientErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
