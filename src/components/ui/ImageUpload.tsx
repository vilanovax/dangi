'use client'

import { useState, useRef, useCallback } from 'react'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  folder?: string
  label?: string
  placeholder?: string
  disabled?: boolean
}

/**
 * Image upload component with preview
 * Uploads to S3-compatible storage
 */
export function ImageUpload({
  value,
  onChange,
  folder = 'receipts',
  label = 'تصویر رسید',
  placeholder = 'عکس رسید یا فاکتور را آپلود کنید',
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ''
      }

      setError(null)
      setUploading(true)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'خطا در آپلود')
        }

        const data = await res.json()
        onChange(data.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در آپلود فایل')
      } finally {
        setUploading(false)
      }
    },
    [folder, onChange]
  )

  const handleRemove = useCallback(() => {
    onChange(null)
    setError(null)
  }, [onChange])

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          <span className="text-gray-400 font-normal mr-1">(اختیاری)</span>
        </label>
      )}

      {/* Preview */}
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="پیش‌نمایش"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 left-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            uploading
              ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-2" />
              <span className="text-sm text-blue-600 dark:text-blue-400">در حال آپلود...</span>
            </div>
          ) : (
            <>
              <svg
                className="w-10 h-10 text-gray-400 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">{placeholder}</span>
              <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP - حداکثر ۱۰ مگابایت</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="hidden"
          />
        </label>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
