// Gathering Template Definition
// تمپلیت دورهمی - تقسیم مساوی برای مهمانی‌ها و جشن‌ها

import type { TemplateDefinition } from '@/lib/types/domain'

export const gatheringTemplate: TemplateDefinition = {
  id: 'gathering',
  name: 'Gathering',
  nameFa: 'دورهمی',
  defaultSplitType: 'EQUAL',
  icon: '🎉',
  // Period settings - دورهمی رویداد‌محور است، نه دوره‌ای
  periodRequired: false,
  supportsChargeRules: false,
  defaultCategories: [
    {
      name: 'Food',
      nameFa: 'غذا',
      icon: '🍕',
      color: '#EF4444', // red
    },
    {
      name: 'Drinks',
      nameFa: 'نوشیدنی',
      icon: '🥤',
      color: '#F97316', // orange
    },
    {
      name: 'Decoration',
      nameFa: 'دکوراسیون',
      icon: '🎈',
      color: '#EC4899', // pink
    },
    {
      name: 'Entertainment',
      nameFa: 'سرگرمی',
      icon: '🎵',
      color: '#8B5CF6', // purple
    },
    {
      name: 'Venue',
      nameFa: 'محل',
      icon: '🏠',
      color: '#06B6D4', // cyan
    },
    {
      name: 'Gifts',
      nameFa: 'کادو',
      icon: '🎁',
      color: '#10B981', // emerald
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
    addExpenseTitle: 'یه خرج جدید',
    addExpenseSubtitle: 'خرجی داشتی؟ بیا ثبتش کن 🎊',

    // Form fields
    expenseTitleLabel: 'این خرج برای چی بود؟',
    expenseTitlePlaceholder: 'مثلاً پیتزا، نوشیدنی، اسنک…',
    expenseTitleHelper: 'اگه خواستی، یه توضیح کوتاه بنویس',

    amountLabel: 'چقدر شد؟',
    amountPlaceholder: '۳۰۰٬۰۰۰',

    categoryLabel: 'جزو کدوم دسته‌ست؟',
    categoryHelper: 'اگه دسته انتخاب نکنی، مشکلی نیست',
    addCategoryPlaceholder: 'اسم دسته',

    paidByLabel: 'کی حساب کرد؟',
    paidByHelper: 'اگه یکی دیگه داده، اسمشو انتخاب کن',

    splitBetweenLabel: 'بین کی‌ها تقسیم بشه؟',
    splitBetweenHelper: 'همه یا فقط بعضی‌ها؟',

    // CTA
    submitButton: 'ثبتش کن',
    submittingButton: 'دارم ثبت می‌کنم…',

    // Success/Error
    successMessage: 'ثبت شد! 🎉',
    errorMessage: 'یه مشکلی پیش اومد، دوباره تلاش کن',

    // Edge cases
    onlyForYouMessage: 'این خرج فقط مال خودته',
    payerNotIncludedMessage: 'اوکی، بین بقیه تقسیم می‌شه',
    deletedCategoryLabel: 'دسته حذف‌شده',

    // Generic terms
    expenseTerm: 'خرج',
    participantTerm: 'نفر',
  },
}
