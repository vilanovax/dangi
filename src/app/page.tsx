'use client'

import { useState, useCallback } from 'react'
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
// Main Component
// ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const templates = getAllTemplates()

  // ── Data (SWR) ────────────────────────────────────────────
  const { projects, user, isLoading, refresh } = useProjects()

  // ── Modal State ─────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false)

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
      ) : projects.length === 0 ? (
        // No Projects State
        <EmptyState type="no-projects" />
      ) : (
        // Projects List
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
            پروژه‌های شما
          </h2>
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                templateIcon={getTemplateIcon(project.template)}
                participantCount={project.participantCount}
                expenseCount={project.expenseCount}
                totalExpenses={project.totalExpenses}
                myBalance={project.myBalance}
                currency={project.currency}
              />
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
          {projects.length === 0 && (
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
