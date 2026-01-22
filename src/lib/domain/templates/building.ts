// Building Template Definition
// تمپلیت ساختمان - تقسیم وزنی بر اساس متراژ

import type { TemplateDefinition } from '@/lib/types/domain'

export const buildingTemplate: TemplateDefinition = {
  id: 'building',
  name: 'Building',
  nameFa: 'ساختمان',
  defaultSplitType: 'WEIGHTED',
  icon: '🏢',
  // Period settings - ساختمان دوره‌ای است
  periodRequired: true,
  periodType: 'monthly',
  supportsChargeRules: true,
  defaultCategories: [
    {
      name: 'Maintenance',
      nameFa: 'تعمیرات',
      icon: '🔧',
      color: '#F59E0B', // amber
    },
    {
      name: 'Cleaning',
      nameFa: 'نظافت',
      icon: '🧹',
      color: '#10B981', // green
    },
    {
      name: 'Utilities',
      nameFa: 'قبوض',
      icon: '💡',
      color: '#3B82F6', // blue
    },
    {
      name: 'Security',
      nameFa: 'نگهبانی',
      icon: '🔒',
      color: '#8B5CF6', // purple
    },
    {
      name: 'Elevator',
      nameFa: 'آسانسور',
      icon: '🛗',
      color: '#EC4899', // pink
    },
    {
      name: 'Other',
      nameFa: 'سایر',
      icon: '📝',
      color: '#6B7280', // gray
    },
  ],
  labels: {
    // Page titles
    addExpenseTitle: 'ثبت شارژ جدید',
    addExpenseSubtitle: 'هزینه جدید ساختمان رو ثبت کن',

    // Form fields
    expenseTitleLabel: 'این شارژ بابت چیه؟',
    expenseTitlePlaceholder: 'مثلاً: تعمیر آسانسور، قبض آب…',
    expenseTitleHelper: 'توضیح کوتاه بهتره',

    amountLabel: 'مبلغ کل چقدر شد؟',
    amountPlaceholder: '۲٬۰۰۰٬۰۰۰',

    categoryLabel: 'این شارژ جزو کدوم دسته‌ست؟',
    categoryHelper: 'برای گزارش‌گیری بهتر، دسته انتخاب کن',
    addCategoryPlaceholder: 'اسم دسته جدید',

    paidByLabel: 'پرداخت‌کننده کیه؟',
    paidByHelper: 'معمولاً مدیر ساختمان',

    splitBetweenLabel: 'بین کدوم واحدها تقسیم بشه؟',
    splitBetweenHelper: 'بر اساس متراژ تقسیم می‌شه',

    // CTA
    submitButton: 'ثبت شارژ',
    submittingButton: 'در حال ثبت…',

    // Success/Error
    successMessage: 'شارژ با موفقیت ثبت شد ✓',
    errorMessage: 'یه مشکلی پیش اومد، دوباره تلاش کن',

    // Edge cases
    onlyForYouMessage: 'این شارژ فقط برای واحد شماست',
    payerNotIncludedMessage: 'اوکیه، شارژ بین بقیه واحدها تقسیم می‌شه',
    deletedCategoryLabel: 'دسته حذف‌شده',

    // Generic terms
    expenseTerm: 'شارژ',
    participantTerm: 'واحد',
  },
}
