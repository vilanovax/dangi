'use client'

import { Avatar } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  role: string
  avatar?: string | null
}

interface ParticipantBalance {
  participantId: string
  balance: number
}

interface ParticipantsRowProps {
  participants: Participant[]
  participantBalances?: ParticipantBalance[]
  onAddMember: () => void
  onParticipantClick?: (participant: Participant) => void
}

/**
 * Horizontal participants row - travel companions with balance status
 *
 * UX Intent:
 * - Color-coded avatars show balance status at a glance
 * - Positive balance (creditor) → success/green ring
 * - Negative balance (debtor) → warning/orange ring
 * - Settled (zero) → neutral (no ring)
 * - Owner has subtle crown overlay
 * - Friendly group feeling: "هم‌سفرها"
 * - Tapping avatar opens detailed profile
 */
export function ParticipantsRow({
  participants,
  participantBalances = [],
  onAddMember,
  onParticipantClick
}: ParticipantsRowProps) {
  // Get balance status for a participant
  const getBalanceRingStyle = (participantId: string) => {
    const balance = participantBalances.find(b => b.participantId === participantId)
    if (!balance || Math.abs(balance.balance) < 1) {
      // Settled - no ring
      return null
    }
    if (balance.balance > 0) {
      // Creditor - green/success ring
      return 'ring-2 ring-emerald-400/80 dark:ring-emerald-500/80 ring-offset-2 ring-offset-white dark:ring-offset-gray-950'
    }
    // Debtor - orange/warning ring
    return 'ring-2 ring-orange-400/80 dark:ring-orange-500/80 ring-offset-2 ring-offset-white dark:ring-offset-gray-950'
  }
  return (
    <div className="px-4 mt-6">
      {/* Section header with hint */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">هم‌سفرها</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">({participants.length} نفر)</span>
        </div>
        {/* Hint for tapping avatars - subtle */}
        <p className="text-[10px] text-gray-400/80 dark:text-gray-500/80">
          برای وضعیت بزن روش
        </p>
      </div>

      {/* Avatars row - color-coded by balance status */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {participants.map((p) => {
          const balanceRing = getBalanceRingStyle(p.id)
          const isOwner = p.role === 'OWNER'

          return (
            <button
              key={p.id}
              onClick={() => onParticipantClick?.(p)}
              className="flex-shrink-0 w-[68px] text-center group active:scale-95 transition-transform"
            >
              <div className="mx-auto mb-1.5 relative">
                {/* Balance status ring or owner glow */}
                <div className={`relative rounded-full ${balanceRing || ''}`}>
                  <Avatar
                    avatar={deserializeAvatar(p.avatar || null, p.name)}
                    name={p.name}
                    size="lg"
                    className="shadow-sm group-hover:shadow-md transition-shadow"
                  />
                </div>
                {/* Subtle crown for owner - overlays balance ring */}
                {isOwner && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-sm ring-1 ring-white dark:ring-gray-950">
                    <span className="text-[10px]">👑</span>
                  </div>
                )}
              </div>
              <p className="text-xs truncate font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors px-0.5">
                {p.name}
              </p>
            </button>
          )
        })}

        {/* Add Member Button - inviting, not urgent */}
        <button
          onClick={onAddMember}
          className="flex-shrink-0 w-[68px] text-center group active:scale-95 transition-transform"
        >
          <div className="mx-auto mb-1.5 relative">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 group-hover:border-sky-400 dark:group-hover:border-sky-500 flex items-center justify-center bg-gray-50 dark:bg-gray-900 group-hover:bg-sky-50 dark:group-hover:bg-sky-950/30 transition-all">
              <svg
                className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-sky-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 group-hover:text-sky-500 font-medium transition-colors">
            دعوت
          </p>
        </button>
      </div>
    </div>
  )
}
