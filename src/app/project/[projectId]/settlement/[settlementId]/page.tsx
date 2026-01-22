'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, BottomSheet, Avatar } from '@/components/ui'
import { parseMoney, formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Settlement {
  id: string
  amount: number
  note?: string | null
  receiptUrl?: string | null
  settledAt: string
  from: Participant
  to: Participant
  projectId: string
}

interface Project {
  id: string
  name: string
  currency: string
  participants: Participant[]
}

export default function SettlementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const settlementId = params.settlementId as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Edit form state
  const [editFromId, setEditFromId] = useState('')
  const [editToId, setEditToId] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editReceiptUrl, setEditReceiptUrl] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId, settlementId])

  const fetchData = async () => {
    try {
      const [settlementRes, projectRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/settlements/${settlementId}`),
        fetch(`/api/projects/${projectId}`),
      ])

      if (!settlementRes.ok) throw new Error('تسویه یافت نشد')
      if (!projectRes.ok) throw new Error('پروژه یافت نشد')

      const settlementData = await settlementRes.json()
      const projectData = await projectRes.json()

      setSettlement(settlementData.settlement)
      setProject(projectData.project)

      // Initialize edit form
      const s = settlementData.settlement
      setEditFromId(s.from.id)
      setEditToId(s.to.id)
      setEditAmount(s.amount.toString())
      setEditNote(s.note || '')
      setEditReceiptUrl(s.receiptUrl)
      if (s.receiptUrl) {
        setReceiptPreview(s.receiptUrl)
      }
    } catch {
      setError('خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setReceiptPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingImage(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در آپلود تصویر')
      }

      const data = await res.json()
      setEditReceiptUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در آپلود تصویر')
      setReceiptPreview(settlement?.receiptUrl || null)
    } finally {
      setUploadingImage(false)
    }
  }

  const removeReceipt = () => {
    setEditReceiptUrl(null)
    setReceiptPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!settlement) return

    if (editFromId === editToId) {
      setError('پرداخت‌کننده و دریافت‌کننده نمی‌تونن یکی باشن')
      return
    }

    const parsedAmount = parseMoney(editAmount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('مبلغ باید بیشتر از صفر باشه')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: editFromId,
          toId: editToId,
          amount: parsedAmount,
          note: editNote.trim() || null,
          receiptUrl: editReceiptUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ویرایش تسویه')
      }

      const data = await res.json()
      setSettlement(data.settlement)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ویرایش تسویه')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/settlements/${settlementId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در حذف تسویه')
      }

      router.push(`/project/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف تسویه')
      setDeleting(false)
    }
  }

  const cancelEdit = () => {
    if (settlement) {
      setEditFromId(settlement.from.id)
      setEditToId(settlement.to.id)
      setEditAmount(settlement.amount.toString())
      setEditNote(settlement.note || '')
      setEditReceiptUrl(settlement.receiptUrl || null)
      setReceiptPreview(settlement.receiptUrl || null)
    }
    setIsEditing(false)
    setError('')
  }

  const swapParticipants = () => {
    const temp = editFromId
    setEditFromId(editToId)
    setEditToId(temp)
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!settlement || !project) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center">
        <p className="text-gray-500">{error || 'تسویه یافت نشد'}</p>
        <Button onClick={() => router.back()} className="mt-4">
          بازگشت
        </Button>
      </div>
    )
  }

  const fromParticipant = project.participants.find(p => p.id === editFromId)
  const toParticipant = project.participants.find(p => p.id === editToId)

  return (
    <main className="min-h-dvh pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
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
              <h1 className="text-lg font-bold">
                {isEditing ? 'ویرایش تسویه' : 'جزئیات تسویه'}
              </h1>
              <p className="text-xs text-gray-500">
                {new Date(settlement.settledAt).toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {isEditing ? (
          /* Edit Mode */
          <>
            {/* Visual Transfer Display */}
            <div className="bg-gradient-to-l from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-2">پرداخت‌کننده</p>
                  {fromParticipant && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14">
                        <Avatar avatar={deserializeAvatar(fromParticipant.avatar || null, fromParticipant.name)} name={fromParticipant.name} size="xl" />
                      </div>
                      <span className="text-sm font-medium">{fromParticipant.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1 px-2">
                  <button
                    onClick={swapParticipants}
                    className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                  <span className="text-xs text-gray-400">جابجایی</span>
                </div>

                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-2">دریافت‌کننده</p>
                  {toParticipant && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14">
                        <Avatar avatar={deserializeAvatar(toParticipant.avatar || null, toParticipant.name)} name={toParticipant.name} size="xl" />
                      </div>
                      <span className="text-sm font-medium">{toParticipant.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Select From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                پرداخت‌کننده
              </label>
              <div className="flex flex-wrap gap-2">
                {project.participants.map((participant) => (
                  <button
                    key={participant.id}
                    onClick={() => setEditFromId(participant.id)}
                    disabled={participant.id === editToId}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                      editFromId === participant.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : participant.id === editToId
                        ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8">
                      <Avatar avatar={deserializeAvatar(participant.avatar || null, participant.name)} name={participant.name} size="sm" />
                    </div>
                    <span className="text-sm">{participant.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Select To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                دریافت‌کننده
              </label>
              <div className="flex flex-wrap gap-2">
                {project.participants.map((participant) => (
                  <button
                    key={participant.id}
                    onClick={() => setEditToId(participant.id)}
                    disabled={participant.id === editFromId}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                      editToId === participant.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : participant.id === editFromId
                        ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8">
                      <Avatar avatar={deserializeAvatar(participant.avatar || null, participant.name)} name={participant.name} size="sm" />
                    </div>
                    <span className="text-sm">{participant.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مبلغ پرداختی
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-4 py-4 text-2xl font-bold text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {project.currency === 'IRR' ? 'تومان' : project.currency}
                </span>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                توضیحات
              </label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="توضیحات اختیاری"
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تصویر رسید
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {receiptPreview ? (
                <div className="relative">
                  <img
                    src={receiptPreview}
                    alt="رسید"
                    className="w-full max-h-64 object-contain rounded-xl border border-gray-200 dark:border-gray-700"
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                      <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                    </div>
                  )}
                  <button
                    onClick={removeReceipt}
                    className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center hover:border-blue-400 transition-colors"
                >
                  <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">برای آپلود عکس رسید کلیک کنید</p>
                </button>
              )}
            </div>
          </>
        ) : (
          /* View Mode */
          <>
            {/* Transfer Visual */}
            <div className="bg-gradient-to-l from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-2">پرداخت‌کننده</p>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16">
                      <Avatar avatar={deserializeAvatar(settlement.from.avatar || null, settlement.from.name)} name={settlement.from.name} size="xl" />
                    </div>
                    <span className="font-medium">{settlement.from.name}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 px-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="text-lg font-bold text-green-600">
                    {formatMoney(settlement.amount, project.currency)}
                  </span>
                </div>

                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-2">دریافت‌کننده</p>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16">
                      <Avatar avatar={deserializeAvatar(settlement.to.avatar || null, settlement.to.name)} name={settlement.to.name} size="xl" />
                    </div>
                    <span className="font-medium">{settlement.to.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            {settlement.note && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">توضیحات</p>
                <p className="text-gray-700 dark:text-gray-300">{settlement.note}</p>
              </div>
            )}

            {/* Receipt Image */}
            {settlement.receiptUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تصویر رسید</p>
                <img
                  src={settlement.receiptUrl}
                  alt="رسید"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}

            {/* Date */}
            <div className="text-center text-sm text-gray-500">
              ثبت شده در {new Date(settlement.settledAt).toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </>
        )}
      </div>

      {/* Fixed Bottom Buttons */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={cancelEdit}
              className="flex-1"
              size="lg"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSave}
              loading={submitting}
              disabled={editFromId === editToId || !editAmount || uploadingImage}
              className="flex-1"
              size="lg"
            >
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <BottomSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="حذف تسویه"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            آیا از حذف این تسویه مطمئن هستید؟ این عمل قابل بازگشت نیست.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              className="flex-1"
            >
              حذف
            </Button>
          </div>
        </div>
      </BottomSheet>
    </main>
  )
}
