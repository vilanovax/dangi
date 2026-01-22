// Travel Template Definition
// تمپلیت سفر - تقسیم مساوی با دسته‌بندی‌های مرتبط

import type { TemplateDefinition } from '@/lib/types/domain'

export const travelTemplate: TemplateDefinition = {
  id: 'travel',
  name: 'Travel',
  nameFa: 'سفر',
  defaultSplitType: 'EQUAL',
  icon: '✈️',
  // Period settings - سفر رویداد‌محور است، نه دوره‌ای
  periodRequired: false,
  supportsChargeRules: false,
  defaultCategories: [
    {
      name: 'Transport',
      nameFa: 'حمل‌ونقل',
      icon: '🚗',
      color: '#3B82F6', // blue
    },
    {
      name: 'Accommodation',
      nameFa: 'اقامت',
      icon: '🏨',
      color: '#8B5CF6', // purple
    },
    {
      name: 'Food',
      nameFa: 'غذا',
      icon: '🍕',
      color: '#F59E0B', // amber
    },
    {
      name: 'Activities',
      nameFa: 'تفریح',
      icon: '🎢',
      color: '#10B981', // green
    },
    {
      name: 'Shopping',
      nameFa: 'خرید',
      icon: '🛍️',
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
    addExpenseTitle: 'ثبت خرج جدید',
    addExpenseSubtitle: 'یه خرج داشتی؟ سریع ثبتش کن',

    // Form fields
    expenseTitleLabel: 'خرج بابت چی بود؟',
    expenseTitlePlaceholder: 'مثلاً: شام، هتل، بنزین، بلیط…',
    expenseTitleHelper: 'اسم کوتاه بهتره',

    amountLabel: 'مبلغ چقدر شد؟',
    amountPlaceholder: '۵۰۰٬۰۰۰',

    categoryLabel: 'این خرج جزو کدوم دسته‌ست؟',
    categoryHelper: 'اگه دسته انتخاب نکنی، مشکلی نیست',
    addCategoryPlaceholder: 'اسم دسته جدید',

    paidByLabel: 'این خرج رو کی پرداخت کرده؟',
    paidByHelper: 'اگه یکی دیگه داده، انتخابش کن',

    splitBetweenLabel: 'این خرج بین کی‌ها تقسیم بشه؟',
    splitBetweenHelper: 'می‌تونی بعضی‌ها رو برداری',

    // CTA
    submitButton: 'ثبت خرج',
    submittingButton: 'در حال ثبت…',

    // Success/Error
    successMessage: 'خرج با موفقیت ثبت شد ✓',
    errorMessage: 'یه مشکلی پیش اومد، دوباره تلاش کن',

    // Edge cases
    onlyForYouMessage: 'این خرج فقط برای خودته',
    payerNotIncludedMessage: 'اوکیه، خرج فقط بین بقیه تقسیم می‌شه',
    deletedCategoryLabel: 'دسته حذف‌شده',

    // Generic terms
    expenseTerm: 'خرج',
    participantTerm: 'نفر',
  },
}
