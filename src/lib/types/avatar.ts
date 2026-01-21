// Avatar Types
// Future-proof model for avatar support

export type Avatar =
  | { type: 'preset'; value: string }
  | { type: 'auto'; value: string; letter: string }
  | { type: 'uploaded'; value: string } // برای آینده

// لیست آواتارهای از پیش تعریف شده
export const PRESET_AVATARS = [
  'avatar-01',
  'avatar-02',
  'avatar-03',
  'avatar-04',
  'avatar-05',
  'avatar-06',
  'avatar-07',
  'avatar-08',
  'avatar-09',
  'avatar-10',
  'avatar-11',
  'avatar-12',
] as const

// رنگ‌های برای آواتار خودکار
const AUTO_AVATAR_COLORS = [
  '#4CAF50', // سبز
  '#2196F3', // آبی
  '#9C27B0', // بنفش
  '#FF9800', // نارنجی
  '#E91E63', // صورتی
  '#00BCD4', // فیروزه‌ای
  '#795548', // قهوه‌ای
  '#607D8B', // خاکستری-آبی
  '#F44336', // قرمز
  '#3F51B5', // نیلی
  '#009688', // سبزآبی
  '#FF5722', // نارنجی تیره
]

/**
 * تولید یک عدد هش از یک رشته
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * گرفتن اولین حرف از نام (با پشتیبانی از فارسی)
 */
function getFirstLetter(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'

  // برای فارسی و عربی، اولین کاراکتر را برمی‌گردانیم
  return trimmed.charAt(0).toUpperCase()
}

/**
 * تولید آواتار خودکار بر اساس نام
 */
export function generateAutoAvatar(name: string): Avatar {
  const letter = getFirstLetter(name)
  const colorIndex = hashString(name) % AUTO_AVATAR_COLORS.length
  const color = AUTO_AVATAR_COLORS[colorIndex]

  return {
    type: 'auto',
    value: color,
    letter,
  }
}

/**
 * ساخت آواتار preset
 */
export function createPresetAvatar(avatarId: string): Avatar {
  return {
    type: 'preset',
    value: avatarId,
  }
}

/**
 * تبدیل آواتار به رشته JSON برای ذخیره در دیتابیس
 */
export function serializeAvatar(avatar: Avatar): string {
  return JSON.stringify(avatar)
}

/**
 * تبدیل رشته JSON به آواتار
 */
export function deserializeAvatar(json: string | null, fallbackName: string): Avatar {
  if (!json) {
    return generateAutoAvatar(fallbackName)
  }

  try {
    const parsed = JSON.parse(json)
    if (parsed.type === 'preset' || parsed.type === 'auto' || parsed.type === 'uploaded') {
      return parsed as Avatar
    }
    return generateAutoAvatar(fallbackName)
  } catch {
    return generateAutoAvatar(fallbackName)
  }
}
