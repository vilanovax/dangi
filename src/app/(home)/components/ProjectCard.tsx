'use client'

import { useState, useRef, memo, useCallback } from 'react'
import Link from 'next/link'
import { formatMoney } from '@/lib/utils/money'
import { BottomSheet, Button } from '@/components/ui'

interface ProjectCardProps {
  id: string
  name: string
  template: string
  templateName: string
  templateIcon: string
  participantCount: number
  expenseCount: number
  totalExpenses: number
  myBalance: number
  currency: string
  isArchived?: boolean
  onDelete?: (id: string) => void
  onExport?: (id: string) => void
  onArchive?: (id: string, isArchived: boolean) => void
  onProjectClick?: (id: string) => void
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

/**
 * Status-first project card design
 *
 * UX Intent:
 * - Status is the hero element (most prominent)
 * - Template-based gradient backgrounds
 * - Clear visual hierarchy: Status > Balance > Total > Meta
 * - Friendly, non-accounting tone
 *
 * Performance:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - Callbacks wrapped with useCallback
 */
export const ProjectCard = memo(function ProjectCard({
  id,
  name,
  template,
  templateName,
  templateIcon,
  participantCount,
  expenseCount,
  totalExpenses,
  myBalance,
  currency,
  isArchived = false,
  onDelete,
  onExport,
  onArchive,
  onProjectClick,
  isDragging,
  dragHandleProps,
}: ProjectCardProps) {
  // Status logic
  const isSettled = myBalance === 0
  const isDebtor = myBalance < 0

  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const handleLongPressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true)
    }, 500)
  }, [])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleBackupAndDelete = useCallback(async () => {
    setBackingUp(true)
    try {
      // 1. دانلود بک‌آپ
      const backupRes = await fetch(`/api/projects/${id}/backup`)
      if (backupRes.ok) {
        const blob = await backupRes.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${name.replace(/[^a-zA-Z0-9-_\u0600-\u06FF]/g, '_')}_backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // 2. حذف پروژه بعد از بک‌آپ موفق
        setBackingUp(false)
        setDeleting(true)
        const deleteRes = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
        if (deleteRes.ok) {
          setShowDeleteConfirm(false)
          setShowMenu(false)
          onDelete?.(id)
        }
      }
    } catch (error) {
      console.error('Error backing up and deleting project:', error)
    } finally {
      setBackingUp(false)
      setDeleting(false)
    }
  }, [id, name, onDelete])

  const handleDelete = useCallback(async () => {
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
  }, [id, onDelete])

  const handleExport = useCallback(async () => {
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
  }, [id, name, onExport])

  const handleArchive = useCallback(async () => {
    setArchiving(true)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !isArchived })
      })
      if (res.ok) {
        setShowArchiveConfirm(false)
        setShowMenu(false)
        onArchive?.(id, !isArchived)
      }
    } catch (error) {
      console.error('Error archiving project:', error)
    } finally {
      setArchiving(false)
    }
  }, [id, isArchived, onArchive])

  // Template-based gradient mapping
  const getTemplateGradient = useCallback(() => {
    const gradients: Record<string, string> = {
      travel: 'from-sky-400/10 via-blue-500/10 to-cyan-500/10',
      building: 'from-purple-400/10 via-pink-500/10 to-rose-500/10',
      gathering: 'from-amber-400/10 via-orange-500/10 to-yellow-500/10',
      personal: 'from-emerald-400/10 via-teal-500/10 to-cyan-500/10',
      family: 'from-amber-400/10 via-orange-500/10 to-red-500/10',
    }
    return gradients[template] || gradients.travel
  }, [template])

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

        <Link href={`/project/${id}`} onClick={() => onProjectClick?.(id)}>
          <div className={`relative overflow-hidden bg-gradient-to-br ${getTemplateGradient()} bg-white dark:bg-gray-900 backdrop-blur-xl rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-500 active:scale-[0.98] border border-white/50 dark:border-gray-800/50`}>
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 rounded-full blur-2xl -translate-y-1/2 -translate-x-1/2" />

            {/* Top Row: Title + Template Badge */}
            <div className="relative flex items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight flex-1">
                {name}
              </h3>

              {/* Template Badge */}
              <div className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 flex items-center gap-1.5">
                <span className="text-base">{templateIcon}</span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{templateName}</span>
              </div>

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

            {/* Balance Text (if not settled) */}
            {!isSettled && (
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {isDebtor ? (
                  <span className="text-red-600 dark:text-red-400">
                    {formatMoney(Math.abs(myBalance), currency)} بدهکاری
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatMoney(myBalance, currency)} طلبکاری
                  </span>
                )}
              </p>
            )}

            {/* Bottom Row: Total Expenses + Meta */}
            <div className="relative flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
              {/* Total Expenses (Secondary) */}
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">مجموع خرج‌ها</p>
                <p className="text-base font-bold text-gray-700 dark:text-gray-200 mt-0.5">
                  {formatMoney(totalExpenses, currency)}
                </p>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{participantCount} نفر</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{expenseCount} خرج</span>
                </div>
              </div>
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

          {/* Archive/Unarchive */}
          <button
            onClick={() => {
              setShowMenu(false)
              setShowArchiveConfirm(true)
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                {isArchived ? 'فعال‌سازی پروژه' : 'آرشیو پروژه'}
              </p>
              <p className="text-sm text-amber-600/70 dark:text-amber-400/70">
                {isArchived ? 'بازگشت به پروژه‌های فعال' : 'انتقال به آرشیو'}
              </p>
            </div>
            <svg className="w-5 h-5 text-amber-300 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

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
            <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-3">
              این عمل غیرقابل بازگشت است و تمام هزینه‌ها و اطلاعات حذف خواهند شد.
            </p>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 <strong>پیشنهاد:</strong> قبل از حذف، بک‌آپ بگیرید تا بتوانید در صورت نیاز پروژه را بازگردانی کنید.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {/* بک‌آپ و حذف (پیشنهادی) */}
            <Button
              onClick={handleBackupAndDelete}
              loading={backingUp || deleting}
              disabled={backingUp || deleting}
              className="w-full !bg-gradient-to-r !from-blue-500 !to-indigo-600 hover:!from-blue-600 hover:!to-indigo-700"
            >
              {backingUp ? (
                <>
                  <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  در حال دانلود بک‌آپ...
                </>
              ) : deleting ? (
                'در حال حذف...'
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  بک‌آپ و حذف (پیشنهادی)
                </>
              )}
            </Button>

            {/* فقط حذف */}
            <Button
              onClick={handleDelete}
              loading={deleting && !backingUp}
              disabled={backingUp || deleting}
              variant="secondary"
              className="w-full !text-red-600 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20"
            >
              فقط حذف کن
            </Button>

            {/* انصراف */}
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={backingUp || deleting}
              className="w-full"
            >
              انصراف
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Archive Confirmation */}
      <BottomSheet
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        title={isArchived ? 'فعال‌سازی پروژه' : 'آرشیو پروژه'}
      >
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl text-center border border-amber-500/20">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <p className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">
              {isArchived ? `فعال‌سازی "${name}"؟` : `آرشیو "${name}"؟`}
            </p>
            <p className="text-sm text-amber-600/70 dark:text-amber-400/70">
              {isArchived
                ? 'این پروژه به لیست پروژه‌های فعال منتقل می‌شود.'
                : 'این پروژه از لیست پروژه‌های فعال حذف و به آرشیو منتقل می‌شود. می‌توانید در هر زمان آن را فعال کنید.'}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowArchiveConfirm(false)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleArchive}
              loading={archiving}
              className="flex-1 !bg-gradient-to-r !from-amber-500 !to-orange-600 hover:!from-amber-600 hover:!to-orange-700"
            >
              {isArchived ? 'فعال‌سازی' : 'آرشیو کردن'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
})
