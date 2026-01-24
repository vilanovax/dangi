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
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

/**
 * Modern project card with glassmorphism and gradient effects
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
    }, 500)
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

  // Generate unique gradient based on project name
  const getProjectGradient = () => {
    const gradients = [
      'from-blue-500/10 to-indigo-500/10',
      'from-emerald-500/10 to-teal-500/10',
      'from-orange-500/10 to-amber-500/10',
      'from-pink-500/10 to-rose-500/10',
      'from-violet-500/10 to-purple-500/10',
      'from-cyan-500/10 to-sky-500/10',
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return gradients[hash % gradients.length]
  }

  const getIconGradient = () => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-orange-500 to-amber-600',
      'from-pink-500 to-rose-600',
      'from-violet-500 to-purple-600',
      'from-cyan-500 to-sky-600',
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return gradients[hash % gradients.length]
  }

  return (
    <>
      <div
        className={`relative group ${isDragging ? 'opacity-50 scale-[1.02] z-50' : ''} transition-all duration-300`}
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
          <div className={`relative overflow-hidden bg-gradient-to-br ${getProjectGradient()} bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-500 active:scale-[0.98] border border-white/50 dark:border-gray-800/50`}>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative flex items-start gap-4">
              {/* Icon with Gradient Background */}
              <div className="relative flex-shrink-0">
                <div className={`absolute inset-0 bg-gradient-to-br ${getIconGradient()} rounded-2xl blur-lg opacity-40`} />
                <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${getIconGradient()} flex items-center justify-center text-3xl shadow-lg`}>
                  {templateIcon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {name}
                  </h3>

                  {/* Menu Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowMenu(true)
                    }}
                    className="p-2 -m-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>{participantCount} نفر</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span>{expenseCount} هزینه</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Stats */}
            <div className="relative flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              {/* Total Expenses */}
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">مجموع هزینه‌ها</p>
                <p className="text-base font-bold text-gray-700 dark:text-gray-200">
                  {formatMoney(totalExpenses, currency)}
                </p>
              </div>

              {/* Balance Badge */}
              {isSettled ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">حسابا صافه</span>
                </div>
              ) : isCreditor ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(myBalance, currency)} طلب داری
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-red-500 dark:text-red-400">
                    باید {formatMoney(Math.abs(myBalance), currency)} بدی
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
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 hover:from-blue-500/10 hover:to-indigo-500/10 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="font-semibold text-gray-800 dark:text-gray-100">بک‌آپ / اکسپورت</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">دانلود فایل JSON از پروژه</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Settings */}
          <Link href={`/project/${id}/settings`} onClick={() => setShowMenu(false)}>
            <div className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-500/5 to-slate-500/5 hover:from-gray-500/10 hover:to-slate-500/10 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-lg shadow-gray-500/25 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-100">تنظیمات پروژه</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ویرایش نام و تنظیمات</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </Link>

          {/* Delete */}
          <button
            onClick={() => {
              setShowMenu(false)
              setShowDeleteConfirm(true)
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-500/5 to-rose-500/5 hover:from-red-500/10 hover:to-rose-500/10 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="font-semibold text-red-600 dark:text-red-400">حذف پروژه</p>
              <p className="text-sm text-red-500/70">حذف کامل پروژه و تمام اطلاعات</p>
            </div>
            <svg className="w-5 h-5 text-red-300 group-hover:text-red-400 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </BottomSheet>

      {/* Delete Confirmation */}
      <BottomSheet isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="حذف پروژه">
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-3xl text-center border border-red-500/20">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center shadow-xl shadow-red-500/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
              حذف "{name}"؟
            </p>
            <p className="text-sm text-red-600/70 dark:text-red-400/70">
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
              className="flex-1 !bg-gradient-to-r !from-red-500 !to-rose-600 hover:!from-red-600 hover:!to-rose-700"
            >
              حذف پروژه
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
