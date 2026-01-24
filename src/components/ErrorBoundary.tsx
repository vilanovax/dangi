'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component to catch React errors and show fallback UI
 * Must be a class component as React doesn't support error boundaries in function components yet
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }

    // TODO: Send to error reporting service (Sentry, etc.)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              خطایی رخ داد
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              متاسفانه یه مشکلی پیش اومد. لطفاً دوباره تلاش کنید.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  جزئیات خطا (فقط در حالت توسعه)
                </summary>
                <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="secondary">
                تلاش مجدد
              </Button>
              <Button onClick={() => window.location.href = '/'}>
                بازگشت به خانه
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Simpler error fallback for smaller sections
 */
export function SimpleErrorFallback({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="p-6 text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
        <span className="text-2xl">⚠️</span>
      </div>
      <p className="text-sm text-red-600 dark:text-red-400 mb-3">
        خطا در بارگذاری اطلاعات
      </p>
      <Button onClick={reset} size="sm" variant="secondary">
        تلاش مجدد
      </Button>
    </div>
  )
}
