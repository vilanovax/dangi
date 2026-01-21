'use client'

import { Avatar } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface PaidBySelectorProps {
  participants: Participant[]
  selectedId: string
  onSelect: (id: string) => void
  currentUserId?: string // برای نشان دادن "(خودت)"
  label: string
  helper: string
}

/**
 * انتخاب پرداخت‌کننده
 * اگر کاربر فعلی انتخاب شده، "(خودت)" نمایش داده می‌شود
 */
export function PaidBySelector({
  participants,
  selectedId,
  onSelect,
  currentUserId,
  label,
  helper,
}: PaidBySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {participants.map((p) => {
          const isSelected = selectedId === p.id
          const isCurrentUser = p.id === currentUserId

          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full border-2 text-sm transition-all flex items-center gap-2 ${
                isSelected
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <Avatar
                avatar={deserializeAvatar(p.avatar || null, p.name)}
                name={p.name}
                size="sm"
                className={isSelected ? 'ring-2 ring-white/30' : ''}
              />
              <span>{p.name}</span>
              {/* نشانگر کاربر فعلی */}
              {isSelected && isCurrentUser && (
                <span className="text-xs opacity-80">(خودت)</span>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-1">{helper}</p>
    </div>
  )
}
