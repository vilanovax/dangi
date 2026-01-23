'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { formatMoney } from '@/lib/utils/money'
import { BottomSheet, Button } from '@/components/ui'

interface ProjectCardProps {
  id: string
  name: string
  templateIcon: string
  participantCount: number
  expenseCount: number
  totalExpenses: number
  myBalance: number
  currency: string
  onDelete?: (id: string) => void
  onExport?: (id: string) => void
  // Drag & Drop
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

/**
 * Project card with stats, total expenses and balance
 */
export function ProjectCard({
  id,
  name,
  templateIcon,
  participantCount,
  expenseCount,
  totalExpenses,
  myBalance,
  currency,
  onDelete,
  onExport,
  isDragging,
  dragHandleProps,
}: ProjectCardProps) {
  const isCreditor = myBalance > 0
  const isDebtor = myBalance < 0
  const isSettled = myBalance === 0

  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true)
    }, 500) // 500ms for long press
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setShowDeleteConfirm(false)
        setShowMenu(false)
        onDelete?.(id)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/export`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dangi-backup-${name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setShowMenu(false)
        onExport?.(id)
      }
    } catch (error) {
      console.error('Error exporting project:', error)
    }
  }

  return (
    <>
      <div
        className={`relative ${isDragging ? 'opacity-50 scale-105' : ''} transition-all`}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
      >
        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
          >
            <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
            </svg>
          </div>
        )}

        <Link href={`/project/${id}`}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-2xl flex-shrink-0">
                {templateIcon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{name}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {participantCount} نفر
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    {expenseCount} هزینه
                  </span>
                </div>
              </div>

              {/* Menu Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowMenu(true)
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              {/* Total */}
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">مجموع هزینه‌ها</p>
                <p className="font-bold text-sm">{formatMoney(totalExpenses, currency)}</p>
              </div>

              {/* Balance Badge */}
              {isSettled ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">تسویه شده</span>
                </div>
              ) : isCreditor ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">
                    {formatMoney(myBalance, currency)} طلب
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20">
                  <svg className="w-4 h-4 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                  <span className="text-xs font-bold text-red-500 dark:text-red-400">
                    {formatMoney(Math.abs(myBalance), currency)} بدهی
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Project Menu */}
      <BottomSheet isOpen={showMenu} onClose={() => setShowMenu(false)} title={name}>
        <div className="space-y-2">
          {/* Export/Backup */}
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="font-medium">بک‌آپ / اکسپورت</p>
              <p className="text-xs text-gray-500">دانلود فایل JSON از پروژه</p>
            </div>
          </button>

          {/* Settings */}
          <Link href={`/project/${id}/settings`} onClick={() => setShowMenu(false)}>
            <div className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 text-right">
                <p className="font-medium">تنظیمات پروژه</p>
                <p className="text-xs text-gray-500">ویرایش نام و تنظیمات</p>
              </div>
            </div>
          </Link>

          {/* Delete */}
          <button
            onClick={() => {
              setShowMenu(false)
              setShowDeleteConfirm(true)
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="font-medium text-red-600">حذف پروژه</p>
              <p className="text-xs text-red-500/70">حذف کامل پروژه و تمام اطلاعات</p>
            </div>
          </button>
        </div>
      </BottomSheet>

      {/* Delete Confirmation */}
      <BottomSheet isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="حذف پروژه">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-800 dark:text-red-200 font-medium">
              آیا مطمئن هستید که می‌خواهید پروژه "{name}" را حذف کنید؟
            </p>
            <p className="text-red-600/70 text-sm mt-2">
              این عمل غیرقابل بازگشت است و تمام هزینه‌ها و اطلاعات حذف خواهند شد.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleDelete}
              loading={deleting}
              className="flex-1 !bg-red-500 hover:!bg-red-600"
            >
              حذف پروژه
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
