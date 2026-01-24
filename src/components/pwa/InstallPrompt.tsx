'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * PWA Install Prompt Component
 *
 * Shows a banner when the app can be installed.
 * Handles the beforeinstallprompt event and provides
 * a native-like install experience.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(iOS)

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const now = new Date()
      // Show again after 7 days
      if (now.getTime() - dismissedDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Show iOS prompt after a delay if not standalone
    if (iOS && !standalone) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
    }

    setDeferredPrompt(null)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
  }, [])

  // Don't show if already installed
  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up safe-bottom">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">د</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white">
              نصب اپلیکیشن دنگی
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isIOS
                ? 'برای نصب، روی دکمه Share بزن و "Add to Home Screen" رو انتخاب کن'
                : 'نصب کن تا سریع‌تر و آفلاین هم کار کنه'}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="p-1 -mt-1 -mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="بستن"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* iOS Instructions */}
        {isIOS && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>
              <strong>Share</strong> → <strong>Add to Home Screen</strong>
            </span>
          </div>
        )}

        {/* Install Button (non-iOS) */}
        {!isIOS && deferredPrompt && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              onClick={handleDismiss}
              className="flex-1"
            >
              بعداً
            </Button>
            <Button
              onClick={handleInstall}
              className="flex-1 !bg-blue-500 hover:!bg-blue-600"
            >
              نصب
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
