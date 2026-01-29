/**
 * Checklist Template System - Type Definitions
 * Defines types for hardcoded checklist templates
 */

export type ChecklistCategoryId = 'travel' | 'gathering' | 'personal-finance'

/**
 * Item in a checklist template
 */
export interface ChecklistTemplateItem {
  text: string // متن آیتم (مثلاً "خرید شیر")
  note?: string // یادداشت اختیاری (مثلاً "2 لیتری")
  isChecked?: boolean // پیش‌فرض checked (معمولاً false)
}

/**
 * A single checklist template
 */
export interface ChecklistTemplate {
  id: string // شناسه منحصر به فرد (مثلاً "travel-supplies")
  title: string // عنوان فارسی (مثلاً "لوازم سفر")
  titleEn: string // عنوان انگلیسی (برای کد)
  category: ChecklistCategoryId // دسته‌بندی
  icon: string // آیکون emoji (مثلاً "✈️")
  color: string // رنگ hex (مثلاً "#3b82f6")
  description?: string // توضیحات کوتاه
  items: ChecklistTemplateItem[] // لیست آیتم‌ها
}

/**
 * A category of checklist templates
 */
export interface ChecklistTemplateCategory {
  id: ChecklistCategoryId // شناسه دسته
  title: string // عنوان فارسی (مثلاً "سفر")
  titleEn: string // عنوان انگلیسی
  icon: string // آیکون emoji
  color: string // رنگ hex
  templates: ChecklistTemplate[] // تمپلیت‌های این دسته
}
