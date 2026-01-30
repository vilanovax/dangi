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
      <div className="p-4 space-y-4 pb-24">
        {/* Settings Items */}
        <div className="space-y-3">
          {/* Categories Management */}
          <Link
            href={`/project/${projectId}/family/categories`}
            className={`flex items-center justify-between p-5 rounded-2xl shadow-sm hover:shadow-md transition-all ${getCardBackgroundClass()}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FF8A00]/10">
                <span className="text-2xl">📂</span>
              </div>
              <div>
                <div className={`font-bold text-[15px] ${getTextColorClass('primary')}`}>
                  مدیریت دسته‌بندی‌ها
                </div>
                <div className={`text-xs mt-1 ${getTextColorClass('secondary')}`}>
                  افزودن و ویرایش دسته‌بندی‌های هزینه و درآمد
                </div>
              </div>
            </div>
            <svg className={`w-5 h-5 ${getTextColorClass('secondary')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Members Management */}
          <Link
            href={`/project/${projectId}/participants`}
            className={`flex items-center justify-between p-5 rounded-2xl shadow-sm hover:shadow-md transition-all ${getCardBackgroundClass()}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#22C55E]/10">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <div className={`font-bold text-[15px] ${getTextColorClass('primary')}`}>
                  مدیریت اعضا
                </div>
                <div className={`text-xs mt-1 ${getTextColorClass('secondary')}`}>
                  اضافه یا حذف اعضای خانواده
                </div>
              </div>
            </div>
            <svg className={`w-5 h-5 ${getTextColorClass('secondary')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Project Settings */}
          <Link
            href={`/project/${projectId}/settings`}
            className={`flex items-center justify-between p-5 rounded-2xl shadow-sm hover:shadow-md transition-all ${getCardBackgroundClass()}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#3B82F6]/10">
                <span className="text-2xl">⚙️</span>
              </div>
              <div>
                <div className={`font-bold text-[15px] ${getTextColorClass('primary')}`}>
                  تنظیمات پروژه
                </div>
                <div className={`text-xs mt-1 ${getTextColorClass('secondary')}`}>
                  نام، توضیحات و بایگانی پروژه
                </div>
              </div>
            </div>
            <svg className={`w-5 h-5 ${getTextColorClass('secondary')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Backup & Restore */}
          <button
            onClick={() => {
              alert('پشتیبان‌گیری و بازیابی به زودی اضافه خواهد شد')
            }}
            className={`w-full flex items-center justify-between p-5 rounded-2xl shadow-sm hover:shadow-md transition-all ${getCardBackgroundClass()}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#6B7280]/10">
                <span className="text-2xl">💾</span>
              </div>
              <div className="text-right">
                <div className={`font-bold text-[15px] ${getTextColorClass('primary')}`}>
                  پشتیبان‌گیری و بازیابی
                </div>
                <div className={`text-xs mt-1 ${getTextColorClass('secondary')}`}>
                  ذخیره و بازگردانی اطلاعات
                </div>
              </div>
            </div>
            <svg className={`w-5 h-5 ${getTextColorClass('secondary')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Info Note */}
        <div className={`rounded-xl p-4 border ${getCardBackgroundClass()}`} style={{ borderColor: familyTheme.colors.divider }}>
          <div className="flex gap-3">
            <span className="text-lg flex-shrink-0">ℹ️</span>
            <p className={`text-xs leading-relaxed ${getTextColorClass('secondary')}`}>
              برخی تنظیمات نیاز به دسترسی مدیریت دارند. اگر عضو پروژه هستید، برای تغییرات مهم با مدیر پروژه هماهنگ کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
