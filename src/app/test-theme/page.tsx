'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useEffect, useState } from 'react'

export default function TestThemePage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [hasClass, setHasClass] = useState(false)

  useEffect(() => {
    const check = () => {
      setHasClass(document.documentElement.classList.contains('dark'))
    }
    check()
    const interval = setInterval(check, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🔍 Dark Mode Test
        </h1>

        <div className="p-6 rounded-xl bg-gray-100 dark:bg-gray-800 space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Theme:</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{theme}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Resolved Theme:</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{resolvedTheme}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">HTML has .dark class:</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {hasClass ? '✅ Yes' : '❌ No'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">localStorage value:</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {typeof window !== 'undefined' ? localStorage.getItem('dangi_theme') || 'null' : 'SSR'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Change Theme:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              💻 System
            </button>
          </div>
        </div>

        <div className="p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 space-y-2">
          <p className="text-gray-900 dark:text-white font-semibold">
            Test Elements:
          </p>
          <div className="p-4 bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 rounded">
            🔴 Red background (should change in dark mode)
          </div>
          <div className="p-4 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 rounded">
            🟢 Green background (should change in dark mode)
          </div>
          <div className="p-4 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded">
            🔵 Blue background (should change in dark mode)
          </div>
        </div>

        <button
          onClick={() => {
            document.documentElement.classList.toggle('dark')
            alert('Toggled .dark class manually. Check the display.')
          }}
          className="w-full px-4 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          🔧 Manual Toggle (for testing)
        </button>
      </div>
    </div>
  )
}
