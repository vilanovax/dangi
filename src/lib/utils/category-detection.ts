/**
 * Automatic Expense Category Detection
 *
 * Pure, deterministic keyword-based category detection for Persian expense titles.
 * No external dependencies, no async operations, no AI.
 *
 * UX Principles:
 * - Helpful, not intrusive
 * - User always in control
 * - Only auto-suggest when confidence is high (single match)
 * - Fast and synchronous
 */

// ============================================
// Types
// ============================================

export interface CategoryKeywords {
  categoryId: string
  keywords: string[]
}

// ============================================
// Keyword Dictionary (Persian)
// ============================================

/**
 * Keyword dictionary for common expense categories
 *
 * Rules:
 * - Keywords should be lowercase
 * - Include common variations and misspellings
 * - Minimum 3 characters for matching
 * - Order doesn't matter (matching is non-positional)
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Food & Dining
  food: [
    'غذا',
    'شام',
    'ناهار',
    'صبحانه',
    'صبحونه',
    'نهار',
    'پیتزا',
    'برگر',
    'ساندویچ',
    'ساندیچ',
    'رستوران',
    'رستران',
    'کافه',
    'قهوه',
    'چای',
    'آبمیوه',
    'بستنی',
    'دسر',
    'کباب',
    'جوجه',
    'فست‌فود',
    'فستفود',
    'اسنک',
    'میان‌وعده',
    'نوشیدنی',
  ],

  // Transportation
  transport: [
    'تاکسی',
    'تکسی',
    'اسنپ',
    'تپسی',
    'اوبر',
    'دیدی',
    'ماکسیم',
    'بنزین',
    'سوخت',
    'گازوئیل',
    'اتوبوس',
    'اتوبس',
    'مترو',
    'قطار',
    'هواپیما',
    'پرواز',
    'بلیط',
    'بلیت',
    'پارکینگ',
    'پارکنگ',
    'عوارض',
    'تردد',
    'جاده',
  ],

  // Accommodation
  accommodation: [
    'هتل',
    'متل',
    'اقامت',
    'ویلا',
    'ویلایی',
    'سوئیت',
    'مهمانسرا',
    'مهمانپذیر',
    'اجاره',
    'رزرو',
    'اتاق',
  ],

  // Shopping
  shopping: [
    'خرید',
    'سوپر',
    'سوپرمارکت',
    'مارکت',
    'فروشگاه',
    'بازار',
    'مغازه',
    'پوشاک',
    'لباس',
    'کفش',
    'کیف',
  ],

  // Entertainment
  entertainment: [
    'تفریح',
    'سرگرمی',
    'سینما',
    'تئاتر',
    'کنسرت',
    'موزه',
    'پارک',
    'باغ‌وحش',
    'آکواریوم',
    'شهربازی',
    'بازی',
    'ورزش',
    'استخر',
  ],

  // Utilities (for building/home expenses)
  utilities: [
    'آب',
    'برق',
    'گاز',
    'اینترنت',
    'تلفن',
    'موبایل',
    'شارژ',
    'قبض',
  ],

  // Healthcare
  healthcare: [
    'دارو',
    'داروخانه',
    'دکتر',
    'پزشک',
    'درمانگاه',
    'بیمارستان',
    'آزمایش',
    'ویزیت',
    'دندان',
    'دندانپزشک',
  ],

  // Maintenance & Repairs
  maintenance: [
    'تعمیر',
    'تعمیرات',
    'سرویس',
    'نصب',
    'نگهداری',
    'لوله',
    'شیر',
    'درب',
    'پنجره',
    'رنگ',
  ],
}

// ============================================
// Text Normalization
// ============================================

/**
 * Normalize Persian text for matching
 *
 * Steps:
 * 1. Convert to lowercase
 * 2. Trim whitespace
 * 3. Normalize Persian characters (ی/ی, ک/ک)
 * 4. Remove extra spaces
 */
export function normalizeText(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Normalize Persian characters
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      // Remove extra spaces
      .replace(/\s+/g, ' ')
  )
}

// ============================================
// Detection Function
// ============================================

