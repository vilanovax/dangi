'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { familyTheme } from '@/styles/family-theme'

export default function FamilySettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  return (
    <div className="min-h-screen" style={{ backgroundColor: familyTheme.colors.background }}>
      {/* Header */}
      <div
        className="text-white p-6 shadow-lg sticky top-0 z-10"
        style={{ background: familyTheme.gradients.primaryHeader }}
      >
        <div className="flex items-center gap-4">
          <Link
            href={`/project/${projectId}/family`}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            →
          </Link>
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: familyTheme.typography.pageTitle.size,
                fontWeight: familyTheme.typography.pageTitle.weight
              }}
            >
              تنظیمات
            </h1>
            <p
              className="text-white/90 mt-1"
              style={{ fontSize: familyTheme.typography.body.size }}
            >
              مدیریت پروژه و تنظیمات
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Coming Soon */}
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            backgroundColor: familyTheme.colors.card,
            boxShadow: familyTheme.card.shadow
          }}
        >
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: familyTheme.colors.primarySoft }}
          >
            <span className="text-5xl">⚙️</span>
          </div>
          <h2
            className="font-bold mb-2"
            style={{
              fontSize: familyTheme.typography.subtitle.size,
              fontWeight: familyTheme.typography.cardNumber.weight,
              color: familyTheme.colors.textPrimary
            }}
          >
            به زودی...
          </h2>
          <p
            style={{
              fontSize: familyTheme.typography.body.size,
              color: familyTheme.colors.textSecondary
            }}
          >
            صفحه تنظیمات در حال ساخت است
          </p>
        </div>

        {/* Quick Links */}
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: familyTheme.colors.card,
            boxShadow: familyTheme.card.shadow
          }}
        >
          <h3
            className="font-bold mb-4"
            style={{
              fontSize: familyTheme.typography.body.size,
              color: familyTheme.colors.textPrimary
            }}
          >
            دسترسی سریع
          </h3>
          <div className="space-y-2">
            <Link
              href={`/project/${projectId}/family/categories`}
              className="flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-colors"
              style={{ backgroundColor: familyTheme.colors.background }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📂</span>
                <div>
                  <div
                    className="font-medium"
                    style={{
                      fontSize: familyTheme.typography.body.size,
                      color: familyTheme.colors.textPrimary
                    }}
                  >
                    دسته‌بندی‌ها
                  </div>
                  <div
                    style={{
                      fontSize: familyTheme.typography.small.size,
                      color: familyTheme.colors.textSecondary
                    }}
                  >
                    مدیریت دسته‌بندی‌های هزینه
                  </div>
                </div>
              </div>
              <span style={{ color: familyTheme.colors.textTertiary }}>←</span>
            </Link>

            <Link
              href={`/project/${projectId}/family/recurring`}
              className="flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-colors"
              style={{ backgroundColor: familyTheme.colors.background }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <div
                    className="font-medium"
                    style={{
                      fontSize: familyTheme.typography.body.size,
                      color: familyTheme.colors.textPrimary
                    }}
                  >
                    تراکنش‌های تکراری
                  </div>
                  <div
                    style={{
                      fontSize: familyTheme.typography.small.size,
                      color: familyTheme.colors.textSecondary
                    }}
                  >
                    هزینه‌ها و درآمدهای دوره‌ای
                  </div>
                </div>
              </div>
              <span style={{ color: familyTheme.colors.textTertiary }}>←</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
