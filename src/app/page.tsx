'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, HomeHeaderSkeleton, ProjectCardSkeleton } from '@/components/ui'
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
      <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 p-4">
        <HomeHeaderSkeleton />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-3 animate-pulse" />
        <div className="space-y-3">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      </main>
    )
  }

  // ── Main Render ─────────────────────────────────────────────

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 p-4 flex flex-col">
      {/* Header */}
      <HomeHeader user={user} onLogout={handleLogout} />

      {/* Content */}
      {!user ? (
        // Guest State
        <EmptyState type="guest" />
      ) : orderedProjects.length === 0 ? (
        // No Projects State
        <EmptyState type="no-projects" />
      ) : (
        // Projects List
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              پروژه‌های شما
            </h2>
            {orderedProjects.length > 1 && (
              <button
                onClick={() => setIsReordering(!isReordering)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  isReordering
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {isReordering ? 'تمام' : 'ترتیب'}
              </button>
            )}
          </div>
          <div
            className="space-y-3"
            onTouchMove={handleDragMove}
            onMouseMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            {orderedProjects.map((project, index) => (
              <div
                key={project.id}
                data-project-index={index}
                className={`relative transition-all duration-200 ${
                  draggedIndex === index
                    ? 'opacity-50 scale-[0.98]'
                    : dragOverIndex === index
                    ? 'translate-y-2'
                    : ''
                }`}
              >
                {/* Reorder Controls */}
                {isReordering && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
                    <button
                      onClick={() => moveProject(index, 'up')}
                      disabled={index === 0}
                      className={`w-8 h-8 rounded-lg bg-white dark:bg-gray-800 shadow-md flex items-center justify-center transition-opacity ${
                        index === 0 ? 'opacity-30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveProject(index, 'down')}
                      disabled={index === orderedProjects.length - 1}
                      className={`w-8 h-8 rounded-lg bg-white dark:bg-gray-800 shadow-md flex items-center justify-center transition-opacity ${
                        index === orderedProjects.length - 1 ? 'opacity-30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Drag Handle (for touch) */}
                {isReordering && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 touch-none"
                    onTouchStart={(e) => handleDragStart(index, e)}
                    onMouseDown={(e) => handleDragStart(index, e)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className={isReordering ? 'mr-8 ml-10' : ''}>
                  <ProjectCard
                    id={project.id}
                    name={project.name}
                    templateIcon={getTemplateIcon(project.template)}
                    participantCount={project.participantCount}
                    expenseCount={project.expenseCount}
                    totalExpenses={project.totalExpenses}
                    myBalance={project.myBalance}
                    currency={project.currency}
                    onDelete={handleProjectDelete}
                    isDragging={draggedIndex === index}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions (for logged in users) */}
      {user && (
        <div className="mt-4 space-y-3">
          {/* Create Button - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
            <Button
              onClick={() => setShowCreate(true)}
              className="w-full"
              size="lg"
            >
              <span className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                شروع پروژه جدید
              </span>
            </Button>
          </div>

          {/* Spacer for fixed button */}
          <div className="h-20" />

          {/* Join hint for new users */}
          {orderedProjects.length === 0 && (
            <Card variant="bordered" className="text-center mb-20">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">لینک دعوت دارید؟</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                برای پیوستن به پروژه، لینک را باز کنید
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Create Project Sheet */}
      <CreateProjectSheet
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        userName={user?.name}
      />
    </main>
  )
}
