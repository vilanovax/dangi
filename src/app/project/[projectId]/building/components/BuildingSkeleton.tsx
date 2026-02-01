/**
 * BuildingSkeleton Component
 *
 * Loading skeleton for building dashboard that matches the actual content structure.
 * Provides a smooth loading experience by showing placeholder content.
 */

export function BuildingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div
        className="px-4 pt-3 pb-4"
        style={{
          background: 'linear-gradient(135deg, var(--building-primary) 0%, var(--building-primary-hover) 100%)'
        }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-full bg-white/20" />
          <div className="flex-1 text-center">
            <div className="h-5 bg-white/30 rounded w-32 mx-auto mb-1" />
            <div className="h-3 bg-white/20 rounded w-24 mx-auto" />
          </div>
          <div className="w-9 h-9 rounded-full bg-white/20" />
        </div>

        {/* Year Stats Skeleton */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 mt-1.5">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-white/20 rounded w-24" />
            <div className="h-5 bg-white/20 rounded-lg w-16" />
          </div>
          <div className="mb-2.5">
            <div className="h-3 bg-white/20 rounded w-16 mb-1" />
            <div className="h-8 bg-white/30 rounded w-40" />
          </div>
          <div className="h-2.5 bg-white/10 rounded-full mb-1.5" />
          <div className="flex items-center justify-between">
            <div className="h-5 bg-white/20 rounded-md w-24" />
            <div>
              <div className="h-3 bg-white/20 rounded w-16 mb-1" />
              <div className="h-4 bg-white/20 rounded w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="px-4 mt-3">
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ backgroundColor: 'var(--building-surface-muted)' }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-1 h-10 rounded-lg"
              style={{ backgroundColor: 'var(--building-surface-muted)' }}
            >
              <div className="h-full bg-white/10 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Alert Card Skeleton */}
        <div
          className="p-3 rounded-xl"
          style={{
            backgroundColor: 'var(--building-surface-muted)',
            borderWidth: '1.5px',
            borderStyle: 'solid',
            borderColor: 'var(--building-border)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10" />
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded w-32 mb-1" />
              <div className="h-3 bg-white/10 rounded w-24" />
            </div>
            <div className="h-9 bg-white/10 rounded-lg w-24" />
          </div>
        </div>

        {/* Priority Section Skeleton */}
        <div
          className="p-3.5 rounded-xl"
          style={{
            backgroundColor: 'var(--building-surface)',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: 'var(--building-border)'
          }}
        >
          <div className="mb-3">
            <div className="h-5 bg-white/10 rounded w-32 mb-1" />
            <div className="h-3 bg-white/10 rounded w-28" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg"
                style={{
                  backgroundColor: 'var(--building-surface-muted)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--building-border)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-4 bg-white/10 rounded w-24" />
                    <div className="h-5 bg-white/10 rounded w-12" />
                  </div>
                  <div className="h-7 bg-white/10 rounded-lg w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl"
              style={{
                backgroundColor: 'var(--building-surface)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--building-border)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="flex-1">
                  <div className="h-3 bg-white/10 rounded w-16 mb-2" />
                  <div className="h-5 bg-white/10 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--building-surface)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--building-border)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-white/10 rounded w-32" />
            <div className="h-4 bg-white/10 rounded w-16" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded w-24 mb-1" />
                    <div className="h-3 bg-white/10 rounded w-32" />
                  </div>
                </div>
                <div className="h-5 bg-white/10 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Tab Content Skeleton
 * Skeleton for individual tab content areas
 */
export function TabContentSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--building-surface)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--building-border)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-white/10 rounded w-32" />
            <div className="h-5 bg-white/10 rounded w-20" />
          </div>
          <div className="h-3 bg-white/10 rounded w-full" />
        </div>
      ))}
    </div>
  )
}
