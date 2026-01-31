'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FamilyIcon } from '../components/FamilyIcon'
import {
  familyTheme,
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'
import { designTokens as dt } from '@/styles/design-tokens'

export default function FamilySettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Header */}
      <div
        className={`text-white shadow-lg sticky top-0 z-10 ${getHeaderGradient('primary')}`}
        style={{ padding: dt.spacing[6] }}
      >
        <div className="flex items-center" style={{ gap: dt.spacing[4] }}>
          <Link
            href={`/project/${projectId}/family`}
            className="text-white hover:bg-white/20 rounded-full transition-colors"
            style={{ padding: dt.spacing[2] }}
          >
            <FamilyIcon name="back" size={20} />
          </Link>
          <div>
            <h1 className="font-bold" style={{ fontSize: dt.typography.sizes.headline }}>
              تنظیمات
            </h1>
            <p className="text-white/90" style={{ marginTop: dt.spacing[1], fontSize: dt.typography.sizes.body }}>
              مدیریت پروژه و تنظیمات
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: dt.spacing[4], paddingBottom: 96, display: 'flex', flexDirection: 'column', gap: dt.spacing[4] }}>
        {/* Settings Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[3] }}>
          {/* Categories Management */}
          <Link
            href={`/project/${projectId}/family/categories`}
            className={`flex items-center justify-between hover:shadow-md transition-all ${getCardBackgroundClass()}`}
            style={{ padding: dt.spacing[5], borderRadius: dt.radius.xl, boxShadow: dt.shadow.card }}
          >
            <div className="flex items-center" style={{ gap: dt.spacing[4] }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: dt.radius.lg,
                  backgroundColor: `${dt.colors.brand.primary}1A`,
                }}
              >
                <FamilyIcon name="categories" size={24} style={{ color: dt.colors.brand.primary }} />
              </div>
              <div>
                <div className={`font-bold ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.bodyLarge }}>
                  مدیریت دسته‌بندی‌ها
                </div>
                <div className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption, marginTop: dt.spacing[1] }}>
                  افزودن و ویرایش دسته‌بندی‌های هزینه و درآمد
                </div>
              </div>
            </div>
            <FamilyIcon name="back" size={20} className={getTextColorClass('secondary')} />
          </Link>

          {/* Members Management */}
          <Link
            href={`/project/${projectId}/participants`}
            className={`flex items-center justify-between hover:shadow-md transition-all ${getCardBackgroundClass()}`}
            style={{ padding: dt.spacing[5], borderRadius: dt.radius.xl, boxShadow: dt.shadow.card }}
          >
            <div className="flex items-center" style={{ gap: dt.spacing[4] }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: dt.radius.lg,
                  backgroundColor: `${dt.colors.semantic.income}1A`,
                }}
              >
                <FamilyIcon name="members" size={24} style={{ color: dt.colors.semantic.income }} />
              </div>
              <div>
                <div className={`font-bold ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.bodyLarge }}>
                  مدیریت اعضا
                </div>
                <div className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption, marginTop: dt.spacing[1] }}>
                  اضافه یا حذف اعضای خانواده
                </div>
              </div>
            </div>
            <FamilyIcon name="back" size={20} className={getTextColorClass('secondary')} />
          </Link>

          {/* Project Settings */}
          <Link
            href={`/project/${projectId}/settings`}
            className={`flex items-center justify-between hover:shadow-md transition-all ${getCardBackgroundClass()}`}
            style={{ padding: dt.spacing[5], borderRadius: dt.radius.xl, boxShadow: dt.shadow.card }}
          >
            <div className="flex items-center" style={{ gap: dt.spacing[4] }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: dt.radius.lg,
                  backgroundColor: `${dt.colors.semantic.info}1A`,
                }}
              >
                <FamilyIcon name="settings" size={24} style={{ color: dt.colors.semantic.info }} />
              </div>
              <div>
                <div className={`font-bold ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.bodyLarge }}>
                  تنظیمات پروژه
                </div>
                <div className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption, marginTop: dt.spacing[1] }}>
                  نام، توضیحات و بایگانی پروژه
                </div>
              </div>
            </div>
            <FamilyIcon name="back" size={20} className={getTextColorClass('secondary')} />
          </Link>

          {/* Backup & Restore */}
          <button
            onClick={() => {
              alert('پشتیبان‌گیری و بازیابی به زودی اضافه خواهد شد')
            }}
            className={`w-full flex items-center justify-between hover:shadow-md transition-all ${getCardBackgroundClass()}`}
            style={{ padding: dt.spacing[5], borderRadius: dt.radius.xl, boxShadow: dt.shadow.card }}
          >
            <div className="flex items-center" style={{ gap: dt.spacing[4] }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: dt.radius.lg,
                  backgroundColor: `${dt.colors.text.secondary}1A`,
                }}
              >
                <FamilyIcon name="backup" size={24} style={{ color: dt.colors.text.secondary }} />
              </div>
              <div className="text-right">
                <div className={`font-bold ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.bodyLarge }}>
                  پشتیبان‌گیری و بازیابی
                </div>
                <div className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption, marginTop: dt.spacing[1] }}>
                  ذخیره و بازگردانی اطلاعات
                </div>
              </div>
            </div>
            <FamilyIcon name="back" size={20} className={getTextColorClass('secondary')} />
          </button>
        </div>

        {/* Info Note */}
        <div
          className={getCardBackgroundClass()}
          style={{ borderRadius: dt.radius.lg, padding: dt.spacing[4], borderWidth: 1, borderColor: dt.colors.border.soft }}
        >
          <div className="flex" style={{ gap: dt.spacing[3] }}>
            <FamilyIcon name="info" size={20} className="flex-shrink-0" style={{ color: dt.colors.semantic.info }} />
            <p className={`leading-relaxed ${getTextColorClass('secondary')}`} style={{ fontSize: dt.typography.sizes.caption }}>
              برخی تنظیمات نیاز به دسترسی مدیریت دارند. اگر عضو پروژه هستید، برای تغییرات مهم با مدیر پروژه هماهنگ کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
