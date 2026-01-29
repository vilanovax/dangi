import type { TemplateDefinition } from '@/lib/types/domain'

/**
 * Family Finance Template
 * تمپلیت مدیریت مالی خانواده با قابلیت ثبت درآمد، بودجه‌بندی و تراکنش‌های تکراری
 */
export const familyTemplate: TemplateDefinition = {
  id: 'family',
  name: 'Family Finance',
  nameFa: 'مالی شخصی',
  defaultSplitType: 'MANUAL', // No automatic splitting for families
  icon: '👨‍👩‍👧‍👦',
  periodRequired: false,
  supportsChargeRules: false,

  // دسته‌بندی‌های پیش‌فرض برای خرج‌های خانواده
  defaultCategories: [
    { name: 'Food & Groceries', nameFa: 'خوراک و خواربار', icon: '🍎', color: '#F59E0B' },
    { name: 'Housing', nameFa: 'مسکن', icon: '🏠', color: '#3B82F6' },
    { name: 'Transportation', nameFa: 'حمل‌ونقل', icon: '🚗', color: '#6366F1' },
    { name: 'Healthcare', nameFa: 'سلامت و درمان', icon: '⚕️', color: '#EF4444' },
    { name: 'Education', nameFa: 'آموزش', icon: '📚', color: '#8B5CF6' },
    { name: 'Utilities', nameFa: 'قبوض', icon: '💡', color: '#10B981' },
    { name: 'Entertainment', nameFa: 'تفریح', icon: '🎬', color: '#EC4899' },
    { name: 'Clothing', nameFa: 'پوشاک', icon: '👔', color: '#06B6D4' },
    { name: 'Savings', nameFa: 'پس‌انداز', icon: '💰', color: '#14B8A6' },
    { name: 'Other', nameFa: 'سایر', icon: '📝', color: '#6B7280' },
  ],

  // دسته‌بندی‌های پیش‌فرض برای درآمد خانواده
  defaultIncomeCategories: [
    { name: 'Salary', nameFa: 'حقوق', icon: '💼', color: '#10B981' },
    { name: 'Business', nameFa: 'کسب‌وکار', icon: '🏢', color: '#3B82F6' },
    { name: 'Investment', nameFa: 'سرمایه‌گذاری', icon: '📈', color: '#8B5CF6' },
    { name: 'Gift', nameFa: 'هدیه', icon: '🎁', color: '#EC4899' },
    { name: 'Other Income', nameFa: 'سایر درآمد', icon: '💵', color: '#6B7280' },
  ],

  labels: {
    // Page titles
    addExpenseTitle: 'ثبت خرج',
    addExpenseSubtitle: 'خرج جدیدی داشتی؟',

    // Form fields
    expenseTitleLabel: 'خرج برای چی بود؟',
    expenseTitlePlaceholder: 'مثلاً: خرید ماهیانه، قبض برق، مهمانی',
    expenseTitleHelper: '',

    amountLabel: 'مبلغ',
    amountPlaceholder: '۱۰۰٬۰۰۰',

    categoryLabel: 'دسته‌بندی',
    categoryHelper: '',
    addCategoryPlaceholder: 'نام دسته',

    paidByLabel: 'پرداخت‌کننده',
    paidByHelper: '',

    splitBetweenLabel: 'سهم افراد',
    splitBetweenHelper: '',

    // CTA
    submitButton: 'ثبت',
    submittingButton: 'در حال ثبت...',

    // Success/Error
    successMessage: 'ثبت شد ✅',
    errorMessage: 'خطا در ثبت',

    // Edge cases
    onlyForYouMessage: '',
    payerNotIncludedMessage: '',
    deletedCategoryLabel: 'حذف‌شده',

    // Generic terms - family-specific
    expenseTerm: 'خرج',
    participantTerm: 'عضو خانواده', // UNIQUE: instead of "نفر"
  },
}
