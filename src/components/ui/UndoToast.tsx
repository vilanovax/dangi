'use client'

import { useEffect, useState } from 'react'
import { Button } from './Button'

interface UndoToastProps {
  isOpen: boolean
  onUndo: () => void
  onDismiss: () => void
  onAutoConfirm: () => void
  message: string
  duration?: number // milliseconds
}

/**
 * Toast notification with countdown timer and undo action
 * Used for 30-second undo window after settlement creation
 */
export function UndoToast({
  isOpen,
  onUndo,
  onDismiss,
  onAutoConfirm,
  message,
  duration = 30000, // 30 seconds
}: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(duration / 1000)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeLeft(duration / 1000)

      // Countdown timer
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            // Auto-confirm settlement
            onAutoConfirm()
            // Dismiss toast
            setTimeout(() => {
              setIsVisible(false)
              setTimeout(onDismiss, 300) // Wait for exit animation
            }, 100)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setIsVisible(false)
    }
  }, [isOpen, duration, onAutoConfirm, onDismiss])

  const handleUndo = () => {
    setIsVisible(false)
    setTimeout(() => {
      onUndo()
      onDismiss()
    }, 300) // Wait for exit animation
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for exit animation
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-gray-700">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Message and Timer */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            بازگشت تا {timeLeft} ثانیه دیگر
          </p>
        </div>

        {/* Undo Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUndo}
          className="flex-shrink-0 !bg-white/10 hover:!bg-white/20 !text-white border-none"
        >
          بازگشت
        </Button>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="بستن"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-800 rounded-b-2xl overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / (duration / 1000)) * 100}%` }}
        />
      </div>
    </div>
  )
}
