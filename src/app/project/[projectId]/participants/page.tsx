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
      setSuccess('عضو جدید اضافه شد')
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
      setSuccess('عضو حذف شد')
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
    <main className="min-h-dvh pb-24">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold">مدیریت اعضا</h1>
            <p className="text-xs text-gray-500">
              {project.participants.length} {templateDef?.labels.participantTerm || 'نفر'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm">
            {success}
          </div>
        )}

        {/* Participants List */}
        <Card className="divide-y divide-gray-100 dark:divide-gray-800">
          {project.participants.map((participant) => (
            <button
              key={participant.id}
              onClick={() => openEditModal(participant)}
              className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <AvatarComponent
                  avatar={deserializeAvatar(participant.avatar, participant.name)}
                  name={participant.name}
                  size="lg"
                />
                <div className="text-right">
                  <p className="font-medium">{participant.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {participant.role === 'OWNER' && (
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded">
                        مالک
                      </span>
                    )}
                    {isWeighted && <span>وزن: {participant.weight}</span>}
                  </div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ))}
        </Card>
      </div>

      {/* Fixed Add Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <Button onClick={openAddModal} className="w-full" size="lg">
          + افزودن عضو جدید
        </Button>
      </div>

      {/* Add Participant Modal */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="افزودن عضو جدید"
      >
        <div className="space-y-4">
          <Input
            label="نام"
            placeholder="نام عضو جدید"
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
        title="ویرایش عضو"
      >
        {editingParticipant && (
          <div className="space-y-4">
            <Input
              label="نام"
              placeholder="نام عضو"
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
                <Button
                  variant="secondary"
                  onClick={() => setDeletingParticipant(editingParticipant)}
                  className="!text-red-600 !border-red-200 hover:!bg-red-50"
                >
                  حذف
                </Button>
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
        title="حذف عضو"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            آیا مطمئن هستید که می‌خواهید «{deletingParticipant?.name}» را حذف کنید؟
          </p>
          <p className="text-sm text-gray-500">
            اگر این عضو در هزینه‌ها یا تسویه‌ها شرکت داشته باشد، امکان حذف وجود ندارد.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeletingParticipant(null)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleDelete}
              loading={deleting}
              className="flex-1 !bg-red-500 hover:!bg-red-600"
            >
              حذف
            </Button>
          </div>
        </div>
      </BottomSheet>
    </main>
  )
}
