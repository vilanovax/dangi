'use client'

import { useState } from 'react'

interface ShoppingItemInputProps {
  onAdd: (text: string, quantity?: string, note?: string) => Promise<void>
}

export function ShoppingItemInput({ onAdd }: ShoppingItemInputProps) {
  const [text, setText] = useState('')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) {
      setError('چیزی بنویس!')
      return
    }

    setAdding(true)
    setError('')

    try {
      await onAdd(text.trim(), quantity.trim() || undefined, note.trim() || undefined)

      // Clear form
      setText('')
      setQuantity('')
      setNote('')
      setShowDetails(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در افزودن آیتم')
    } finally {
      setAdding(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-800/50 p-3">
        {/* Main Input */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-purple-300 dark:border-purple-700 flex items-center justify-center text-purple-400 dark:text-purple-600">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError('')
            }}
            placeholder="چی باید بخریم؟ مثلاً: پیتزا، نوشیدنی، اسنک…"
            disabled={adding}
            className="flex-1 text-sm bg-transparent placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none disabled:opacity-50"
          />

          {/* Toggle Details Button */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
          >
            {showDetails ? 'کمتر' : 'جزئیات'}
          </button>
        </div>

        {/* Details Inputs */}
        {showDetails && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="تعداد (اختیاری)"
              disabled={adding}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 dark:focus:border-purple-700 bg-gray-50/50 dark:bg-gray-900/30 disabled:opacity-50"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="یادداشت (اختیاری)"
              disabled={adding}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 dark:focus:border-purple-700 bg-gray-50/50 dark:bg-gray-900/30 disabled:opacity-50"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>
        )}

        {/* Submit - Only show when typing */}
        {text.trim() && (
          <button
            type="submit"
            disabled={adding}
            className="w-full mt-2 py-2 px-3 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'در حال افزودن…' : 'اضافه کن 🎉'}
          </button>
        )}
      </div>
    </form>
  )
}
