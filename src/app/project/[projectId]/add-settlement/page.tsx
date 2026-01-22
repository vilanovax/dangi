'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { parseMoney } from '@/lib/utils/money'
import {
  SettlementHeader,
  ParticipantSelector,
  AmountInput,
  ReceiptUpload,
} from './components'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Project {
  id: string
  name: string
  currency: string
  participants: Participant[]
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function AddSettlementPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // ── Data State ──────────────────────────────────────────────
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')

  // ── Form State ──────────────────────────────────────────────
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  // ── Fetch Project ───────────────────────────────────────────

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (!res.ok) throw new Error('پروژه یافت نشد')

        const data = await res.json()
        setProject(data.project)

        // Set defaults - first two participants
        if (data.project.participants.length >= 2) {
          setFromId(data.project.participants[0].id)
          setToId(data.project.participants[1].id)
        } else if (data.project.participants.length === 1) {
          setFromId(data.project.participants[0].id)
        }
      } catch {
        setError('خطا در بارگذاری پروژه')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  // ── Handlers ────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleSwap = useCallback(() => {
    setFromId(toId)
    setToId(fromId)
  }, [fromId, toId])

  const handleImageSelect = useCallback(async (file: File) => {
    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      setReceiptPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
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
      setReceiptUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در آپلود تصویر')
      setReceiptPreview(null)
    } finally {
      setUploadingImage(false)
    }
  }, [])

  const handleRemoveReceipt = useCallback(() => {
    setReceiptUrl(null)
    setReceiptPreview(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    // Validation
    if (!fromId) {
      setError('پرداخت‌کننده رو انتخاب کن')
      return
    }

    if (!toId) {
      setError('دریافت‌کننده رو انتخاب کن')
      return
    }

    if (fromId === toId) {
      setError('پرداخت‌کننده و دریافت‌کننده نمی‌تونن یکی باشن')
      return
    }

    const parsedAmount = parseMoney(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('مبلغ باید بیشتر از صفر باشه')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId,
          toId,
          amount: parsedAmount,
          note: note.trim() || undefined,
          receiptUrl: receiptUrl || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ثبت تسویه')
      }

      router.push(`/project/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت تسویه')
    } finally {
      setSubmitting(false)
    }
  }, [fromId, toId, amount, note, receiptUrl, projectId, router])

  // ── Computed Values ─────────────────────────────────────────

  const fromParticipant = project?.participants.find((p) => p.id === fromId) || null
  const toParticipant = project?.participants.find((p) => p.id === toId) || null
  const parsedAmount = parseMoney(amount)
  const isValid = fromId && toId && fromId !== toId && parsedAmount && parsedAmount > 0

  // ── Loading State ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Error State ─────────────────────────────────────────────

  if (!project) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center bg-gray-50 dark:bg-gray-950">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">😕</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400">{error || 'پروژه یافت نشد'}</p>
        <button onClick={handleBack} className="mt-4 px-4 py-2 text-green-500 hover:underline">
          بازگشت
        </button>
      </div>
    )
  }

  // ── Main Render ─────────────────────────────────────────────

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-28">
      {/* Green Header with Transfer Preview */}
      <SettlementHeader
        projectName={project.name}
        from={fromParticipant}
        to={toParticipant}
        amount={parsedAmount}
        currency={project.currency}
        onBack={handleBack}
        onSwap={handleSwap}
      />

      <div className="p-4 space-y-5">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Select Payer (From) */}
        <ParticipantSelector
          participants={project.participants}
          selectedId={fromId}
          disabledId={toId}
          onSelect={setFromId}
          label="پرداخت‌کننده (کسی که پول داده)"
          color="blue"
        />

        {/* Select Receiver (To) */}
        <ParticipantSelector
          participants={project.participants}
          selectedId={toId}
          disabledId={fromId}
          onSelect={setToId}
          label="دریافت‌کننده (کسی که پول گرفته)"
          color="green"
        />

        {/* Amount */}
        <AmountInput value={amount} onChange={setAmount} currency={project.currency} />

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            توضیحات
            <span className="text-gray-400 font-normal mr-1">(اختیاری)</span>
          </label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثلاً: بابت هزینه‌های رستوران"
          />
        </div>

        {/* Receipt Upload */}
        <ReceiptUpload
          preview={receiptPreview}
          uploading={uploadingImage}
          onSelect={handleImageSelect}
          onRemove={handleRemoveReceipt}
        />
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={!isValid || uploadingImage}
          className="w-full !bg-green-500 hover:!bg-green-600"
          size="lg"
        >
          {submitting ? 'در حال ثبت...' : 'ثبت تسویه'}
        </Button>
      </div>
    </main>
  )
}
