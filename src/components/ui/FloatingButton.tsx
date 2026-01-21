'use client'

import { cn } from '@/lib/utils/cn'
import { ButtonHTMLAttributes } from 'react'

interface FloatingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
}

export function FloatingButton({ className, icon, children, ...props }: FloatingButtonProps) {
  return (
    <button
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2',
        'flex items-center gap-2 px-6 py-3',
        'bg-blue-500 text-white rounded-full shadow-lg',
        'hover:bg-blue-600 active:scale-95 transition-all',
        'safe-bottom',
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
