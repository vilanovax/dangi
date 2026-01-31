'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, Card, BottomSheet, Avatar as AvatarComponent } from '@/components/ui'
import { getTemplate } from '@/lib/domain/templates'
import { deserializeAvatar, serializeAvatar, generateAutoAvatar } from '@/lib/types/avatar'
import type { Avatar as AvatarType } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  role: string
  weight: number
  percentage: number | null
  avatar: string | null
}

interface Project {
  id: string
  name: string
  template: string
  splitType: string
  participants: Participant[]
}

const PRESET_AVATARS = [
  'avatar-01',
  'avatar-02',
  'avatar-03',
  'avatar-04',
  'avatar-05',
  'avatar-06',
  'avatar-07',
  'avatar-08',
]

export default function ParticipantsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Add participant modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWeight, setNewWeight] = useState('1')
  const [newAvatar, setNewAvatar] = useState<AvatarType>(generateAutoAvatar(''))
  const [adding, setAdding] = useState(false)

  // Edit participant modal
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [editName, setEditName] = useState('')
  const [editWeight, setEditWeight] = useState('1')
  const [editAvatar, setEditAvatar] = useState<AvatarType>(generateAutoAvatar(''))
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('پروژه یافت نشد')

      const data = await res.json()
      setProject(data.project)
    } catch {
      setError('خطا در بارگذاری پروژه')
    } finally {
      setLoading(false)
    }
  }

  const templateDef = project ? getTemplate(project.template) : null
  const isWeighted = project?.splitType === 'WEIGHTED'

  const openAddModal = () => {
    setNewName('')
    setNewWeight('1')
    setNewAvatar(generateAutoAvatar(''))
    setShowAddModal(true)
  }

  const openEditModal = (participant: Participant) => {
    setEditingParticipant(participant)
    setEditName(participant.name)
    setEditWeight(participant.weight.toString())
    setEditAvatar(deserializeAvatar(participant.avatar, participant.name))
    setError('')
  }

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError('نام الزامی است')
      return
    }

    setAdding(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          weight: parseFloat(newWeight) || 1,
          avatar: serializeAvatar(newAvatar),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در افزودن')
      }

      const data = await res.json()

      if (project) {
        setProject({
          ...project,
          participants: [...project.participants, data.participant],
        })
      }

      setShowAddModal(false)
      setSuccess('واحد جدید اضافه شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در افزودن')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingParticipant) return
    if (!editName.trim()) {
      setError('نام الزامی است')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(
        `/api/projects/${projectId}/participants/${editingParticipant.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editName.trim(),
            weight: parseFloat(editWeight) || 1,
            avatar: serializeAvatar(editAvatar),
          }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ویرایش')
      }

      const data = await res.json()

      if (project) {
        setProject({
          ...project,
          participants: project.participants.map((p) =>
            p.id === editingParticipant.id ? data.participant : p
          ),
        })
      }

      setEditingParticipant(null)
      setSuccess('تغییرات ذخیره شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ویرایش')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingParticipant) return

    setDeleting(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/participants/${deletingParticipant.id}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در حذف')
      }

      if (project) {
        setProject({
          ...project,
          participants: project.participants.filter((p) => p.id !== deletingParticipant.id),
        })
      }

      setDeletingParticipant(null)
      setEditingParticipant(null)
      setSuccess('واحد حذف شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف')
      setDeletingParticipant(null)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center">
        <p className="text-gray-500">{error || 'پروژه یافت نشد'}</p>
      </div>
    )
  }

  return (
    <main className="min-h-dvh pb-24" style={{ backgroundColor: 'var(--building-surface-muted)' }}>
      {/* Header */}
      <div
        className="px-4 py-4"
        style={{
          backgroundColor: 'var(--building-surface)',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          borderBottomColor: 'var(--building-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -mr-2 transition-colors active:scale-95"
            style={{ color: 'var(--building-text-secondary)' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--building-text-primary)' }}>
              مدیریت واحدها
            </h1>
            <p className="text-xs" style={{ color: 'var(--building-text-secondary)' }}>
              {project.participants.length} {templateDef?.labels.participantTerm || 'نفر'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Messages */}
        {error && (
          <div
            className="p-3 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: 'var(--building-danger-alpha)',
              color: 'var(--building-danger)',
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="p-3 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: 'var(--building-success-alpha)',
              color: 'var(--building-success)',
            }}
          >
            {success}
          </div>
        )}

        {/* Participants List */}
        <div className="space-y-2">
          {project.participants.map((participant) => {
            const isOwner = participant.role === 'OWNER'
            return (
              <button
                key={participant.id}
                onClick={() => openEditModal(participant)}
                className="w-full p-4 rounded-xl transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: isOwner
                    ? 'var(--building-primary-alpha)'
                    : 'var(--building-surface)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: isOwner
                    ? 'var(--building-primary)'
                    : 'var(--building-border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar with role-based styling */}
                    <div
                      className="relative w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                      style={{
                        backgroundColor: isOwner
                          ? 'var(--building-primary)'
                          : 'var(--building-surface-muted)',
                        color: isOwner ? 'white' : 'var(--building-text-primary)',
                      }}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                      {isOwner && (
                        <div
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={{
                            backgroundColor: 'var(--building-warning)',
                          }}
                        >
                          👑
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: 'var(--building-text-primary)' }}>
                        {participant.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        {isOwner && (
                          <span
                            className="px-2 py-0.5 rounded-md font-medium"
                            style={{
                              backgroundColor: 'var(--building-primary-soft)',
                              color: 'var(--building-primary)',
                            }}
                          >
                            مالک
                          </span>
                        )}
                        {isWeighted && (
                          <span style={{ color: 'var(--building-text-secondary)' }}>
                            وزن: {participant.weight}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Clear interaction indicator */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--building-surface-muted)',
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      style={{ color: 'var(--building-text-muted)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fixed Add Button - Less Dominant */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--building-surface)',
          borderTopWidth: '1px',
          borderTopStyle: 'solid',
          borderTopColor: 'var(--building-border)',
        }}
      >
        <button
          onClick={openAddModal}
          className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--building-primary)',
            color: 'white',
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          افزودن واحد جدید
        </button>
      </div>

      {/* Add Participant Modal */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="افزودن واحد جدید"
      >
        <div className="space-y-4">
          <Input
            label="نام"
            placeholder="نام واحد"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />

          {isWeighted && (
            <Input
              label={`وزن (مثلاً متراژ ${templateDef?.labels.participantTerm || 'واحد'})`}
              type="number"
              min="0.1"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
            />
          )}

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              آواتار
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setNewAvatar(generateAutoAvatar(''))}
                className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                  newAvatar.type === 'auto'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <span className="text-lg">🎲</span>
              </button>
              {PRESET_AVATARS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewAvatar({ type: 'preset', value: preset })}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all overflow-hidden ${
                    newAvatar.type === 'preset' && newAvatar.value === preset
                      ? 'border-blue-500'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <AvatarComponent avatar={{ type: 'preset', value: preset }} name="" size="lg" />
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleAdd} loading={adding} disabled={!newName.trim()} className="w-full">
            افزودن
          </Button>
        </div>
      </BottomSheet>

      {/* Edit Participant Modal */}
      <BottomSheet
        isOpen={!!editingParticipant}
        onClose={() => setEditingParticipant(null)}
        title="ویرایش واحد"
      >
        {editingParticipant && (
          <div className="space-y-4">
            <Input
              label="نام"
              placeholder="نام واحد"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />

            {isWeighted && (
              <Input
                label={`وزن (مثلاً متراژ ${templateDef?.labels.participantTerm || 'واحد'})`}
                type="number"
                min="0.1"
                step="0.1"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
              />
            )}

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                آواتار
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditAvatar(generateAutoAvatar(''))}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                    editAvatar.type === 'auto'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="text-lg">🎲</span>
                </button>
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditAvatar({ type: 'preset', value: preset })}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all overflow-hidden ${
                      editAvatar.type === 'preset' && editAvatar.value === preset
                        ? 'border-blue-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <AvatarComponent avatar={{ type: 'preset', value: preset }} name="" size="lg" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {editingParticipant.role !== 'OWNER' && (
                <button
                  onClick={() => setDeletingParticipant(editingParticipant)}
                  className="px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95"
                  style={{
                    backgroundColor: 'var(--building-danger-alpha)',
                    color: 'var(--building-danger)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--building-danger)',
                  }}
                >
                  حذف
                </button>
              )}
              <Button
                onClick={handleUpdate}
                loading={saving}
                disabled={!editName.trim()}
                className="flex-1"
              >
                ذخیره
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Delete Confirmation */}
      <BottomSheet
        isOpen={!!deletingParticipant}
        onClose={() => setDeletingParticipant(null)}
        title="حذف واحد"
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--building-text-primary)' }}>
            آیا مطمئن هستید که می‌خواهید «{deletingParticipant?.name}» را حذف کنید؟
          </p>
          <p className="text-sm" style={{ color: 'var(--building-text-secondary)' }}>
            اگر این واحد در هزینه‌ها یا تسویه‌ها شرکت داشته باشد، امکان حذف وجود ندارد.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeletingParticipant(null)}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95"
              style={{
                backgroundColor: 'var(--building-surface-muted)',
                color: 'var(--building-text-primary)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--building-border)',
              }}
            >
              انصراف
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--building-danger)',
                color: 'white',
              }}
            >
              {deleting ? 'در حال حذف...' : 'حذف'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </main>
  )
}
