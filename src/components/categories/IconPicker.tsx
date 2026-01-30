'use client'

import { useState } from 'react'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  disabled?: boolean
}

const PRESET_ICONS = [
  '🍽', // خوراک
  '🚗', // حمل‌ونقل
  '🏠', // خانه
  '💡', // برق
  '⚡', // آب و گاز
  '🎬', // تفریح
  '📚', // آموزش
  '💰', // پس‌انداز
]

export function IconPicker({ value, onChange, disabled = false }: IconPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customIcon, setCustomIcon] = useState('')

  const handlePresetClick = (icon: string) => {
    onChange(icon)
    setShowCustomInput(false)
  }

  const handleCustomSubmit = () => {
    if (customIcon.trim()) {
      onChange(customIcon.trim())
      setCustomIcon('')
      setShowCustomInput(false)
    }
  }

  const isPresetIcon = PRESET_ICONS.includes(value)

  return (
    <div className="space-y-3">
      {/* Preset Icons Grid */}
      <div className="grid grid-cols-4 gap-2">
        {PRESET_ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => handlePresetClick(icon)}
            disabled={disabled}
            className="flex items-center justify-center h-12 rounded-xl transition-all border-2"
            style={{
              fontSize: '24px',
              backgroundColor: value === icon ? 'rgba(255, 138, 0, 0.1)' : '#F9FAFB',
              borderColor: value === icon ? '#FF8A00' : '#E5E7EB',
            }}
            aria-label={`انتخاب آیکون ${icon}`}
          >
            {icon}
          </button>
        ))}

        {/* "+ بیشتر" Button */}
        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          disabled={disabled}
          className="flex flex-col items-center justify-center h-12 rounded-xl transition-all border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
          style={{
            backgroundColor: !isPresetIcon && value ? 'rgba(255, 138, 0, 0.1)' : undefined,
            borderColor: !isPresetIcon && value ? '#FF8A00' : undefined,
          }}
          aria-label="انتخاب آیکون دلخواه"
        >
          {!isPresetIcon && value ? (
            <span style={{ fontSize: '24px' }}>{value}</span>
          ) : (
            <>
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '10px', marginTop: '2px' }}>
                بیشتر
              </span>
            </>
          )}
        </button>
      </div>

      {/* Custom Icon Input */}
      {showCustomInput && (
        <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={customIcon}
            onChange={(e) => setCustomIcon(e.target.value)}
            placeholder="آیکون دلخواه (emoji)"
            maxLength={2}
            disabled={disabled}
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8A00] focus:border-transparent text-gray-900 dark:text-gray-100"
            style={{ fontSize: '14px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCustomSubmit()
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={disabled || !customIcon.trim()}
            className="px-4 py-2 bg-[#FF8A00] hover:bg-[#E67A00] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: '13px' }}
          >
            تأیید
          </button>
        </div>
      )}

      {/* Selected Icon Preview */}
      {value && (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400" style={{ fontSize: '12px' }}>
          <span>انتخاب شده:</span>
          <span style={{ fontSize: '20px' }}>{value}</span>
        </div>
      )}
    </div>
  )
}
