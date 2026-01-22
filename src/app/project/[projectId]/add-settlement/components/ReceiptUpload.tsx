'use client'

import { useRef } from 'react'

interface ReceiptUploadProps {
  preview: string | null
  uploading: boolean
  onSelect: (file: File) => void
  onRemove: () => void
}

/**
 * Receipt image upload with preview
 * Simple drag-and-drop style UI
 */
export function ReceiptUpload({
  preview,
  uploading,
  onSelect,
  onRemove,
}: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onSelect(file)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        تصویر رسید
        <span className="text-gray-400 font-normal mr-1">(اختیاری)</span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={preview}
            alt="رسید"
            className="w-full max-h-48 object-contain bg-gray-50 dark:bg-gray-800"
          />

          {/* Upload Progress Overlay */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                <span className="text-white text-sm">در حال آپلود...</span>
              </div>
            </div>
          )}

          {/* Remove Button */}
          {!uploading && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center hover:border-green-400 dark:hover:border-green-600 transition-colors group"
        >
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-green-50 dark:group-hover:bg-green-900/30 transition-colors">
            <svg
              className="w-6 h-6 text-gray-400 group-hover:text-green-500 transition-colors"
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
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            عکس رسید رو اینجا آپلود کنید
          </p>
        </button>
      )}
    </div>
  )
}
