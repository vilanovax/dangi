'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Category {
  id: string
  name: string
  icon?: string | null
}

export default function AddExpensePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [paidById, setPaidById] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  // Data state
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch participants and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [participantsRes, categoriesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/participants`),
          fetch(`/api/projects/${projectId}/categories`),
        ])

        if (participantsRes.ok) {
          const data = await participantsRes.json()
          setParticipants(data.participants || [])
          // Auto-select first participant
          if (data.participants?.length > 0) {
            setPaidById(data.participants[0].id)
          }
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(data.categories || [])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!title.trim()) {
      setError('عنوان الزامی است')
      return
    }

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('مبلغ باید عدد مثبت باشد')
      return
    }

    if (!paidById) {
      setError('پرداخت‌کننده الزامی است')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: amountNum,
          paidById,
          categoryId: categoryId || undefined,
          description: description.trim() || undefined,
          expenseDate: new Date(expenseDate).toISOString(),
          splitType: 'MANUAL', // Family template uses manual split
          splits: [
            {
              participantId: paidById,
              amount: amountNum,
            },
          ],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ثبت هزینه')
      }

      // Success - navigate back to dashboard
      router.push(`/project/${projectId}/family`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت هزینه')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">ثبت هزینه</h1>
        </div>
        <p className="text-red-100 text-sm mr-14">
          هزینه جدید خانواده را ثبت کنید
        </p>
      </div>

      {/* Form */}
      <div className="p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              عنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: خرید مواد غذایی"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Amount */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              مبلغ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-left"
              disabled={loading}
            />
          </div>

          {/* Paid By */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              پرداخت‌کننده <span className="text-red-500">*</span>
            </label>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">انتخاب کنید</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              دسته‌بندی
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">بدون دسته‌بندی</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              تاریخ
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              توضیحات
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات اضافی..."
              rows={3}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          {/* Info note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">تمپلیت خانواده</p>
                <p className="text-amber-700">
                  در این تمپلیت، هزینه‌ها به صورت ساده ثبت می‌شوند و نیازی به
                  تقسیم بین افراد نیست.
                </p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'در حال ثبت...' : '💸 ثبت هزینه'}
          </Button>
        </form>
      </div>
    </div>
  )
}
