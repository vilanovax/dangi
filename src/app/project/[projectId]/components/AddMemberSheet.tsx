'use client'

import { useState, useCallback, useMemo } from 'react'
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
  const [showQR, setShowQR] = useState(false)

  const inviteLink = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/join/${shareCode}`
  }, [shareCode])

  const qrCodeUrl = useMemo(() => {
    if (!inviteLink) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`
  }, [inviteLink])

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
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [inviteLink])

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

        {/* Invite actions */}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={copyInviteLink} className="flex-1">
            {copied ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                کپی شد!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                کپی لینک
              </span>
            )}
          </Button>

          <Button variant="secondary" onClick={() => setShowQR(!showQR)} className="flex-1">
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              QR Code
            </span>
          </Button>
        </div>

        {/* QR Code display */}
        {showQR && (
          <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="QR Code برای دعوت"
                width={200}
                height={200}
                className="rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              این QR Code را اسکن کنید تا به گروه بپیوندید
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
