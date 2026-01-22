'use client'

import { Button, Input, Card, Avatar } from '@/components/ui'
import { formatInputAmount, getCurrencyLabel, formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'
import type { TemplateLabels } from '@/lib/types/domain'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface ExpenseEditFormProps {
  // Form values
  title: string
  amount: string
  categoryId: string | null
  paidById: string
  includedParticipantIds: string[]
  // Project data
  participants: Participant[]
  categories: Category[]
  currency: string
  labels: TemplateLabels
  // Handlers
  onTitleChange: (value: string) => void
  onAmountChange: (value: string) => void
  onCategoryChange: (id: string | null) => void
  onPaidByChange: (id: string) => void
  onToggleParticipant: (id: string) => void
  onSelectAllParticipants: () => void
  onSave: () => void
  onCancel: () => void
  // State
  saving: boolean
  sharePreview: number | null
  error: string
}

/**
 * Edit form for expense
 * Pre-filled with current values, same structure as add-expense
 */
export function ExpenseEditForm({
  title,
  amount,
  categoryId,
  paidById,
  includedParticipantIds,
  participants,
  categories,
  currency,
  labels,
  onTitleChange,
  onAmountChange,
  onCategoryChange,
  onPaidByChange,
  onToggleParticipant,
  onSelectAllParticipants,
  onSave,
  onCancel,
  saving,
  sharePreview,
  error,
}: ExpenseEditFormProps) {
  const isValid =
    title.trim() && amount && paidById && includedParticipantIds.length > 0

  return (
    <>
      <div className="p-4 space-y-5">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <Input
            label={labels.expenseTitleLabel}
            placeholder={labels.expenseTitlePlaceholder}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 text-center">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
            {labels.amountLabel}
          </label>
          <div className="flex items-center justify-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder={labels.amountPlaceholder}
              value={amount}
              onChange={(e) => onAmountChange(formatInputAmount(e.target.value))}
              className="text-3xl font-bold text-center w-full bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
            <span className="text-base text-gray-400 font-medium">
              {getCurrencyLabel(currency)}
            </span>
          </div>
          {sharePreview !== null && includedParticipantIds.length > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              سهم هر {labels.participantTerm}:{' '}
              <span className="text-gray-500">{formatMoney(sharePreview, currency)}</span>
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {labels.categoryLabel}
            <span className="text-gray-400 font-normal mr-1">(اختیاری)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCategoryChange(null)}
              className={`px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                categoryId === null
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              بدون دسته
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`px-3 py-2 rounded-xl border-2 text-sm transition-all flex items-center gap-1.5 ${
                  categoryId === cat.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Paid By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {labels.paidByLabel}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {participants.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => onPaidByChange(p.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full border-2 text-sm transition-all flex items-center gap-2 ${
                  paidById === p.id
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <Avatar
                  avatar={deserializeAvatar(p.avatar || null, p.name)}
                  name={p.name}
                  size="sm"
                />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Split Between */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {labels.splitBetweenLabel}
            </label>
            <button
              type="button"
              onClick={onSelectAllParticipants}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              انتخاب همه
            </button>
          </div>

          <Card className="divide-y divide-gray-100 dark:divide-gray-800">
            {participants.map((p) => {
              const isIncluded = includedParticipantIds.includes(p.id)
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => onToggleParticipant(p.id)}
                  className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      avatar={deserializeAvatar(p.avatar || null, p.name)}
                      name={p.name}
                      size="md"
                    />
                    <span className={isIncluded ? '' : 'text-gray-400'}>{p.name}</span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      isIncluded
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isIncluded && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              )
            })}
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1" disabled={saving}>
            انصراف
          </Button>
          <Button onClick={onSave} loading={saving} disabled={!isValid} className="flex-1">
            ذخیره تغییرات
          </Button>
        </div>
      </div>
    </>
  )
}