/**
 * Detect expense category from title text
 *
 * Algorithm:
 * 1. Normalize input text
 * 2. Check each category's keywords
 * 3. Return category only if exactly ONE match found
 *
 * UX Rules:
 * - Single match → return category (high confidence)
 * - Multiple matches → return null (ambiguous)
 * - No matches → return null
 *
 * Performance:
 * - O(n*m) where n = categories, m = keywords per category
 * - Fast enough for real-time detection (< 1ms)
 *
 * @param title - The expense title entered by user
 * @param availableCategories - Categories from the project
 * @returns Detected category ID or null
 */
export function detectCategoryFromTitle(
  title: string,
  availableCategories: Array<{ id: string; name: string }>
): string | null {
  // Edge case: empty or very short title
  if (!title || title.trim().length < 2) {
    return null
  }

  const normalizedTitle = normalizeText(title)

  // Track which categories match
  const matchedCategories: string[] = []

  // Check each available category
  for (const category of availableCategories) {
    const categoryName = normalizeText(category.name)

    // Get keywords for this category (try to match by category name first)
    let keywords: string[] = []

    // Try to find keywords by matching category name to our dictionary
    for (const [key, keywordList] of Object.entries(CATEGORY_KEYWORDS)) {
      // Check if category name contains any indication of this keyword group
      if (
        categoryName.includes('غذا') ||
        categoryName.includes('خوراک') ||
        categoryName.includes('نهار') ||
        categoryName.includes('شام')
      ) {
        if (key === 'food') {
          keywords = keywordList
          break
        }
      } else if (categoryName.includes('حمل') || categoryName.includes('نقل') || categoryName.includes('سفر')) {
        if (key === 'transport') {
          keywords = keywordList
          break
        }
      } else if (categoryName.includes('اقامت') || categoryName.includes('هتل')) {
        if (key === 'accommodation') {
          keywords = keywordList
          break
        }
      } else if (categoryName.includes('خرید')) {
        if (key === 'shopping') {
          keywords = keywordList
          break
        }
      } else if (categoryName.includes('تفریح') || categoryName.includes('سرگرم')) {
        if (key === 'entertainment') {
          keywords = keywordList
          break
        }
      } else if (
        categoryName.includes('آب') ||
        categoryName.includes('برق') ||
        categoryName.includes('گاز') ||
        categoryName.includes('شارژ')
      ) {
        if (key === 'utilities') {
          keywords = keywordList
          break
        }
      } else if (categoryName.includes('دارو') || categoryName.includes('درمان') || categoryName.includes('بهداشت')) {
        if (key === 'healthcare') {
          keywords = keywordList
          break
        }
      } else if (categoryName.includes('تعمیر') || categoryName.includes('نگهدار')) {
        if (key === 'maintenance') {
          keywords = keywordList
          break
        }
      }
    }

    // If no keywords matched by category name, skip
    if (keywords.length === 0) continue

    // Check if any keyword appears in the title
    const hasMatch = keywords.some((keyword) => {
      // Ignore very short keywords (< 3 chars) to reduce false positives
      if (keyword.length < 3) return false

      // Check if keyword appears in title
      return normalizedTitle.includes(keyword)
    })

    if (hasMatch) {
      matchedCategories.push(category.id)
    }
  }

  // UX Rule: Only auto-suggest if exactly ONE category matches
  if (matchedCategories.length === 1) {
    return matchedCategories[0]
  }

  // Multiple matches or no matches → do not auto-suggest
  return null
}

// ============================================
// Helper: Get Detection Confidence
// ============================================

/**
 * Get confidence level for category detection
 *
 * Useful for showing different UI states based on confidence
 *
 * @returns 'high' | 'low' | 'none'
 */
export function getDetectionConfidence(
  title: string,
  availableCategories: Array<{ id: string; name: string }>
): 'high' | 'low' | 'none' {
  if (!title || title.trim().length < 2) {
    return 'none'
  }

  const detected = detectCategoryFromTitle(title, availableCategories)

  if (detected) {
    return 'high' // Single match = high confidence
  }

  return 'none'
}
