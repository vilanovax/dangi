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
 * Home page header with user profile and settings
 */
export function HomeHeader({ user, onLogout }: HomeHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      {/* Profile */}
      <div className="flex items-center gap-3">
        {user ? (
          <Avatar
            avatar={deserializeAvatar(user.avatar || null, user.name)}
            name={user.name}
            size="lg"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            ؟
          </div>
        )}
        <div>
          {user ? (
            <>
              <p className="font-bold">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone}</p>
            </>
          ) : (
            <>
              <p className="font-semibold">کاربر مهمان</p>
              <Link href="/auth" className="text-xs text-blue-500 hover:text-blue-600">
                ورود / ثبت‌نام
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {user && (
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="خروج"
          >
            <svg
              className="w-5 h-5 text-gray-500"
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
          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-500"
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
    </header>
  )
}
