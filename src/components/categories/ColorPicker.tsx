'use client'

import { useState } from 'react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

const PRESET_COLORS = [
  { hex: '#FF8A00', name: 'نارنجی' },
  { hex: '#22C55E', name: 'سبز' },
  { hex: '#EF4444', name: 'قرمز' },
  { hex: '#3B82F6', name: 'آبی' },
  { hex: '#6B7280', name: 'خاکستری' },
]

export function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customColor, setCustomColor] = useState('')

  const handlePresetClick = (color: string) => {
    onChange(color)
    setShowCustomInput(false)
  }

  const handleCustomSubmit = () => {
    // Validate hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (customColor.trim() && hexRegex.test(customColor.trim())) {
      onChange(customColor.trim())
      setCustomColor('')
      setShowCustomInput(false)
    }
  }

  const isPresetColor = PRESET_COLORS.some(c => c.hex === value)

  return (
    <div className="space-y-3">
      {/* Preset Colors Grid */}
      <div className="grid grid-cols-6 gap-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.hex}
            type="button"
            onClick={() => handlePresetClick(color.hex)}
            disabled={disabled}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all border-2"
            style={{
              backgroundColor: color.hex,
              borderColor: value === color.hex ? '#1F2937' : 'transparent',
              boxShadow: value === color.hex ? '0 0 0 2px rgba(255, 138, 0, 0.3)' : 'none',
            }}
            aria-label={`انتخاب رنگ ${color.name}`}
          >
            {value === color.hex && (
              <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}

        {/* "+ بیشتر" Button */}
        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          disabled={disabled}
          className="flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all border-2"
          style={{
            backgroundColor: !isPresetColor && value ? value : '#F9FAFB',
            borderColor: !isPresetColor && value ? '#1F2937' : '#E5E7EB',
            boxShadow: !isPresetColor && value ? '0 0 0 2px rgba(255, 138, 0, 0.3)' : 'none',
          }}
          aria-label="انتخاب رنگ دلخواه"
        >
          {!isPresetColor && value ? (
            <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      </div>

      {/* Custom Color Input */}
      {showCustomInput && (
        <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#RRGGBB"
            maxLength={7}
            disabled={disabled}
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8A00] focus:border-transparent text-gray-900 dark:text-gray-100 font-mono"
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
            disabled={disabled || !customColor.trim()}
            className="px-4 py-2 bg-[#FF8A00] hover:bg-[#E67A00] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: '13px' }}
          >
            تأیید
          </button>
        </div>
      )}

      {/* Selected Color Preview */}
      {value && (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400" style={{ fontSize: '12px' }}>
          <span>رنگ انتخابی:</span>
          <div
            className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono">{value}</span>
        </div>
      )}
    </div>
  )
}
