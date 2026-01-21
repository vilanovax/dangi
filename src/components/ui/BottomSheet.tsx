'use client'

import { cn } from '@/lib/utils/cn'
import { useEffect, useRef } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'absolute bottom-0 left-0 right-0',
          'bg-white dark:bg-gray-900 rounded-t-3xl',
          'max-h-[90vh] overflow-auto',
          'animate-slide-up safe-bottom'
        )}
      >
        {/* Handle */}
        <div className="sticky top-0 bg-inherit pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto" />
          {title && (
            <h2 className="text-lg font-semibold text-center mt-3">{title}</h2>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}
