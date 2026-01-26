import type { TemplateDefinition } from '@/lib/types/domain'

export const personalTemplate: TemplateDefinition = {
  id: 'personal',
  name: 'Personal Finance',
  nameFa: 'مالی شخصی',
  defaultSplitType: 'EQUAL',
  icon: '💰',
  periodRequired: false,
  supportsChargeRules: false,

  defaultCategories: [
    { name: 'Food', nameFa: 'خوراک و خوراکی', icon: '🍕', color: '#EF4444' },
    { name: 'Transport', nameFa: 'حمل‌ونقل', icon: '🚗', color: '#3B82F6' },
    { name: 'Bills', nameFa: 'قبوض و پرداختی‌ها', icon: '💡', color: '#F59E0B' },
    { name: 'Shopping', nameFa: 'خرید', icon: '🛍️', color: '#EC4899' },
    { name: 'Health', nameFa: 'سلامت', icon: '🏥', color: '#10B981' },
    { name: 'Entertainment', nameFa: 'سرگرمی', icon: '🎬', color: '#8B5CF6' },
    { name: 'Education', nameFa: 'آموزش', icon: '📚', color: '#06B6D4' },
    { name: 'Housing', nameFa: 'مسکن', icon: '🏠', color: '#14B8A6' },
    { name: 'Personal Care', nameFa: 'مراقبت شخصی', icon: '💅', color: '#F472B6' },
    { name: 'Other', nameFa: 'سایر', icon: '📝', color: '#6B7280' },
  ],

  labels: {
    // Page titles - زبان ساده
    addExpenseTitle: 'خرج جدید',
    addExpenseSubtitle: 'چقدر خرج کردی؟ بیا ثبتش کن',

    // Form fields - سوالی و مکالمه‌ای
    expenseTitleLabel: 'برای چی بود؟',
    expenseTitlePlaceholder: 'مثلاً: خرید نان، بنزین، قبض برق',
    expenseTitleHelper: 'یه توضیح کوتاه بنویس',

    amountLabel: 'چند تومان؟',
    amountPlaceholder: '۵۰٬۰۰۰',

    categoryLabel: 'جزو چی باشه؟',
    categoryHelper: 'یه دسته انتخاب کن',
    addCategoryPlaceholder: 'اسم دسته',

    paidByLabel: 'کی پرداخت کرد؟',
    paidByHelper: 'خودت یا کس دیگه‌ای؟',

    splitBetweenLabel: 'بین کیا تقسیم شه؟',
    splitBetweenHelper: 'فقط خودت یا چند نفر؟',

    // CTA - کوتاه و مختصر
    submitButton: 'ثبت کن',
    submittingButton: 'در حال ثبت…',

    // Success/Error
    successMessage: 'ثبت شد ✅',
    errorMessage: 'یه مشکلی پیش اومد',

    // Edge cases
    onlyForYouMessage: 'این خرج فقط مال خودته',
    payerNotIncludedMessage: '-',
    deletedCategoryLabel: 'دسته پاک شده',

    // Generic terms - ساده و روزمره
    expenseTerm: 'خرج',
    participantTerm: 'نفر',
  },
}
