'use client'

import { useState, useCallback, useEffect } from 'react'
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
  FloatingActionButton,
} from './(home)/components'

// ─────────────────────────────────────────────────────────────
// LocalStorage Keys
// ─────────────────────────────────────────────────────────────

const PROJECT_LAST_USED_KEY = 'dangi_project_last_used'
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

  // ── Load & Sort by Last Used ─────────────────────────────────────
  useEffect(() => {
    if (projects.length > 0) {
      const lastUsedData = localStorage.getItem(PROJECT_LAST_USED_KEY)
      let lastUsedMap: Record<string, number> = {}

      if (lastUsedData) {
        try {
          lastUsedMap = JSON.parse(lastUsedData)
        } catch {
          lastUsedMap = {}
        }
      }

      // Sort by last used timestamp (most recent first)
      const sorted = [...projects].sort((a, b) => {
        const timeA = lastUsedMap[a.id] || 0
        const timeB = lastUsedMap[b.id] || 0
        return timeB - timeA // Descending order (most recent first)
      })

      setOrderedProjects(sorted)
    } else {
      setOrderedProjects([])
    }
  }, [projects])

  const updateProjectLastUsed = useCallback((projectId: string) => {
    const lastUsedData = localStorage.getItem(PROJECT_LAST_USED_KEY)
    let lastUsedMap: Record<string, number> = {}

    if (lastUsedData) {
      try {
        lastUsedMap = JSON.parse(lastUsedData)
      } catch {
        lastUsedMap = {}
      }
    }

    lastUsedMap[projectId] = Date.now()
    localStorage.setItem(PROJECT_LAST_USED_KEY, JSON.stringify(lastUsedMap))
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
      refresh()
    },
    [refresh]
  )

  const handleProjectArchive = useCallback(
    (id: string, isArchived: boolean) => {
      refresh()
    },
    [refresh]
  )

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
              </div>

              {/* Projects Grid */}
              <div className="space-y-3">
                {displayProjects.map((project) => {
                  const templateInfo = getTemplateInfo(project.template)
                  return (
                    <ProjectCard
                      key={project.id}
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
                      onProjectClick={updateProjectLastUsed}
                    />
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
                            onProjectClick={updateProjectLastUsed}
                            isDragging={false}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Checklists Section */}
            <ChecklistsSection compact />

            {/* Spacer for FAB */}
            <div className="pb-6" />
          </div>
        )}

        {/* Floating Action Button */}
        {user && <FloatingActionButton onCreateProject={() => setShowCreate(true)} />}
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
