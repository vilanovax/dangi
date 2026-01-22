'use client'

import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
}

/**
 * Base skeleton component with pulse animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800',
        className
      )}
    />
  )
}

/**
 * Skeleton for project card on home page
 */
export function ProjectCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <Skeleton className="w-12 h-12 rounded-xl" />

        {/* Info */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>

        {/* Arrow */}
        <Skeleton className="w-5 h-5 rounded" />
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Skeleton for home page header
 */
export function HomeHeaderSkeleton() {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
    </header>
  )
}

/**
 * Skeleton for settings page profile section
 */
export function ProfileSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-6 w-12" />
      </div>
    </div>
  )
}

/**
 * Skeleton for settings menu item
 */
export function SettingsItemSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="w-5 h-5" />
      </div>
    </div>
  )
}

/**
 * Full home page skeleton
 */
export function HomePageSkeleton() {
  return (
    <div className="p-4">
      <HomeHeaderSkeleton />

      <Skeleton className="h-4 w-24 mb-3" />

      <div className="space-y-3">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    </div>
  )
}

/**
 * Full settings page skeleton
 */
export function SettingsPageSkeleton() {
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-6 w-20" />
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div>
          <Skeleton className="h-4 w-12 mb-3" />
          <ProfileSkeleton />
        </div>

        {/* Theme Section */}
        <div>
          <Skeleton className="h-4 w-10 mb-3" />
          <SettingsItemSkeleton />
        </div>

        {/* Account Section */}
        <div>
          <Skeleton className="h-4 w-20 mb-3" />
          <SettingsItemSkeleton />
        </div>
      </div>
    </div>
  )
}
