'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AccessBadge } from '@/components/ui'
import type { AccessScope } from '@/types/access-link'
import { getTemplateByRole, ACCESS_LINK_TEMPLATES } from '@/types/access-link'
import { canCreate, canRead, canJoinAsMember } from '@/lib/utils/permissions'

interface Project {
  id: string
  name: string
  description: string | null
  template: string
  currency: string
}

interface ValidationResult {
  project: Project
  scopes: AccessScope[]
  expiresAt: string | null
  linkName: string | null
  linkDescription: string | null
}

/**
 * Public Access Page
 * Allows users to access projects via access link tokens
 */
export default function AccessPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  useEffect(() => {
    if (token) {
      validateAndAccessLink()
    }
  }, [token])

  const validateAndAccessLink = async () => {
    setLoading(true)
    setError('')

    try {
      // Access the project via link (sets cookie and validates)
      const res = await fetch(`/api/access/${token}`)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'دسترسی رد شد')
      }

      const data = await res.json()
      setValidation(data)

      // For invite links with member:join scope, automatically redirect to project
      if (canJoinAsMember(data.scopes)) {
        // TODO: In future, handle auto-join for authenticated users
        // For now, just show the join form
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دسترسی به لینک')
    } finally {
      setLoading(false)
    }
  }

  const handleViewProject = () => {
    if (validation) {
      router.push(`/project/${validation.project.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">در حال بررسی دسترسی...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              دسترسی رد شد
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                بازگشت به صفحه اصلی
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                لینک ممکن است منقضی شده، غیرفعال یا حداکثر تعداد استفاده را داشته باشد
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!validation) {
    return null
  }

  // Determine access type from scopes
  const isReadOnly = canRead(validation.scopes, 'expenses') && !canCreate(validation.scopes, 'expenses')
  const isContributor = canCreate(validation.scopes, 'expenses')
  const isInvite = canJoinAsMember(validation.scopes)

  // Find matching template
  let accessType: 'viewer' | 'contributor' | 'admin' = 'viewer'
  let accessTemplate = ACCESS_LINK_TEMPLATES.find((t) => t.id === 'read-only')

  if (isInvite) {
    accessType = 'admin'
    accessTemplate = ACCESS_LINK_TEMPLATES.find((t) => t.id === 'invite-member')
  } else if (isContributor) {
    accessType = 'contributor'
    accessTemplate = ACCESS_LINK_TEMPLATES.find((t) => t.id === 'guest-contributor')
  }

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header with Access Badge */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Access Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{accessTemplate?.icon}</span>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {validation.linkName || accessTemplate?.namePersian}
              </h1>
              <AccessBadge type={accessType} size="sm" />
            </div>
          </div>

          {/* Access Limitation Banner */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  محدودیت دسترسی
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {accessTemplate?.descriptionPersian}
                </p>
                {validation.expiresAt && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    تا {new Date(validation.expiresAt).toLocaleDateString('fa-IR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {validation.project.name}
          </h2>
          {validation.project.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {validation.project.description}
            </p>
          )}
          {validation.linkDescription && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              💬 {validation.linkDescription}
            </p>
          )}
        </div>

        {/* Access Options */}
        <div className="space-y-4">
          {isInvite ? (
            // Invite Link: Show join information
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">👥</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  دعوت به عضویت
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  با پذیرش این دعوت، به عنوان عضو کامل به پروژه اضافه می‌شوید
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleViewProject}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                >
                  پذیرش دعوت و ورود به پروژه
                </button>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    💡 پس از پذیرش دعوت، دسترسی کامل به پروژه خواهید داشت
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Read-only or Contributor: Show view project button
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                دسترسی به پروژه
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleViewProject}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  مشاهده پروژه
                </button>

                {/* Sign up CTA */}
                <button
                  onClick={() => router.push(`/auth?returnTo=/project/${validation.project.id}&mode=signup`)}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                >
                  ثبت‌نام و ذخیره این پروژه
                </button>

                {/* Permissions List */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    دسترسی‌های شما:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {canRead(validation.scopes, 'expenses') && (
                      <li>• مشاهده خرج‌ها</li>
                    )}
                    {canCreate(validation.scopes, 'expenses') && (
                      <li>• افزودن خرج جدید</li>
                    )}
                    {canRead(validation.scopes, 'settlements') && (
                      <li>• مشاهده تسویه‌ها</li>
                    )}
                    {canRead(validation.scopes, 'summary') && (
                      <li>• مشاهده خلاصه حساب</li>
                    )}
                  </ul>
                </div>

                {/* Helper text */}
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    💡 با ساخت حساب، این پروژه به لیست پروژه‌هات اضافه می‌شه و بعداً هم می‌تونی بهش دسترسی داشته باشی
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* What you can't do */}
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              ⚠️ محدودیت‌ها:
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {!canCreate(validation.scopes, 'expenses') && (
                <li>• نمی‌توانید خرج جدید ثبت کنید</li>
              )}
              {!canCreate(validation.scopes, 'settlements') && (
                <li>• نمی‌توانید تسویه حساب ثبت کنید</li>
              )}
              <li>• نمی‌توانید تنظیمات پروژه را تغییر دهید</li>
              <li>• نمی‌توانید اعضا را مدیریت کنید</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            دسترسی از طریق لینک اشتراک • می‌تونی بدون ثبت‌نام مشاهده کنی یا ثبت‌نام کنی و پروژه رو ذخیره کنی
          </p>
        </div>
      </div>
    </main>
  )
}
