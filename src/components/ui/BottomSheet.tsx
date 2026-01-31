'use client'

import { cn } from '@/lib/utils/cn'
import { useEffect, useRef, useState } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const diff = e.touches[0].clientY - startY
    if (diff > 0) {
      setCurrentY(diff)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    // If dragged down more than 100px, close the sheet
    if (currentY > 100) {
      onClose()
    }
    setCurrentY(0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in backdrop-blur-sm"
        onClick={onClose}
        aria-label="بستن"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'absolute bottom-0 left-0 right-0',
          'bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl',
          'max-h-[90vh] overflow-auto',
          'animate-slide-up safe-bottom transition-transform duration-300 ease-out'
        )}
        style={{
          transform: isDragging ? `translateY(${currentY}px)` : 'translateY(0)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle - Enhanced with better contrast */}
        <div className="sticky top-0 bg-inherit pt-3 pb-2.5 z-10 border-b border-gray-100 dark:border-gray-800 backdrop-blur-sm">
          <div className="w-12 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mx-auto cursor-grab active:cursor-grabbing" />
          {title && (
            <h2 className="text-lg font-bold text-center mt-3 text-gray-900 dark:text-white">{title}</h2>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-4 pt-2">{children}</div>
      </div>
    </div>
  )
}
