'use client'

import { Avatar } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  role: string
  avatar?: string | null
}

interface ParticipantsRowProps {
  participants: Participant[]
  onAddMember: () => void
}

/**
 * Horizontal scrollable participants list
 * Shows avatars with names and add button
 */
export function ParticipantsRow({ participants, onAddMember }: ParticipantsRowProps) {
  return (
    <div className="px-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">اعضا</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {participants.map((p) => (
          <div key={p.id} className="flex-shrink-0 w-16 text-center">
            <div className="mx-auto mb-1.5 relative">
              <Avatar avatar={deserializeAvatar(p.avatar || null, p.name)} name={p.name} size="lg" />
              {p.role === 'OWNER' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs truncate font-medium">{p.name}</p>
          </div>
        ))}

        {/* Add Member Button */}
        <button onClick={onAddMember} className="flex-shrink-0 w-16 text-center group">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 flex items-center justify-center mx-auto mb-1.5 transition-colors">
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">افزودن</p>
        </button>
      </div>
    </div>
  )
}
