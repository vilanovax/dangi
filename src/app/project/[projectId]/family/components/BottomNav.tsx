'use client'

import { useRouter, usePathname } from 'next/navigation'
import { familyTheme, getCardBackgroundClass, getDividerClass } from '@/styles/family-theme'

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
      icon: 'home',
      label: 'خانه',
      path: `/project/${projectId}/family`,
    },
    {
      icon: 'transactions',
      label: 'تراکنش‌ها',
      path: `/project/${projectId}/family/transactions`,
    },
    {
      icon: 'add', // Special case for central add button
      label: 'افزودن',
      path: `/project/${projectId}/family/add-expense`,
    },
    {
      icon: 'budget',
      label: 'بودجه',
      path: `/project/${projectId}/family/budgets`,
    },
    {
      icon: 'reports',
      label: 'گزارش',
      path: `/project/${projectId}/family/reports`,
    },
  ]

  const getIcon = (iconName: string, isActive: boolean) => {
    const iconProps = {
      className: `w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`,
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      strokeWidth: 2,
    }

    switch (iconName) {
      case 'home':
        return (
          <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      case 'transactions':
        return (
          <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        )
      case 'budget':
        return (
          <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'reports':
        return (
          <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t ${getCardBackgroundClass()} ${getDividerClass()} shadow-[0_-2px_10px_rgba(0,0,0,0.05)]`}>
      <div className="flex items-center justify-around px-2 max-w-screen-lg mx-auto" style={{ height: familyTheme.bottomNav.height }}>
        {navItems.map((item, index) => {
          const active = isActive(item.path)

          // Central Add button - special styling
          if (item.icon === 'add') {
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center w-14 h-14 -mt-8 rounded-full text-white bg-[#FF8A00] hover:bg-[#E67A00] active:scale-95 transition-all shadow-lg"
                aria-label="افزودن تراکنش"
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )
          }

          // Regular nav items
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                active
                  ? 'text-[#FF8A00]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              aria-label={item.label}
            >
              {getIcon(item.icon, active)}
              <span className={`${active ? 'font-bold' : 'font-medium'} mt-0.5`} style={{ fontSize: '10px' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
