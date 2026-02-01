'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, Toast } from '@/components/ui'
import { UnifiedHeader, FormLayout, FormSection, FormError } from '@/components/layout'
import { parseMoney } from '@/lib/utils/money'
import { useProject, useProjectSummary, useCreateSettlement } from '@/hooks/useProjects'
import {
  TransferPreview,
  ParticipantSelector,
  AmountInput,
  ReceiptUpload,
  SettlementConfirmSheet,
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

interface ParticipantBalance {
  participantId: string
  participantName: string
  totalPaid: number
  totalShare: number
  balance: number
}

interface ProjectSummary {
  projectId: string
  projectName: string
  totalExpenses: number
  currency: string
  participantBalances: ParticipantBalance[]
  settlements: Array<{
    fromId: string
    fromName: string
    toId: string
    toName: string
    amount: number
  }>
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function AddSettlementPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // ── React Query Hooks ───────────────────────────────────────
  const { data: projectData, isLoading: projectLoading } = useProject(projectId, { includeExpenses: false })
  const { data: summaryData, isLoading: summaryLoading } = useProjectSummary(projectId)
  const createSettlementMutation = useCreateSettlement(projectId)

  // ── Extract Data ────────────────────────────────────────────
  const project = useMemo(() => projectData?.project || null, [projectData])
  const summary = useMemo(() => summaryData?.summary || null, [summaryData])

  // ── UI State ────────────────────────────────────────────────
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Form State ──────────────────────────────────────────────
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  // ── Loading State ───────────────────────────────────────────
  const loading = projectLoading || summaryLoading

  // ── Set Contextual Defaults ─────────────────────────────────
  // UX: Pre-fill largest debtor → largest creditor for convenience
  useEffect(() => {
    if (!project || !summary || fromId || toId) return

    const balances = summary.participantBalances
    if (!balances || balances.length === 0) {
      // Fallback: first two participants if no balance data
      if (project.participants.length >= 2) {
        setFromId(project.participants[0].id)
        setToId(project.participants[1].id)
      }
      return
    }

    // Find largest debtor (most negative balance)
    const largestDebtor = balances.reduce((max, p) =>
      p.balance < max.balance ? p : max
    )

    // Find largest creditor (most positive balance)
    const largestCreditor = balances.reduce((max, p) =>
      p.balance > max.balance ? p : max
    )

    // Set defaults if they're different people
    if (largestDebtor.participantId !== largestCreditor.participantId) {
      setFromId(largestDebtor.participantId)
      setToId(largestCreditor.participantId)
    } else if (project.participants.length >= 2) {
      // Fallback if same person (shouldn't happen, but safety)
      setFromId(project.participants[0].id)
      setToId(project.participants[1].id)
    }
  }, [project, summary, fromId, toId])

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

  const handleSubmit = useCallback(() => {
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

    // Balance validation
    if (summary) {
      const fromBalance = summary.participantBalances.find(b => b.participantId === fromId)
      const toBalance = summary.participantBalances.find(b => b.participantId === toId)

      if (fromBalance && toBalance) {
        // Calculate the actual outstanding balance between these two participants
        const outstandingBalance = Math.abs(fromBalance.balance - toBalance.balance)

        if (parsedAmount > outstandingBalance) {
          setError(`مبلغ نباید از بدهی واقعی (${outstandingBalance.toLocaleString('fa-IR')} ${summary.currency}) بیشتر باشه`)
          return
        }

        // UX: Show confirmation for large amounts (> 50% of outstanding balance)
        if (parsedAmount > outstandingBalance * 0.5) {
          setShowConfirmation(true)
          return
        }
      }
    }

    // All validations passed - proceed with submission
    confirmSubmit()
  }, [fromId, toId, amount, summary])

  const confirmSubmit = useCallback(async () => {
    setShowConfirmation(false)
    setError('')

    const parsedAmount = parseMoney(amount)
    if (!parsedAmount) return

    try {
      await createSettlementMutation.mutateAsync({
        fromId,
        toId,
        amount: parsedAmount,
        note: note.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
      })

      // Success feedback
      setToast({ message: 'تسویه با موفقیت ثبت شد ✓', type: 'success' })

      // Navigate back after brief delay to show toast
      setTimeout(() => {
        router.push(`/project/${projectId}`)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت تسویه')
      setToast({ message: 'خطا در ثبت تسویه', type: 'error' })
    }
  }, [fromId, toId, amount, note, receiptUrl, createSettlementMutation, router, projectId])

  // ── Computed Values ─────────────────────────────────────────

  const fromParticipant = project?.participants.find((p) => p.id === fromId) || null
  const toParticipant = project?.participants.find((p) => p.id === toId) || null
  const parsedAmount = parseMoney(amount)

  // Validation state
  const amountValid = parsedAmount && parsedAmount > 0
  const participantsValid = fromId && toId && fromId !== toId
  let balanceValid = true
  let balanceError = ''

  if (summary && fromId && toId && parsedAmount) {
    const fromBalance = summary.participantBalances.find(b => b.participantId === fromId)
    const toBalance = summary.participantBalances.find(b => b.participantId === toId)

    if (fromBalance && toBalance) {
      const outstandingBalance = Math.abs(fromBalance.balance - toBalance.balance)
      if (parsedAmount > outstandingBalance) {
        balanceValid = false
        balanceError = `بیشتر از بدهی واقعی (${outstandingBalance.toLocaleString('fa-IR')} ${summary.currency})`
      }
    }
  }

  const isValid = participantsValid && amountValid && balanceValid
  const submitting = createSettlementMutation.isPending

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
    <FormLayout
      header={
        <UnifiedHeader
          variant="form"
          title="صاف‌کردن حساب"
          subtitle="یه پرداخت انجام شده؟ اینجا ثبتش کن"
          showBack
          onBack={handleBack}
        />
      }
      hero={
        <TransferPreview
          from={fromParticipant}
          to={toParticipant}
          amount={parsedAmount}
          currency={project.currency}
          onSwap={handleSwap}
        />
      }
      footer={
        <>
          {fromId && toId && fromId === toId && (
            <p className="text-red-500 text-xs text-center mb-2">
              پرداخت‌کننده و دریافت‌کننده نمی‌تونن یکی باشن
            </p>
          )}
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!isValid || uploadingImage}
            className="w-full !bg-green-500 hover:!bg-green-600 shadow-lg shadow-green-500/20"
            size="lg"
          >
            {submitting ? 'در حال ثبت...' : 'حساب صاف شد ✓'}
          </Button>
        </>
      }
    >
      {/* Error Message */}
      {error && <FormError message={error} />}

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
      <AmountInput
        value={amount}
        onChange={setAmount}
        currency={project.currency}
        error={!amountValid && amount ? 'مبلغ باید بیشتر از صفر باشه' : balanceError}
      />

      {/* Note - Optional */}
      <FormSection title="توضیح" optional>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="اگه خواستی، توضیح کوتاه بنویس"
        />
      </FormSection>

      {/* Receipt Upload */}
      <ReceiptUpload
        preview={receiptPreview}
        uploading={uploadingImage}
        onSelect={handleImageSelect}
        onRemove={handleRemoveReceipt}
      />

      {/* Confirmation Dialog for Large Amounts */}
      <SettlementConfirmSheet
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmSubmit}
        fromName={fromParticipant?.name || ''}
        toName={toParticipant?.name || ''}
        amount={parsedAmount || 0}
        currency={project.currency}
        loading={submitting}
      />

      {/* Success/Error Toast */}
      <Toast
        isOpen={!!toast}
        onClose={() => setToast(null)}
        message={toast?.message || ''}
        type={toast?.type || 'info'}
        duration={3000}
      />
    </FormLayout>
  )
}
