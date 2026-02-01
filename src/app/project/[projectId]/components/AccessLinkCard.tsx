'use client'

import { useState } from 'react'
import { AccessBadge } from '@/components/ui'
import type { ProjectAccessLink } from '@/types/access-link'
import { getLinkStatus, getLinkStatusLabel, getTemplateByRole } from '@/types/access-link'

interface AccessLinkCardProps {
  link: ProjectAccessLink
  onCopy: (link: ProjectAccessLink) => void
  onEdit: (link: ProjectAccessLink) => void
  onToggle: (link: ProjectAccessLink) => void
  onDelete: (link: ProjectAccessLink) => void
}

/**
 * Access Link Card Component
 * Displays an access link with actions (copy, edit, toggle, delete)
 */
export function AccessLinkCard({ link, onCopy, onEdit, onToggle, onDelete }: AccessLinkCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const status = getLinkStatus(link)
  const statusLabel = getLinkStatusLabel(link)
  const template = getTemplateByRole(link.role || 'viewer')

  const handleCopy = () => {
    onCopy(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggle = () => {
    setShowMenu(false)
    onToggle(link)
  }

  const handleDelete = () => {
    setShowMenu(false)
    if (confirm('آیا از حذف این لینک اطمینان دارید؟')) {
      onDelete(link)
    }
  }

  const isActive = status === 'active'

  return (
    <div
      className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 transition-all ${
        isActive
          ? 'border-gray-200 dark:border-gray-800'
          : 'border-gray-100 dark:border-gray-800/50 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xl">
          {template?.icon || '🔗'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name & Badge */}
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white flex-1 truncate">
              {link.name || template?.namePersian || 'لینک دسترسی'}
            </h3>
            {link.role && <AccessBadge type={link.role} size="sm" />}
          </div>

          {/* Status & Usage */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span className={isActive ? 'text-green-600 dark:text-green-400' : ''}>
              {statusLabel}
            </span>
            <span>•</span>
            <span>
              {link.usedCount} / {link.maxUses || '∞'} استفاده
            </span>
            {link.expiresAt && (
              <>
                <span>•</span>
                <span>
                  انقضا:{' '}
                  {new Date(link.expiresAt).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          {link.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
              {link.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="کپی لینک"
          >
            {copied ? (
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="بیشتر"
            >
              <svg
                className="w-5 h-5 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />

                {/* Menu */}
                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[160px]">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      onEdit(link)
                    }}
                    className="w-full px-4 py-2.5 text-right text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    ویرایش
                  </button>

                  <button
                    onClick={handleToggle}
                    className="w-full px-4 py-2.5 text-right text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2"
                    >
                    {isActive ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        غیرفعال‌سازی
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        فعال‌سازی
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2.5 text-right text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    حذف
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
