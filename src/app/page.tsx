'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button, HomeHeaderSkeleton, ProjectCardSkeleton } from '@/components/ui'
import { getAllTemplates } from '@/lib/domain/templates'
import { useProjects } from '@/lib/hooks'
import {
  HomeHeader,
  ProjectCard,
  EmptyState,
  CreateProjectSheet,
} from './(home)/components'

// ─────────────────────────────────────────────────────────────
// LocalStorage Key
// ─────────────────────────────────────────────────────────────

const PROJECT_ORDER_KEY = 'dangi_project_order'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  template: string
  currency: string
  participantCount: number
  expenseCount: number
  totalExpenses: number
  myBalance: number
  isArchived: boolean
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const templates = getAllTemplates()

  // ── Data (SWR) ────────────────────────────────────────────
  const { projects, user, isLoading, refresh } = useProjects()

  // ── Modal State ─────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  // ── Drag & Drop State ─────────────────────────────────────
  const [orderedProjects, setOrderedProjects] = useState<Project[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const dragRef = useRef<{ startY: number; currentY: number }>({ startY: 0, currentY: 0 })

  // ── Load & Save Order ─────────────────────────────────────
  useEffect(() => {
    if (projects.length > 0) {
      const savedOrder = localStorage.getItem(PROJECT_ORDER_KEY)
      if (savedOrder) {
        try {
          const orderIds: string[] = JSON.parse(savedOrder)
          // Sort projects by saved order
          const sorted = [...projects].sort((a, b) => {
            const indexA = orderIds.indexOf(a.id)
            const indexB = orderIds.indexOf(b.id)
            // Projects not in saved order go to end
            if (indexA === -1 && indexB === -1) return 0
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
          })
          setOrderedProjects(sorted)
        } catch {
          setOrderedProjects(projects)
        }
      } else {
        setOrderedProjects(projects)
      }
    } else {
      setOrderedProjects([])
    }
  }, [projects])

  const saveOrder = useCallback((newOrder: Project[]) => {
    const orderIds = newOrder.map((p) => p.id)
    localStorage.setItem(PROJECT_ORDER_KEY, JSON.stringify(orderIds))
  }, [])

  // ── Filter Active & Archived Projects ───────────────────────
  const activeProjects = orderedProjects.filter((p) => !p.isArchived)
  const archivedProjects = orderedProjects.filter((p) => p.isArchived)

  // ── Handlers ────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    refresh()
    router.refresh()
  }, [router, refresh])

  const getTemplateIcon = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId)
      return template?.icon || '📁'
    },
    [templates]
  )

  const handleProjectDelete = useCallback(
    (id: string) => {
      const newProjects = orderedProjects.filter((p) => p.id !== id)
      setOrderedProjects(newProjects)
      saveOrder(newProjects)
      refresh()
    },
    [orderedProjects, refresh, saveOrder]
  )

  const handleProjectArchive = useCallback(
    (id: string, isArchived: boolean) => {
      // Optimistic update: update local state immediately
      const newProjects = orderedProjects.map((p) =>
        p.id === id ? { ...p, isArchived } : p
      )
      setOrderedProjects(newProjects)
      saveOrder(newProjects)
      // Refresh to ensure sync with server
      refresh()
    },
    [orderedProjects, refresh, saveOrder]
  )

  // ── Drag & Drop Handlers ──────────────────────────────────

  const handleDragStart = useCallback((index: number, e: React.TouchEvent | React.MouseEvent) => {
    setDraggedIndex(index)

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragRef.current = { startY: clientY, currentY: clientY }
  }, [])

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (draggedIndex === null) return

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragRef.current.currentY = clientY

    // Calculate which item we're over
    const elements = document.querySelectorAll('[data-project-index]')
    elements.forEach((el, i) => {
      const rect = el.getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      if (clientY > midY - 20 && clientY < midY + 20 && i !== draggedIndex) {
        setDragOverIndex(i)
      }
    })
  }, [draggedIndex])

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newProjects = [...orderedProjects]
      const [removed] = newProjects.splice(draggedIndex, 1)
      newProjects.splice(dragOverIndex, 0, removed)
      setOrderedProjects(newProjects)
      saveOrder(newProjects)
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [draggedIndex, dragOverIndex, orderedProjects, saveOrder])

  const moveProject = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= orderedProjects.length) return

    const newProjects = [...orderedProjects]
    const [removed] = newProjects.splice(fromIndex, 1)
    newProjects.splice(toIndex, 0, removed)
    setOrderedProjects(newProjects)
    saveOrder(newProjects)
  }, [orderedProjects, saveOrder])

  // ── Loading State ───────────────────────────────────────────

  if (isLoading) {
    return (
      <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-5 overflow-hidden">
        {/* Background Decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-20 w-60 h-60 bg-gradient-to-br from-emerald-400/15 to-cyan-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-orange-400/10 to-amber-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <HomeHeaderSkeleton />
          <div className="h-6 w-28 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl mb-4 animate-pulse" />
          <div className="space-y-4">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        </div>
      </main>
    )
  }

  // ── Main Render ─────────────────────────────────────────────

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-5 flex flex-col overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-gradient-to-br from-emerald-400/15 to-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-orange-400/10 to-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col flex-1">
        {/* Header */}
        <HomeHeader user={user} onLogout={handleLogout} />

        {/* Content */}
        {!user ? (
          // Guest State
          <EmptyState type="guest" />
        ) : activeProjects.length === 0 && archivedProjects.length === 0 ? (
          // No Projects State
          <EmptyState type="no-projects" />
        ) : (
          // Projects List
          <div className="flex-1">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
                  پروژه‌های شما
                </h2>
                <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                  {activeProjects.length}
                </span>
              </div>

              {activeProjects.length > 1 && (
                <button
                  onClick={() => setIsReordering(!isReordering)}
                  className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all duration-300 ${
                    isReordering
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:shadow-md'
                  }`}
                >
                  {isReordering ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      تمام
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      ترتیب
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Active Projects Grid */}
            <div
              className="space-y-4"
              onTouchMove={handleDragMove}
              onMouseMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              {activeProjects.map((project, index) => (
                <div
                  key={project.id}
                  data-project-index={index}
                  className={`relative transition-all duration-300 ${
                    draggedIndex === index
                      ? 'opacity-60 scale-[0.98] z-50'
                      : dragOverIndex === index
                      ? 'translate-y-3'
                      : ''
                  }`}
                >
                  {/* Reorder Controls */}
                  {isReordering && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
                      <button
                        onClick={() => moveProject(index, 'up')}
                        disabled={index === 0}
                        className={`w-9 h-9 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg flex items-center justify-center transition-all ${
                          index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 hover:shadow-xl active:scale-95'
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveProject(index, 'down')}
                        disabled={index === activeProjects.length - 1}
                        className={`w-9 h-9 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg flex items-center justify-center transition-all ${
                          index === activeProjects.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 hover:shadow-xl active:scale-95'
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Drag Handle (for touch) */}
                  {isReordering && (
                    <div
                      className="absolute left-1 top-1/2 -translate-y-1/2 z-10 touch-none"
                      onTouchStart={(e) => handleDragStart(index, e)}
                      onMouseDown={(e) => handleDragStart(index, e)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <div className={isReordering ? 'mr-10 ml-12' : ''}>
                    <ProjectCard
                      id={project.id}
                      name={project.name}
                      templateIcon={getTemplateIcon(project.template)}
                      participantCount={project.participantCount}
                      expenseCount={project.expenseCount}
                      totalExpenses={project.totalExpenses}
                      myBalance={project.myBalance}
                      currency={project.currency}
                      isArchived={project.isArchived}
                      onDelete={handleProjectDelete}
                      onArchive={handleProjectArchive}
                      isDragging={draggedIndex === index}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Archived Projects Section */}
            {archivedProjects.length > 0 && (
              <div className="mt-8">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-3 mb-4 group"
                >
                  <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                  <h2 className="text-base font-bold text-gray-500 dark:text-gray-400">
                    پروژه‌های آرشیو شده
                  </h2>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                    {archivedProjects.length}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showArchived ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showArchived && (
                  <div className="space-y-4 pb-28">
                    {archivedProjects.map((project) => (
                      <div key={project.id} className="relative opacity-75">
                        {/* Archive Badge */}
                        <div className="absolute -top-2 right-4 z-10 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded-full shadow-sm">
                          📦 آرشیو شده
                        </div>
                        <ProjectCard
                          id={project.id}
                          name={project.name}
                          templateIcon={getTemplateIcon(project.template)}
                          participantCount={project.participantCount}
                          expenseCount={project.expenseCount}
                          totalExpenses={project.totalExpenses}
                          myBalance={project.myBalance}
                          currency={project.currency}
                          isArchived={project.isArchived}
                          onDelete={handleProjectDelete}
                          onArchive={handleProjectArchive}
                          isDragging={false}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Spacer for fixed button */}
            {!showArchived && <div className="pb-28" />}
          </div>
        )}

        {/* Bottom Actions (for logged in users) */}
        {user && (
          <>
            {/* Create Button - Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:to-transparent pt-10">
              <Button
                onClick={() => setShowCreate(true)}
                className="w-full !bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 !shadow-xl !shadow-blue-500/25 hover:!shadow-2xl hover:!shadow-blue-500/30 transition-all duration-300"
                size="lg"
              >
                <span className="flex items-center justify-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-bold">شروع پروژه جدید</span>
                </span>
              </Button>
            </div>

            {/* Join hint for new users */}
            {activeProjects.length === 0 && archivedProjects.length === 0 && (
              <div className="fixed bottom-24 left-4 right-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 text-center shadow-lg border border-white/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">لینک دعوت دارید؟</p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    برای پیوستن به پروژه، لینک را باز کنید
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Project Sheet */}
      <CreateProjectSheet
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        userName={user?.name}
      />
    </main>
  )
}
