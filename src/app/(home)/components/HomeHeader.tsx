'use client'

import Link from 'next/link'
import { Avatar } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'

interface User {
  id: string
  name: string
  phone: string
  avatar?: string | null
}

interface HomeHeaderProps {
  user: User | null
  onLogout: () => void
}

/**
 * Modern home page header with glassmorphism design
 */
export function HomeHeader({ user, onLogout }: HomeHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        {/* Profile Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-md opacity-50 animate-pulse" />
              <Avatar
                avatar={deserializeAvatar(user.avatar || null, user.name)}
                name={user.name}
                size="lg"
                className="relative ring-2 ring-white/50 dark:ring-gray-800/50"
              />
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-md opacity-40" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/25">
                ?
              </div>
            </div>
          )}

          <div className="flex flex-col">
            {user ? (
              <>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  سلام {user.name} 👋
                </p>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  اینجا پروژه‌هات رو مدیریت می‌کنی
                </span>
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-700 dark:text-gray-200">کاربر مهمان</p>
                <Link
                  href="/auth"
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 group"
                >
                  ورود / ثبت‌نام
                  <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={onLogout}
              className="p-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group"
              title="خروج"
            >
              <svg
                className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          )}
          <Link
            href="/settings"
            className="p-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <svg
              className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  )
}
