'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  familyTheme,
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'

export default function FamilySettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Header */}
      <div className={`text-white p-6 shadow-lg sticky top-0 z-10 ${getHeaderGradient('primary')}`}>
        <div className="flex items-center gap-4">
          <Link
            href={`/project/${projectId}/family`}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            →
          </Link>
          <div>
            <h1 className="text-[22px] font-bold">
              تنظیمات
            </h1>
            <p className="text-white/90 mt-1 text-sm">
              مدیریت پروژه و تنظیمات
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Coming Soon */}
        <div className={`rounded-2xl p-12 text-center shadow-lg ${getCardBackgroundClass()}`}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-[#FFF3E0] dark:bg-[#2D1F0D]">
            <span className="text-5xl">⚙️</span>
          </div>
          <h2 className={`text-[15px] font-bold mb-2 ${getTextColorClass('primary')}`}>
            به زودی...
          </h2>
          <p className={`text-sm ${getTextColorClass('secondary')}`}>
            صفحه تنظیمات در حال ساخت است
          </p>
        </div>

        {/* Quick Links */}
        <div className={`rounded-2xl p-5 shadow-lg ${getCardBackgroundClass()}`}>
          <h3 className={`text-sm font-bold mb-4 ${getTextColorClass('primary')}`}>
            دسترسی سریع
          </h3>
          <div className="space-y-2">
            <Link
              href={`/project/${projectId}/family/categories`}
              className={`flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-colors ${getBackgroundClass()}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📂</span>
                <div>
                  <div className={`font-medium text-sm ${getTextColorClass('primary')}`}>
                    دسته‌بندی‌ها
                  </div>
                  <div className={`text-xs ${getTextColorClass('secondary')}`}>
                    مدیریت دسته‌بندی‌های هزینه
                  </div>
                </div>
              </div>
              <span className={getTextColorClass('secondary')}>←</span>
            </Link>

            <Link
              href={`/project/${projectId}/family/recurring`}
              className={`flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-colors ${getBackgroundClass()}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <div className={`font-medium text-sm ${getTextColorClass('primary')}`}>
                    تراکنش‌های تکراری
                  </div>
                  <div className={`text-xs ${getTextColorClass('secondary')}`}>
                    هزینه‌ها و درآمدهای دوره‌ای
                  </div>
                </div>
              </div>
              <span className={getTextColorClass('secondary')}>←</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
