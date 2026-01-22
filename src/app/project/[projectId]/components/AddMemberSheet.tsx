'use client'

import { useState, useCallback } from 'react'
import { BottomSheet, Button, Input, AvatarPicker } from '@/components/ui'
import { serializeAvatar } from '@/lib/types/avatar'
import type { Avatar as AvatarType } from '@/lib/types/avatar'

interface AddMemberSheetProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  shareCode: string
  onMemberAdded: () => void
}

/**
 * Bottom sheet for adding new member
 * Includes avatar picker and invite link copy
 */
export function AddMemberSheet({
  isOpen,
  onClose,
  projectId,
  shareCode,
  onMemberAdded,
}: AddMemberSheetProps) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<AvatarType | null>(null)
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleAdd = useCallback(async () => {
    if (!name.trim()) return

    setAdding(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatar ? serializeAvatar(avatar) : null,
        }),
      })

      if (!res.ok) throw new Error('خطا در افزودن عضو')

      onMemberAdded()
      setName('')
      setAvatar(null)
      onClose()
    } catch {
      alert('خطا در افزودن عضو')
    } finally {
      setAdding(false)
    }
  }, [name, avatar, projectId, onMemberAdded, onClose])

  const copyInviteLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${shareCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shareCode])

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="افزودن عضو جدید">
      <div className="space-y-4">
        <Input
          label="نام عضو"
          placeholder="مثلاً: محمد"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        {/* Avatar Picker - only when name entered */}
        {name.trim().length > 0 && (
          <AvatarPicker name={name} value={avatar} onChange={setAvatar} />
        )}

        <Button onClick={handleAdd} loading={adding} disabled={!name.trim()} className="w-full">
          افزودن
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">یا</span>
          </div>
        </div>

        <Button variant="secondary" onClick={copyInviteLink} className="w-full">
          {copied ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              کپی شد!
            </span>
          ) : (
            'کپی لینک دعوت'
          )}
        </Button>
      </div>
    </BottomSheet>
  )
}
