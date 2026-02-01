'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { BottomSheet, Button, Input } from '@/components/ui'
import { AccessBadge } from '@/components/ui'
import type { AccessRole, CreateAccessLinkInput } from '@/types/access-link'
import {
  ACCESS_LINK_TEMPLATES,
  EXPIRATION_PRESETS,
  calculateExpirationDate,
} from '@/types/access-link'

interface CreateAccessLinkSheetProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess: () => void
}

type Step = 'template' | 'customize' | 'generated'

/**
 * Create Access Link Bottom Sheet
 * 3-step flow: Template Selection → Customize → Generated Link with QR Code
 */
export function CreateAccessLinkSheet({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: CreateAccessLinkSheetProps) {
  const [step, setStep] = useState<Step>('template')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedExpiration, setSelectedExpiration] = useState<string>('no-expiration')
  const [maxUses, setMaxUses] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string>('')
  const [generatedToken, setGeneratedToken] = useState<string>('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const selectedTemplate = ACCESS_LINK_TEMPLATES.find((t) => t.id === selectedTemplateId)

  // Reset state when sheet opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('template')
        setSelectedTemplateId('')
        setName('')
        setDescription('')
        setSelectedExpiration('no-expiration')
        setMaxUses('')
        setGeneratedLink('')
        setGeneratedToken('')
        setQrCodeDataUrl('')
        setCopied(false)
      }, 300) // Wait for close animation
    }
  }, [isOpen])

  // Generate QR code when link is created
  useEffect(() => {
    if (generatedLink) {
      QRCode.toDataURL(generatedLink, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('QR code generation failed:', err))
    }
  }, [generatedLink])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setStep('customize')
  }

  const handleCreate = async () => {
    if (!selectedTemplate) return

    setIsCreating(true)
    try {
      const expirationPreset = EXPIRATION_PRESETS.find((p) => p.id === selectedExpiration)
      const expiresAt = expirationPreset?.days
        ? calculateExpirationDate(expirationPreset.days)
        : undefined

      const input: CreateAccessLinkInput = {
        projectId,
        scopes: selectedTemplate.scopes,
        role: selectedTemplate.role,
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        expiresAt,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      }

      const response = await fetch(`/api/projects/${projectId}/access-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'خطا در ایجاد لینک')
      }

      const { link } = await response.json()
      const linkUrl = `${window.location.origin}/access/${link.token}`
      setGeneratedToken(link.token)
      setGeneratedLink(linkUrl)
      setStep('generated')
      onSuccess()
    } catch (error) {
      console.error('Failed to create access link:', error)
      alert(error instanceof Error ? error.message : 'خطا در ایجاد لینک دسترسی')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="ایجاد لینک دسترسی">
      <div className="space-y-6">
        {/* Step 1: Template Selection */}
        {step === 'template' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              یک نوع دسترسی را انتخاب کنید
            </p>

            <div className="space-y-3">
              {ACCESS_LINK_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="w-full text-right p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-2xl">
                      {template.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {template.namePersian}
                        </h3>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                          {template.badge}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.descriptionPersian}
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Customize */}
        {step === 'customize' && selectedTemplate && (
          <div className="space-y-5">
            {/* Selected Template Preview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {selectedTemplate.namePersian}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {selectedTemplate.descriptionPersian}
                  </p>
                </div>
                <AccessBadge type={selectedTemplate.role} size="sm" />
              </div>
            </div>

            {/* Name Input (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نام لینک (اختیاری)
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: لینک خانواده، لینک دوستان"
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                برای شناسایی آسان‌تر لینک
              </p>
            </div>

            {/* Description Input (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                توضیحات (اختیاری)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="یادداشت یا توضیحات برای این لینک"
                rows={3}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
              />
            </div>

            {/* Expiration Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                انقضای لینک
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EXPIRATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedExpiration(preset.id)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      selectedExpiration === preset.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    {preset.labelPersian}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Uses (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                حداکثر تعداد استفاده (اختیاری)
              </label>
              <Input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="نامحدود"
                min="1"
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                اگر خالی بگذارید، تعداد استفاده نامحدود است
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setStep('template')}
                variant="secondary"
                className="flex-1"
              >
                بازگشت
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? 'در حال ایجاد...' : 'ایجاد لینک'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generated Link */}
        {step === 'generated' && (
          <div className="space-y-5">
            {/* Success Message */}
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                لینک با موفقیت ایجاد شد
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                این لینک را با دیگران به اشتراک بگذارید
              </p>
            </div>

            {/* QR Code */}
            {qrCodeDataUrl && (
              <div className="flex justify-center">
                <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            {/* Generated Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                لینک دسترسی
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white font-mono overflow-x-auto">
                  {generatedLink}
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>کپی شد</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>کپی</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                راهنمای اشتراک‌گذاری
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• لینک را برای دیگران ارسال کنید یا QR code را نمایش دهید</li>
                <li>• دسترسی بدون نیاز به ثبت‌نام فعال می‌شود</li>
                <li>
                  • می‌توانید لینک را از بخش{' '}
                  <span className="font-medium">لینک‌های اشتراک</span> مدیریت کنید
                </li>
              </ul>
            </div>

            {/* Close Button */}
            <Button onClick={handleClose} className="w-full">
              بستن
            </Button>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
