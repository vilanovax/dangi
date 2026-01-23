'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card, BottomSheet, Avatar, AvatarPicker, SettingsPageSkeleton } from '@/components/ui'
import type { Avatar as AvatarType } from '@/lib/types/avatar'
import { deserializeAvatar, serializeAvatar } from '@/lib/types/avatar'

const THEME_KEY = 'dangi_theme'
const APP_VERSION = '1.0.0-beta'

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

  if (loading) {
    return <SettingsPageSkeleton />
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-gradient-to-br from-emerald-400/15 to-cyan-500/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-10 px-5 py-4 border-b border-white/50 dark:border-gray-800/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 -mr-2 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              تنظیمات
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">مدیریت حساب و تنظیمات برنامه</p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 left-4 right-4 z-50 p-4 rounded-2xl shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 backdrop-blur-xl ${
            toast.type === 'success'
              ? 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 text-white'
              : 'bg-gradient-to-r from-red-500/90 to-rose-500/90 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${toast.type === 'success' ? 'bg-white/20' : 'bg-white/20'} flex items-center justify-center`}>
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="relative p-5 space-y-6 pb-32">
        {/* Profile Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
            <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300">پروفایل</h2>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800/50 shadow-sm overflow-hidden">
            {user ? (
              editingProfile ? (
                <div className="p-5 space-y-5">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl opacity-40 animate-pulse" />
                      <Avatar
                        avatar={newAvatar || deserializeAvatar(user.avatar || null, newName || user.name)}
                        name={newName || user.name}
                        size="xl"
                        className="relative ring-4 ring-white dark:ring-gray-800"
                      />
                    </div>
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

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleSaveProfile}
                      loading={saving}
                      disabled={!newName.trim()}
                      className="flex-1 !bg-gradient-to-r !from-blue-500 !to-purple-600"
                    >
                      ذخیره تغییرات
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
                      انصراف
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                    <Avatar
                      avatar={deserializeAvatar(user.avatar || null, user.name)}
                      name={user.name}
                      size="lg"
                      className="relative ring-2 ring-white/50 dark:ring-gray-800/50"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{user.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-500 group-hover:text-blue-600 transition-colors">ویرایش</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                </button>
              )
            ) : (
              <div className="flex items-center gap-4 p-5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-700 dark:text-gray-200">کاربر مهمان</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">برای ذخیره اطلاعات وارد شوید</p>
                </div>
                <Button
                  onClick={() => router.push('/auth')}
                  className="!bg-gradient-to-r !from-blue-500 !to-purple-600"
                >
                  ورود
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Appearance Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
            <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300">ظاهر و نمایش</h2>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800/50 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowThemeSheet(true)}
              className="w-full flex items-center gap-4 p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
            >
              <div className="relative">
                <div className={`absolute inset-0 rounded-2xl blur-lg opacity-40 ${
                  currentTheme === 'dark'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                    : currentTheme === 'light'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }`} />
                <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${
                  currentTheme === 'dark'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                    : currentTheme === 'light'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }`}>
                  {currentTheme === 'dark' ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : currentTheme === 'light' ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-gray-900 dark:text-white">تم برنامه</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{getThemeLabel(currentTheme)}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </button>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
            <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300">دسترسی سریع</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/" className="group">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-800/50 p-4 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">صفحه اصلی</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">مشاهده پروژه‌ها</p>
              </div>
            </Link>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'دنگی',
                    text: 'تقسیم هزینه‌ها با دنگی، ساده و سریع!',
                    url: window.location.origin,
                  })
                } else {
                  navigator.clipboard.writeText(window.location.origin)
                  showToast('success', 'لینک کپی شد')
                }
              }}
              className="group text-right"
            >
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-800/50 p-4 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">دعوت دوستان</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">اشتراک‌گذاری لینک</p>
              </div>
            </button>
          </div>
        </section>

        {/* Account Section */}
        {user && (
          <section>
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-rose-600 rounded-full" />
              <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300">حساب کاربری</h2>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800/50 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-4 p-5 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-colors group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <p className="font-semibold text-red-500">خروج از حساب</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">از حساب کاربری خارج شوید</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* About Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-1 h-5 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full" />
            <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300">درباره برنامه</h2>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800/50 shadow-sm overflow-hidden">
            {/* App Info Card */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                    <span className="text-3xl">💰</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">دنگی</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">تقسیم هزینه‌ها، ساده و سریع</p>
                </div>
              </div>
            </div>

            {/* Info Items */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">نسخه</p>
                </div>
                <span className="font-mono text-sm bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-xl font-medium">
                  {APP_VERSION}
                </span>
              </div>

              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">توسعه‌دهنده</p>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">تیم دنگی</span>
              </div>

              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">امنیت</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">ایمن</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              ساخته شده با ❤️ در ایران
            </p>
          </div>
        </section>
      </div>

      {/* Theme Selection Bottom Sheet */}
      <BottomSheet
        isOpen={showThemeSheet}
        onClose={() => setShowThemeSheet(false)}
        title="انتخاب تم"
      >
        <div className="grid grid-cols-3 gap-4">
          {([
            { theme: 'light' as Theme, icon: 'sun', gradient: 'from-amber-400 to-orange-500', label: 'روشن' },
            { theme: 'dark' as Theme, icon: 'moon', gradient: 'from-indigo-500 to-purple-600', label: 'تاریک' },
            { theme: 'system' as Theme, icon: 'device', gradient: 'from-blue-500 to-cyan-500', label: 'سیستم' },
          ]).map(({ theme, icon, gradient, label }) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all duration-300 ${
                currentTheme === theme
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {currentTheme === theme && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${currentTheme === theme ? 'shadow-blue-500/30' : ''}`}>
                {icon === 'sun' && (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
                {icon === 'moon' && (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                {icon === 'device' && (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              <span className={`text-sm font-semibold ${
                currentTheme === theme ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {label}
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
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 rounded-full blur-2xl opacity-50 animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl shadow-red-500/30">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-center text-lg">
              آیا مطمئن هستید که می‌خواهید خارج شوید؟
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
              className="flex-1 !bg-gradient-to-r !from-red-500 !to-rose-600 hover:!from-red-600 hover:!to-rose-700"
            >
              خروج از حساب
            </Button>
          </div>
        </div>
      </BottomSheet>
    </main>
  )
}
