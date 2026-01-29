/**
 * Gathering Checklist Templates
 * Pre-built templates for party and gathering preparation
 */

import { ChecklistTemplate } from './types'

// 1. خرید دورهمی - Gathering Shopping (15 items)
export const gatheringShoppingTemplate: ChecklistTemplate = {
  id: 'gathering-shopping',
  title: 'خرید دورهمی',
  titleEn: 'Party Shopping',
  category: 'gathering',
  icon: '🛒',
  color: '#a855f7',
  description: 'لیست خرید برای مهمانی و دورهمی',
  items: [
    // نوشیدنی
    { text: 'نوشابه و آب‌میوه' },
    { text: 'آب معدنی' },
    { text: 'چای و قهوه' },

    // میوه و خشکبار
    { text: 'میوه تازه', note: 'بسته به فصل' },
    { text: 'آجیل و خشکبار' },
    { text: 'شکلات و شیرینی' },

    // غذای اصلی
    { text: 'گوشت یا مرغ' },
    { text: 'سبزیجات' },
    { text: 'نان' },
    { text: 'برنج' },

    // لبنیات
    { text: 'ماست و دوغ' },
    { text: 'پنیر' },

    // لوازم یکبار مصرف
    { text: 'بشقاب و لیوان یکبار مصرف' },
    { text: 'دستمال کاغذی' },
    { text: 'فویل و سلفون' },
  ],
}

// 2. آماده‌سازی مهمانی - Party Preparation (8 items)
export const gatheringPrepTemplate: ChecklistTemplate = {
  id: 'gathering-prep',
  title: 'آماده‌سازی مهمانی',
  titleEn: 'Party Preparation',
  category: 'gathering',
  icon: '🎉',
  color: '#a855f7',
  description: 'کارهایی که قبل از مهمانی باید انجام شود',
  items: [
    { text: 'تمیز کردن خانه' },
    { text: 'مرتب کردن پذیرایی' },
    { text: 'چیدن میز غذا' },
    { text: 'آماده کردن دمنوش و چای' },
    { text: 'تهیه موزیک مناسب', note: 'پلی‌لیست آماده' },
    { text: 'چک کردن ظرف‌ها و لیوان‌ها' },
    { text: 'آماده کردن حمام و دستشویی' },
    { text: 'فضاسازی و تزیینات (در صورت نیاز)' },
  ],
}

// Export all gathering templates
export const gatheringTemplates: ChecklistTemplate[] = [
  gatheringShoppingTemplate,
  gatheringPrepTemplate,
]
