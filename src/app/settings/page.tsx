'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, BottomSheet, Avatar, AvatarPicker } from '@/components/ui'
import type { Avatar as AvatarType } from '@/lib/types/avatar'
import { deserializeAvatar, serializeAvatar } from '@/lib/types/avatar'

const THEME_KEY = 'dangi_theme'

type Theme = 'light' | 'dark' | 'system'

interface User {
  id: string
  name: string
  phone: string
  avatar?: string | null
}

function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem(THEME_KEY) as Theme) || 'system'
}

function setThemeStorage(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export default function SettingsPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState<AvatarType | null>(null)
  const [saving, setSaving] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<Theme>('system')
  const [showThemeSheet, setShowThemeSheet] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUser()
    setCurrentTheme(getTheme())
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setNewName(data.user?.name || '')
        if (data.user?.avatar) {
          setNewAvatar(deserializeAvatar(data.user.avatar, data.user.name))
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!newName.trim()) return

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          avatar: newAvatar ? serializeAvatar(newAvatar) : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ذخیره')
      }

      const data = await res.json()
      setUser(data.user)
      setEditingProfile(false)
      setSuccess('پروفایل با موفقیت ذخیره شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleThemeChange = (theme: Theme) => {
    setThemeStorage(theme)
    setCurrentTheme(theme)
    setShowThemeSheet(false)
  }

  const getThemeLabel = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return 'روشن'
      case 'dark':
        return 'تاریک'
      case 'system':
        return 'پیروی از سیستم'
    }
  }

  const getThemeIcon = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'system':
        return '📱'
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <main className="min-h-dvh p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">تنظیمات</h1>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-sm text-center">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">پروفایل</h2>
          <Card>
            {user ? (
              // کاربر لاگین کرده
              editingProfile ? (
                <div className="space-y-4">
                  {/* Avatar در حالت ویرایش */}
                  <div className="flex justify-center">
                    <Avatar
                      avatar={newAvatar || deserializeAvatar(user.avatar || null, newName || user.name)}
                      name={newName || user.name}
                      size="xl"
                    />
                  </div>

                  <Input
                    label="نام"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="نام شما"
                  />

                  {/* Avatar Picker */}
                  {newName.trim().length > 0 && (
                    <AvatarPicker
                      name={newName}
                      value={newAvatar}
                      onChange={setNewAvatar}
                    />
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      loading={saving}
                      disabled={!newName.trim()}
                      className="flex-1"
                    >
                      ذخیره
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingProfile(false)
                        setNewName(user.name)
                        setNewAvatar(user.avatar ? deserializeAvatar(user.avatar, user.name) : null)
                      }}
                      className="flex-1"
                    >
                      لغو
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Avatar
                    avatar={deserializeAvatar(user.avatar || null, user.name)}
                    name={user.name}
                    size="xl"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{user.name}</p>
                    <p className="text-sm text-gray-500 dir-ltr text-right">{user.phone}</p>
                  </div>
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="text-blue-500 text-sm"
                  >
                    ویرایش
                  </button>
                </div>
              )
            ) : (
              // کاربر مهمان
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xl">
                  👤
                </div>
                <div className="flex-1">
                  <p className="font-semibold">کاربر مهمان</p>
                  <p className="text-xs text-gray-500">برای ذخیره اطلاعات وارد شوید</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push('/auth')}
                >
                  ورود
                </Button>
              </div>
            )}
          </Card>
        </section>

        {/* Appearance Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">ظاهر</h2>
          <Card>
            <button
              onClick={() => setShowThemeSheet(true)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getThemeIcon(currentTheme)}</span>
                <div className="text-right">
                  <p className="font-medium">تم</p>
                  <p className="text-xs text-gray-500">{getThemeLabel(currentTheme)}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </Card>
        </section>

        {/* Account Section - فقط برای کاربر لاگین کرده */}
        {user && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">حساب کاربری</h2>
            <Card>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-between text-red-500"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚪</span>
                  <div className="text-right">
                    <p className="font-medium">خروج از حساب</p>
                    <p className="text-xs text-gray-500">از حساب کاربری خارج شوید</p>
                  </div>
                </div>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Card>
          </section>
        )}

        {/* About Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">درباره</h2>
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">نسخه</span>
              <span className="font-mono text-sm">1.0.0-beta</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">سازنده</span>
              <span className="text-sm">دنگی</span>
            </div>
          </Card>
        </section>
      </div>

      {/* Theme Selection Bottom Sheet */}
      <BottomSheet
        isOpen={showThemeSheet}
        onClose={() => setShowThemeSheet(false)}
        title="انتخاب تم"
      >
        <div className="space-y-2">
          {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                currentTheme === theme
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{getThemeIcon(theme)}</span>
              <span className="font-medium">{getThemeLabel(theme)}</span>
              {currentTheme === theme && (
                <svg className="w-5 h-5 mr-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Logout Confirmation Bottom Sheet */}
      <BottomSheet
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="خروج از حساب"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            آیا مطمئن هستید که می‌خواهید از حساب کاربری خارج شوید؟
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 !bg-red-500 hover:!bg-red-600"
            >
              خروج
            </Button>
          </div>
        </div>
      </BottomSheet>
    </main>
  )
}
