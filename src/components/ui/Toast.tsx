'use client'

import { useEffect } from 'react'

interface ToastProps {
  isOpen: boolean
  onClose: () => void
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

/**
 * Simple toast notification component
 *
 * UX Principle: Feedback = Reassurance
 * Users should always know if their action succeeded or failed
 */
export function Toast({
  isOpen,
  onClose,
  message,
  type = 'info',
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const styles = {
    success: {
      bg: 'bg-green-500',
      icon: '✓',
    },
    error: {
      bg: 'bg-red-500',
      icon: '✕',
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ',
    },
  }

  const currentStyle = styles[type]

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div
        className={`${currentStyle.bg} text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 min-w-[200px] max-w-[90vw]`}
      >
        <span className="text-lg font-bold flex-shrink-0">{currentStyle.icon}</span>
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}
