'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, BottomSheet, Avatar, AvatarPicker, SettingsPageSkeleton } from '@/components/ui'
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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
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

    fetchUser()
    setCurrentTheme(getTheme())
  }, [])

  const handleSaveProfile = useCallback(async () => {
    if (!newName.trim()) return

    setSaving(true)
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
      showToast('success', 'پروفایل با موفقیت ذخیره شد')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'خطا در ذخیره')
    } finally {
      setSaving(false)
    }
  }, [newName, newAvatar, showToast])

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }, [router])

  const handleThemeChange = useCallback((theme: Theme) => {
    setThemeStorage(theme)
    setCurrentTheme(theme)
    setShowThemeSheet(false)
  }, [])

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
    return <SettingsPageSkeleton />
  }

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 sticky top-0 z-10 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">تنظیمات</h1>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1">پروفایل</h2>
          <Card className="!p-0 overflow-hidden">
            {user ? (
              editingProfile ? (
                <div className="p-4 space-y-4">
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

                  {newName.trim().length > 0 && (
                    <AvatarPicker
                      name={newName}
                      value={newAvatar}
                      onChange={setNewAvatar}
                    />
                  )}

                  <div className="flex gap-2 pt-2">
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
                <button
                  onClick={() => setEditingProfile(true)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <Avatar
                    avatar={deserializeAvatar(user.avatar || null, user.name)}
                    name={user.name}
                    size="lg"
                  />
                  <div className="flex-1 text-right">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dir-ltr text-right">{user.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-500">
                    <span className="text-sm">ویرایش</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </button>
              )
            ) : (
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">کاربر مهمان</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">برای ذخیره اطلاعات وارد شوید</p>
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
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1">ظاهر</h2>
          <Card className="!p-0 overflow-hidden">
            <button
              onClick={() => setShowThemeSheet(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                {currentTheme === 'dark' ? (
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : currentTheme === 'light' ? (
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 text-right">
                <p className="font-medium">تم برنامه</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getThemeLabel(currentTheme)}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </Card>
        </section>

        {/* Account Section */}
        {user && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1">حساب کاربری</h2>
            <Card className="!p-0 overflow-hidden">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="flex-1 text-right">
                  <p className="font-medium text-red-500">خروج از حساب</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">از حساب کاربری خارج شوید</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Card>
          </section>
        )}

        {/* About Section */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1">درباره</h2>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">نسخه</p>
                </div>
                <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">1.0.0-beta</span>
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">سازنده</p>
                </div>
                <span className="text-sm font-medium">دنگی</span>
              </div>
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
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                currentTheme === theme
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                currentTheme === theme
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}>
                {theme === 'light' && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
                {theme === 'dark' && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                {theme === 'system' && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-medium ${
                currentTheme === theme ? 'text-blue-600 dark:text-blue-400' : ''
              }`}>
                {getThemeLabel(theme)}
              </span>
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
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              آیا مطمئن هستید که می‌خواهید از حساب کاربری خارج شوید؟
            </p>
          </div>
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
