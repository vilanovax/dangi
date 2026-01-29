/**
 * Personal Finance Checklist Templates
 * Pre-built templates for bill payments and household shopping
 */

import { ChecklistTemplate } from './types'

// 1. قبوض ماهانه - Monthly Bills (9 items)
export const monthlyBillsTemplate: ChecklistTemplate = {
  id: 'monthly-bills',
  title: 'قبوض ماهانه',
  titleEn: 'Monthly Bills',
  category: 'personal-finance',
  icon: '💡',
  color: '#f59e0b',
  description: 'یادآوری پرداخت قبوض',
  items: [
    { text: 'قبض برق' },
    { text: 'قبض گاز' },
    { text: 'قبض آب' },
    { text: 'قبض تلفن ثابت' },
    { text: 'اینترنت' },
    { text: 'موبایل' },
    { text: 'شارژ مترو یا اتوبوس', note: 'در صورت نیاز' },
    { text: 'بیمه' },
    { text: 'اجاره (در صورت اجاره‌ای بودن)' },
  ],
}

// 2. خرید هفتگی خانه - Weekly Groceries (14 items)
export const weeklyGroceriesTemplate: ChecklistTemplate = {
  id: 'weekly-groceries',
  title: 'خرید هفتگی خانه',
  titleEn: 'Weekly Groceries',
  category: 'personal-finance',
  icon: '🛍️',
  color: '#f59e0b',
  description: 'لیست خرید مواد غذایی',
  items: [
    // لبنیات
    { text: 'شیر' },
    { text: 'ماست' },
    { text: 'پنیر' },
    { text: 'تخم‌مرغ' },

    // نان و غلات
    { text: 'نان تازه' },
    { text: 'برنج' },

    // پروتئین
    { text: 'گوشت یا مرغ' },

    // سبزیجات و میوه
    { text: 'سبزیجات تازه', note: 'بسته به فصل' },
    { text: 'میوه' },

    // مواد پایه
    { text: 'روغن' },
    { text: 'قند و شکر' },
    { text: 'نمک و ادویه' },

    // بهداشتی
    { text: 'مواد شوینده' },
    { text: 'دستمال کاغذی' },
  ],
}

// Export all personal-finance templates
export const personalFinanceTemplates: ChecklistTemplate[] = [
  monthlyBillsTemplate,
  weeklyGroceriesTemplate,
]
