'use client'

import { useOnlineStatus } from '@/hooks'

/**
 * Offline Banner Component
 *
 * Shows a persistent banner when the user is offline.
 * Automatically hides when back online.
 */
export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus()

  // Show "back online" message briefly
  if (wasOffline && isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white text-center py-2 px-4 text-sm animate-fade-in safe-top">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>آنلاین شدی! ✨</span>
        </div>
      </div>
    )
  }

  // Show offline warning
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 px-4 text-sm safe-top">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <span>آفلاینی - تغییرات ذخیره نمی‌شن</span>
        </div>
      </div>
    )
  }

  return null
}
