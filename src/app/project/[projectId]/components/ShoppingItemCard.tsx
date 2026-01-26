'use client'

import { useState } from 'react'
import type { ShoppingItem } from '@/types'
import { Avatar } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'

interface ShoppingItemCardProps {
  item: ShoppingItem
  onToggle: (itemId: string, isChecked: boolean) => Promise<void>
  onDelete: (itemId: string) => Promise<void>
  onEdit: (itemId: string, text: string, quantity?: string, note?: string) => Promise<void>
}

export function ShoppingItemCard({ item, onToggle, onDelete, onEdit }: ShoppingItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.text)
  const [editQuantity, setEditQuantity] = useState(item.quantity || '')
  const [editNote, setEditNote] = useState(item.note || '')
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editError, setEditError] = useState('')

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      await onToggle(item.id, !item.isChecked)
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('این آیتم حذف بشه؟')) return

    setIsDeleting(true)
    try {
      await onDelete(item.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      setEditError('متن آیتم نباید خالی باشه')
      return
    }

    try {
      await onEdit(
        item.id,
        editText.trim(),
        editQuantity.trim() || undefined,
        editNote.trim() || undefined
      )
      setIsEditing(false)
      setEditError('')
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'خطا در ویرایش')
    }
  }

  const handleCancelEdit = () => {
    setEditText(item.text)
    setEditQuantity(item.quantity || '')
    setEditNote(item.note || '')
    setIsEditing(false)
    setEditError('')
  }

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="مثلاً: پیتزا، نوشیدنی، اسنک…"
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 dark:focus:border-purple-700 bg-gray-50/50 dark:bg-gray-900/30"
          autoFocus
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={editQuantity}
            onChange={(e) => setEditQuantity(e.target.value)}
            placeholder="تعداد (اختیاری)"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 dark:focus:border-purple-700 bg-gray-50/50 dark:bg-gray-900/30"
          />
          <input
            type="text"
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="یادداشت (اختیاری)"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 dark:focus:border-purple-700 bg-gray-50/50 dark:bg-gray-900/30"
          />
        </div>
        {editError && (
          <p className="text-xs text-red-500 dark:text-red-400">{editError}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSaveEdit}
            className="flex-1 py-2 px-3 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
          >
            ذخیره
          </button>
          <button
            onClick={handleCancelEdit}
            className="flex-1 py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            لغو
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-xl border transition-all ${
        item.isChecked
          ? 'border-gray-100 dark:border-gray-800 opacity-70'
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800/50'
      }`}
    >
      <div className="p-3 flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all ${
            item.isChecked
              ? 'bg-purple-500 border-purple-500'
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
          } ${isToggling ? 'opacity-50' : ''}`}
        >
          {item.isChecked && (
            <svg
              className="w-full h-full text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  item.isChecked
                    ? 'line-through text-gray-400 dark:text-gray-600'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {item.text}
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-2 mt-1">
                {item.quantity && (
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {item.quantity}
                  </span>
                )}
                {item.note && (
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    • {item.note}
                  </span>
                )}
              </div>

              {/* Added by */}
              {item.addedBy && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Avatar
                    name={item.addedBy.name}
                    avatar={deserializeAvatar(item.addedBy.avatar || null, item.addedBy.name)}
                    size="sm"
                  />
                  <span className="text-xs text-gray-400 dark:text-gray-600">
                    {item.addedBy.name}
                  </span>
                </div>
              )}
            </div>

            {/* Actions - Show on hover for unchecked items */}
            {!item.isChecked && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                  title="ویرایش"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="حذف"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
