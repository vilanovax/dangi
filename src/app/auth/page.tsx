'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Card, AvatarPicker, Avatar as AvatarDisplay } from '@/components/ui'
import type { Avatar } from '@/lib/types/avatar'
import { serializeAvatar, generateAutoAvatar } from '@/lib/types/avatar'

type AuthMode = 'login' | 'register'

// Convert Persian/Arabic digits to English
function toEnglishDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
}

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<AuthMode>('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Check if coming from guest access link
  const returnTo = searchParams.get('returnTo')
  const isFromGuestLink = !!returnTo && returnTo.includes('/project/')

  // Set mode based on query param
  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam === 'signup') {
      setMode('register')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { phone: toEnglishDigits(phone), password }
        : {
            phone: toEnglishDigits(phone),
            password,
            name: name.trim(),
            avatar: avatar ? serializeAvatar(avatar) : null,
          }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'خطایی رخ داد')
      }

      // Check if user is coming from a guest access link
      // If so, attach the project to their account
      if (isFromGuestLink) {
        try {
          const attachRes = await fetch('/api/auth/attach-project', {
            method: 'POST',
          })

          if (attachRes.ok) {
            const attachData = await attachRes.json()
            setSuccessMessage(attachData.message || 'این پروژه به حساب شما اضافه شد 🎉')

            // Wait a moment to show success message
            await new Promise(resolve => setTimeout(resolve, 1500))
          }
          // If attach fails, continue anyway - user is authenticated
        } catch {
          // Silently fail - user is authenticated, attachment is optional
        }
      }

      // Success - redirect
      const redirectUrl = returnTo || '/'
      router.push(redirectUrl)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <main className="min-h-dvh p-4 flex flex-col">
      {/* Header */}
      <div className="text-center py-8">
        {/* آواتار در هدر - فقط برای ثبت‌نام وقتی نام وارد شده */}
        {mode === 'register' && name.trim().length > 0 ? (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                const picker = document.getElementById('avatar-picker-section')
                picker?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className="mx-auto block"
            >
              <AvatarDisplay
                avatar={avatar || generateAutoAvatar(name)}
                name={name}
                size="xl"
                className="ring-4 ring-white dark:ring-gray-900 shadow-lg"
              />
            </button>
            <p className="text-xs text-gray-400 mt-2">برای تغییر آواتار کلیک کنید</p>
          </div>
        ) : (
          <div className="text-5xl mb-3">💰</div>
        )}
        <h1 className="text-2xl font-bold">دنگی</h1>
        <p className="text-gray-500 text-sm mt-1">
          {mode === 'login' ? 'وارد حساب خود شوید' : 'یک حساب جدید بسازید'}
        </p>
      </div>

      {/* Form */}
      <Card className="flex-1 max-w-sm mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <Input
                label="نام شما"
                placeholder="مثلاً: علی"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />

              {/* Avatar Picker - فقط وقتی نام وارد شده نشون بده */}
              {name.trim().length > 0 && (
                <div id="avatar-picker-section">
                  <AvatarPicker
                    name={name}
                    value={avatar}
                    onChange={setAvatar}
                  />
                </div>
              )}
            </>
          )}

          <Input
            label="شماره موبایل"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            dir="ltr"
            className="text-left"
            autoComplete="tel"
          />

          <Input
            label="رمز عبور"
            placeholder="حداقل ۴ کاراکتر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            dir="ltr"
            className="text-left"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="text-green-600 dark:text-green-400 text-sm text-center bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
              {successMessage}
            </p>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            {isFromGuestLink
              ? (mode === 'login' ? 'ورود و ذخیره پروژه' : 'ثبت‌نام و ذخیره پروژه')
              : (mode === 'login' ? 'ورود' : 'ثبت‌نام')
            }
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-blue-500 text-sm hover:underline"
          >
            {mode === 'login'
              ? 'حساب ندارید؟ ثبت‌نام کنید'
              : 'قبلاً ثبت‌نام کرده‌اید؟ وارد شوید'}
          </button>
        </div>
      </Card>

      {/* Skip for now */}
      <div className="text-center mt-6">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 text-sm hover:text-gray-600"
        >
          فعلاً بدون حساب ادامه می‌دهم
        </button>
      </div>
    </main>
  )
}
