'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'

/**
 * Offline Fallback Page
 *
 * Shown when the user is offline and the requested page
 * is not cached by the service worker.
 */
export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  // If back online, show different message
  if (isOnline) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-950">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          آنلاین شدی! 🎉
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          حالا می‌تونی ادامه بدی
        </p>
        <Button onClick={handleRetry}>
          بازگشت به اپلیکیشن
        </Button>
      </main>
    )
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-950">
      {/* Offline Icon */}
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 relative">
        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
        {/* X overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-0.5 bg-red-500 transform rotate-45 translate-y-1"></div>
        </div>
      </div>

      {/* Message */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        آفلاینی! 📴
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-sm">
        اتصال به اینترنت نداری. لطفاً اتصالت رو چک کن.
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
        صفحاتی که قبلاً دیدی، هنوز کار می‌کنن
      </p>

      {/* Actions */}
      <div className="space-y-3 w-full max-w-xs">
        <Button onClick={handleRetry} className="w-full">
          تلاش مجدد
        </Button>
        <Button
          variant="secondary"
          onClick={() => window.history.back()}
          className="w-full"
        >
          بازگشت به صفحه قبل
        </Button>
      </div>

      {/* Tips */}
      <div className="mt-10 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl max-w-sm">
        <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
          💡 نکته
        </h3>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          صفحاتی که قبلاً باز کردی، حتی وقتی آفلاینی هم قابل دسترسی‌ان.
          فقط کافیه به اون صفحات برگردی.
        </p>
      </div>
    </main>
  )
}
