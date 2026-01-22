'use client'

import { Avatar } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface ParticipantSelectorProps {
  participants: Participant[]
  selectedId: string
  disabledId: string
  onSelect: (id: string) => void
  label: string
  color: 'blue' | 'green'
}

/**
 * Compact participant selector with horizontal scroll
 * Clean chip design - easy to tap on mobile
 */
export function ParticipantSelector({
  participants,
  selectedId,
  disabledId,
  onSelect,
  label,
  color,
}: ParticipantSelectorProps) {
  const colorClasses = {
    blue: {
      active: 'border-blue-500 bg-blue-500 text-white',
      inactive: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
    },
    green: {
      active: 'border-green-500 bg-green-500 text-white',
      inactive: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
    },
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        {label}
      </label>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {participants.map((p) => {
          const isSelected = selectedId === p.id
          const isDisabled = disabledId === p.id

          return (
            <button
              key={p.id}
              onClick={() => !isDisabled && onSelect(p.id)}
              disabled={isDisabled}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all ${
                isSelected
                  ? colorClasses[color].active
                  : isDisabled
                  ? 'border-gray-100 dark:border-gray-800 opacity-40 cursor-not-allowed'
                  : colorClasses[color].inactive + ' hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Avatar
                avatar={deserializeAvatar(p.avatar || null, p.name)}
                name={p.name}
                size="sm"
              />
              <span className="text-sm font-medium whitespace-nowrap">{p.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
