'use client'

import Image from 'next/image'
import type { Avatar as AvatarType } from '@/lib/types/avatar'
import { PRESET_AVATARS, generateAutoAvatar } from '@/lib/types/avatar'
import { Avatar } from './Avatar'

interface AvatarPickerProps {
  name: string
  value: AvatarType | null
  onChange: (avatar: AvatarType | null) => void
}

export function AvatarPicker({ name, value, onChange }: AvatarPickerProps) {
  // آواتار خودکار بر اساس نام
  const autoAvatar = generateAutoAvatar(name || 'کاربر')

  // آیا آواتار خودکار انتخاب شده؟
  const isAutoSelected = !value || value.type === 'auto'

  // آیا یک preset خاص انتخاب شده؟
  const isPresetSelected = (presetId: string) =>
    value?.type === 'preset' && value.value === presetId

  const handleSelectAuto = () => {
    onChange(null) // null یعنی auto
  }

  const handleSelectPreset = (presetId: string) => {
    onChange({ type: 'preset', value: presetId })
  }

  return (
    <div className="space-y-3">
      {/* عنوان */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          می‌تونی یه آواتار انتخاب کنی (اختیاری)
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          برای تشخیص راحت‌تر توی پروژه
        </p>
      </div>

      {/* گرید آواتارها */}
      <div className="grid grid-cols-4 gap-3 justify-items-center">
        {/* آواتار خودکار */}
        <button
          type="button"
          onClick={handleSelectAuto}
          className={`relative rounded-full p-1 transition-all ${
            isAutoSelected
              ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
              : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 dark:hover:ring-offset-gray-800'
          }`}
        >
          <Avatar avatar={autoAvatar} name={name || 'کاربر'} size="lg" />
          {isAutoSelected && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>

        {/* آواتارهای از پیش تعریف شده */}
        {PRESET_AVATARS.map((presetId) => (
          <button
            key={presetId}
            type="button"
            onClick={() => handleSelectPreset(presetId)}
            className={`relative rounded-full p-1 transition-all ${
              isPresetSelected(presetId)
                ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 dark:hover:ring-offset-gray-800'
            }`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image
                src={`/avatars/${presetId}.svg`}
                alt={presetId}
                width={48}
                height={48}
                className="w-full h-full"
              />
            </div>
            {isPresetSelected(presetId) && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
