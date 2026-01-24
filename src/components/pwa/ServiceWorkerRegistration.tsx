'use client'

import { useEffect } from 'react'

/**
 * Service Worker Registration Component
 *
 * Registers the service worker for PWA functionality.
 * Should be included in the root layout.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                console.log('[PWA] New content available')
                // Could show an update notification here
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error)
      })

    // Handle controller change (when skipWaiting is called)
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  }, [])

  return null
}
