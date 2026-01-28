'use client'

import Link from 'next/link'
import { BottomSheet, Button } from '@/components/ui'

interface ProfileMenuProps {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
  userName?: string
}

/**
 * Profile menu with settings and logout options
 *
 * UX Intent:
 * - Simple, clean menu
 * - Clear action hierarchy: Settings > Logout
 * - Friendly tone
 */
export function ProfileMenu({ isOpen, onClose, onLogout }: ProfileMenuProps) {
  const handleLogout = () => {
    onClose()
    onLogout()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="تنظیمات و خروج">
      <div className="space-y-3">
        {/* Settings */}
        <Link href="/settings" onClick={onClose}>
          <div className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-500/5 to-slate-500/5 hover:from-gray-500/10 hover:to-slate-500/10 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-lg shadow-gray-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="font-semibold text-gray-800 dark:text-gray-100">تنظیمات برنامه</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">پروفایل، زبان و تنظیمات</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-500/5 to-rose-500/5 hover:from-red-500/10 hover:to-rose-500/10 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div className="flex-1 text-right">
            <p className="font-semibold text-red-600 dark:text-red-400">خروج از حساب</p>
            <p className="text-sm text-red-500/70">قطع ارتباط از دنگی</p>
          </div>
          <svg className="w-5 h-5 text-red-300 group-hover:text-red-400 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </BottomSheet>
  )
}
