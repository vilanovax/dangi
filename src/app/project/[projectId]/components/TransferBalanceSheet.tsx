'use client'

import { useState, useCallback } from 'react'
import { BottomSheet, Avatar, Button } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  role: string
  avatar?: string | null
}

interface TransferBalanceSheetProps {
  isOpen: boolean
  onClose: () => void
  participant: Participant | null
  participants: Participant[]
  balance: number
  currency: string
  projectId: string
  onSuccess: () => void
}

/**
 * Bottom sheet for transferring participant's balance to another participant
 */
export function TransferBalanceSheet({
  isOpen,
  onClose,
  participant,
  participants,
  balance,
  currency,
  projectId,
  onSuccess,
}: TransferBalanceSheetProps) {
  const [targetId, setTargetId] = useState<string | null>(null)
  const [deleteAfter, setDeleteAfter] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Filter out current participant from target list
  const targetOptions = participants.filter((p) => p.id !== participant?.id)

  const handleTransfer = useCallback(async () => {
    if (!participant || !targetId) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(
        `/api/projects/${projectId}/participants/${participant.id}/transfer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetParticipantId: targetId,
            deleteAfterTransfer: deleteAfter,
          }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در انتقال مانده')
      }

      onSuccess()
      onClose()
      // Reset state
      setTargetId(null)
      setDeleteAfter(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در انتقال مانده')
    } finally {
      setSubmitting(false)
    }
  }, [participant, targetId, deleteAfter, projectId, onSuccess, onClose])

  const handleClose = useCallback(() => {
    setTargetId(null)
    setDeleteAfter(false)
    setError('')
    onClose()
  }, [onClose])

  if (!participant) return null

  const isCreditor = balance > 0
  const absBalance = Math.abs(balance)

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="انتقال مانده حساب">
      <div className="space-y-5">
        {/* Current Participant Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <Avatar
            avatar={deserializeAvatar(participant.avatar || null, participant.name)}
            name={participant.name}
            size="md"
          />
          <div className="flex-1">
            <p className="font-medium">{participant.name}</p>
            <p className={`text-sm ${isCreditor ? 'text-green-600' : 'text-red-600'}`}>
              {isCreditor ? 'طلبکار' : 'بدهکار'}: {formatMoney(absBalance, currency)}
            </p>
          </div>
        </div>

        {/* Transfer Direction Explanation */}
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {isCreditor
                ? `${formatMoney(absBalance, currency)} به حساب طرف مقابل اضافه می‌شه`
                : `${formatMoney(absBalance, currency)} از حساب طرف مقابل کم می‌شه`}
            </span>
          </div>
        </div>

        {/* Target Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            انتقال به:
          </label>
          <div className="space-y-2">
            {targetOptions.map((p) => (
              <button
                key={p.id}
                onClick={() => setTargetId(p.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  targetId === p.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Avatar
                  avatar={deserializeAvatar(p.avatar || null, p.name)}
                  name={p.name}
                  size="md"
                />
                <span className="font-medium flex-1 text-right">{p.name}</span>
                {targetId === p.id && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Delete After Checkbox */}
        <label className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={deleteAfter}
            onChange={(e) => setDeleteAfter(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
          />
          <div className="flex-1">
            <p className="font-medium text-red-700 dark:text-red-400">
              حذف شرکت‌کننده بعد از انتقال
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">
              {participant.name} از پروژه حذف می‌شه
            </p>
          </div>
        </label>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            انصراف
          </Button>
          <Button
            onClick={handleTransfer}
            loading={submitting}
            disabled={!targetId}
            className="flex-1"
          >
            {deleteAfter ? 'انتقال و حذف' : 'انتقال مانده'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
