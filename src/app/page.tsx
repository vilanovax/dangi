'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, HomeHeaderSkeleton, ProjectCardSkeleton } from '@/components/ui'
import { getAllTemplates } from '@/lib/domain/templates'
import { useProjects } from '@/lib/hooks'
import {
  HomeHeader,
  ProjectCard,
  EmptyState,
  CreateProjectSheet,
  QuickResumeCard,
  ChecklistsSection,
} from './(home)/components'

// ─────────────────────────────────────────────────────────────
// LocalStorage Keys
// ─────────────────────────────────────────────────────────────

const PROJECT_ORDER_KEY = 'dangi_project_order'
const LAST_ACTIVE_PROJECT_KEY = 'dangi_last_active_project'

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
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [dismissedQuickResume, setDismissedQuickResume] = useState(false)

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
          const sorted = [...projects].sort((a, b) => {
            const indexA = orderIds.indexOf(a.id)
            const indexB = orderIds.indexOf(b.id)
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

  // ── Get Last Active Project ───────────────────────────────
  // Don't show QuickResumeCard for settled projects (myBalance === 0)
  const getLastActiveProject = useCallback(() => {
    if (activeProjects.length === 0) return null

    // Filter out settled projects (balance = 0)
    const unsettledProjects = activeProjects.filter(p => p.myBalance !== 0)
    if (unsettledProjects.length === 0) return null

    // Try to get last active from localStorage
    const lastActiveId = localStorage.getItem(LAST_ACTIVE_PROJECT_KEY)
    if (lastActiveId) {
      const lastProject = unsettledProjects.find(p => p.id === lastActiveId)
      if (lastProject) return lastProject
    }

    // Fallback to first unsettled project
    return unsettledProjects[0]
  }, [activeProjects])

  const lastActiveProject = getLastActiveProject()

  // ── Get Status for QuickResumeCard ───────────────────────
  const getProjectStatus = (project: Project) => {
    if (project.myBalance === 0) return 'settled' as const
    if (project.myBalance < 0) return 'debt' as const
    return 'credit' as const
  }

  // ── Display Projects (limited to 2 unless expanded) ──────
  const displayProjects = showAllProjects
    ? activeProjects
    : activeProjects.slice(0, 2)

  // ── Handlers ────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    refresh()
    router.refresh()
  }, [router, refresh])

  const getTemplateInfo = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId)
      return {
        icon: template?.icon || '📁',
        name: template?.nameFa || 'پروژه'
      }
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
      const newProjects = orderedProjects.map((p) =>
        p.id === id ? { ...p, isArchived } : p
      )
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
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-20 w-60 h-60 bg-gradient-to-br from-emerald-400/15 to-cyan-500/15 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <HomeHeaderSkeleton />
          <div className="h-24 bg-gray-200/50 dark:bg-gray-800/50 rounded-2xl mb-6 animate-pulse" />
          <div className="space-y-4">
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
        {/* Header - Only greeting, avatar, menu */}
        <HomeHeader user={user} onLogout={handleLogout} />

        {/* Content */}
        {!user ? (
          <EmptyState type="guest" />
        ) : activeProjects.length === 0 && archivedProjects.length === 0 ? (
          <EmptyState type="no-projects" />
        ) : (
          <div className="flex-1">
            {/* Quick Resume Card - Primary Focus */}
            {lastActiveProject && !dismissedQuickResume && activeProjects.length > 0 && (
              <QuickResumeCard
                projectId={lastActiveProject.id}
                title={lastActiveProject.name}
                templateType={lastActiveProject.template as 'travel' | 'gathering' | 'personal' | 'building' | 'family'}
                templateIcon={getTemplateInfo(lastActiveProject.template).icon}
                status={getProjectStatus(lastActiveProject)}
                participantCount={lastActiveProject.participantCount}
                onDismiss={() => setDismissedQuickResume(true)}
              />
            )}

            {/* Projects Section */}
            <div className="mb-6">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                  <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300">
                    پروژه‌های شما
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                    {activeProjects.length}
                  </span>
                </div>

                {activeProjects.length > 2 && !showAllProjects && (
                  <button
                    onClick={() => setShowAllProjects(true)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    مشاهده همه
                  </button>
                )}

                {showAllProjects && activeProjects.length > 2 && !isReordering && (
                  <button
                    onClick={() => setIsReordering(true)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    ترتیب
                  </button>
                )}

                {isReordering && (
                  <button
                    onClick={() => setIsReordering(false)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    تمام
                  </button>
                )}
              </div>

              {/* Projects Grid */}
              <div
                className="space-y-3"
                onTouchMove={handleDragMove}
                onMouseMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              >
                {displayProjects.map((project, index) => {
                  const templateInfo = getTemplateInfo(project.template)
                  return (
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
                            className={`w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-md flex items-center justify-center transition-all ${
                              index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'
                            }`}
                          >
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveProject(index, 'down')}
                            disabled={index === activeProjects.length - 1}
                            className={`w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-md flex items-center justify-center transition-all ${
                              index === activeProjects.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'
                            }`}
                          >
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Drag Handle */}
                      {isReordering && (
                        <div
                          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 touch-none"
                          onTouchStart={(e) => handleDragStart(index, e)}
                          onMouseDown={(e) => handleDragStart(index, e)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                            </svg>
                          </div>
                        </div>
                      )}

                      <div className={isReordering ? 'mr-9 ml-10' : ''}>
                        <ProjectCard
                          id={project.id}
                          name={project.name}
                          template={project.template}
                          templateName={templateInfo.name}
                          templateIcon={templateInfo.icon}
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
                  )
                })}

                {/* Show "View All" inline if collapsed */}
                {!showAllProjects && activeProjects.length > 2 && (
                  <button
                    onClick={() => setShowAllProjects(true)}
                    className="w-full py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    +{activeProjects.length - 2} پروژه دیگر
                  </button>
                )}
              </div>
            </div>

            {/* Archived Projects Section */}
            {archivedProjects.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 mb-3"
                >
                  <div className="w-1 h-4 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                  <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500">
                    آرشیو شده
                  </h2>
                  <span className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                    {archivedProjects.length}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showArchived ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showArchived && (
                  <div className="space-y-3">
                    {archivedProjects.map((project) => {
                      const templateInfo = getTemplateInfo(project.template)
                      return (
                        <div key={project.id} className="relative opacity-60">
                          <ProjectCard
                            id={project.id}
                            name={project.name}
                            template={project.template}
                            templateName={templateInfo.name}
                            templateIcon={templateInfo.icon}
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
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Checklists Section - Secondary importance */}
            <ChecklistsSection compact />

            {/* Spacer for fixed button */}
            <div className="pb-28" />
          </div>
        )}

        {/* Single Fixed Bottom CTA */}
        {user && (
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
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
              سفر، دورهمی، خونه یا ساختمان
            </p>
          </div>
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
