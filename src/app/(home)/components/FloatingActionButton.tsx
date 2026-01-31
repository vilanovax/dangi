/**
 * Floating Action Button (FAB)
 * Multi-purpose button for creating new projects or checklists
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FloatingActionButtonProps {
  onCreateProject: () => void
}

export function FloatingActionButton({ onCreateProject }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={closeMenu}
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-6 left-6 z-50">
        {/* Action Menu */}
        <div
          className={`absolute bottom-16 left-0 space-y-2 transition-all duration-300 ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {/* Create Project */}
          <button
            onClick={() => {
              onCreateProject()
              closeMenu()
            }}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl pl-4 pr-3 py-3 shadow-xl hover:shadow-2xl transition-all group hover:scale-105 active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
              پروژه جدید
            </span>
          </button>

          {/* Create Checklist */}
          <Link href="/checklists/new" onClick={closeMenu}>
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl pl-4 pr-3 py-3 shadow-xl hover:shadow-2xl transition-all group hover:scale-105 active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                چک‌لیست جدید
              </span>
            </div>
          </Link>
        </div>

        {/* Main FAB Button */}
        <button
          onClick={toggleMenu}
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl hover:shadow-3xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          <svg
            className="w-7 h-7 text-white transition-transform duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </>
  )
}
