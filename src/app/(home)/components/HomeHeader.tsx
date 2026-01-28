'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'
import { ProfileMenu } from './ProfileMenu'

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
 * Modern home page header with new microcopy
 *
 * UX Intent:
 * - Friendly greeting
 * - Clear subtitle: "اینجا همه پروژه‌هات رو یه‌جا می‌بینی"
 * - ProfileMenu for settings + logout
 */
export function HomeHeader({ user, onLogout }: HomeHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  return (
    <>
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
                    اینجا همه پروژه‌هات رو یه‌جا می‌بینی
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
          {user && (
            <button
              onClick={() => setShowProfileMenu(true)}
              className="p-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group"
              title="منو"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Profile Menu */}
      <ProfileMenu
        isOpen={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        onLogout={onLogout}
        userName={user?.name}
      />
    </>
  )
}
