'use client'

import { useRouter, usePathname } from 'next/navigation'
import { familyTheme } from '@/styles/family-theme'

interface BottomNavProps {
  projectId: string
}

export function BottomNav({ projectId }: BottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === `/project/${projectId}/family`) {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  const navItems = [
    {
      icon: '🏠',
      label: 'خانه',
      path: `/project/${projectId}/family`,
    },
    {
      icon: '📝',
      label: 'تراکنش‌ها',
      path: `/project/${projectId}/family/transactions`,
    },
    {
      icon: 'add', // Special case for central add button
      label: 'افزودن',
      path: `/project/${projectId}/family/add-expense`,
    },
    {
      icon: '💰',
      label: 'بودجه',
      path: `/project/${projectId}/family/budgets`,
    },
    {
      icon: '📊',
      label: 'گزارش',
      path: `/project/${projectId}/family/reports`,
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        backgroundColor: familyTheme.colors.card,
        borderColor: familyTheme.colors.divider,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div
        className="flex items-center justify-around px-2 max-w-screen-lg mx-auto"
        style={{ height: familyTheme.bottomNav.height }}
      >
        {navItems.map((item, index) => {
          const active = isActive(item.path)

          // Central Add button - special styling
          if (item.icon === 'add') {
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center w-14 h-14 -mt-8 rounded-full text-white hover:scale-110 active:scale-95 transition-transform"
                style={{
                  backgroundColor: familyTheme.colors.primary,
                  boxShadow: familyTheme.card.shadow
                }}
              >
                <span className="text-3xl font-light leading-none">+</span>
              </button>
            )
          }

          // Regular nav items
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all"
              style={{
                color: active ? familyTheme.colors.primary : familyTheme.colors.textSecondary
              }}
            >
              <span
                className={`text-xl mb-0.5 transition-transform ${active ? 'scale-110' : ''}`}
              >
                {item.icon}
              </span>
              <span
                className={active ? 'font-bold' : 'font-medium'}
                style={{
                  fontSize: '10px'
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
