/**
 * Family Finance Template - Icon System
 *
 * یک لایه abstraction برای آیکون‌ها با استفاده از Lucide React
 * جایگزین emoji ها با آیکون‌های SVG حرفه‌ای
 */

import {
  Coins,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Target,
  Calendar,
  Users,
  Settings,
  Folder,
  Info,
  Check,
  Download,
  CreditCard,
  FileText,
  Lightbulb,
  ClipboardList,
  RefreshCw,
  Wallet,
  Home,
  Plus,
  ChevronLeft,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react'

export type IconName =
  | 'income'
  | 'expense'
  | 'savings'
  | 'reports'
  | 'budget'
  | 'calendar'
  | 'members'
  | 'settings'
  | 'categories'
  | 'info'
  | 'success'
  | 'backup'
  | 'transactions'
  | 'note'
  | 'tip'
  | 'emptyList'
  | 'recurring'
  | 'wallet'
  | 'home'
  | 'add'
  | 'back'
  | 'warning'
  | 'more'
  | 'edit'
  | 'delete'

interface FamilyIconProps {
  name: IconName
  className?: string
  size?: number
  strokeWidth?: number
  style?: React.CSSProperties
}

const iconMap: Record<IconName, LucideIcon> = {
  // Financial
  income: Coins,
  expense: TrendingDown,
  savings: TrendingUp,
  budget: Target,
  wallet: Wallet,
  transactions: CreditCard,

  // Analytics
  reports: BarChart3,

  // Management
  categories: Folder,
  members: Users,
  settings: Settings,

  // Calendar & Time
  calendar: Calendar,
  recurring: RefreshCw,

  // UI Elements
  info: Info,
  success: Check,
  warning: AlertCircle,
  tip: Lightbulb,
  note: FileText,
  backup: Download,
  emptyList: ClipboardList,
  home: Home,
  add: Plus,
  back: ChevronLeft,
  more: MoreVertical,
  edit: Pencil,
  delete: Trash2,
}

/**
 * کامپوننت آیکون یکپارچه برای تمپلیت مالی
 *
 * @example
 * <FamilyIcon name="income" size={24} className="text-green-500" />
 */
export function FamilyIcon({
  name,
  className = '',
  size = 20,
  strokeWidth = 2,
  style,
}: FamilyIconProps) {
  const Icon = iconMap[name]

  if (!Icon) {
    console.warn(`FamilyIcon: Icon "${name}" not found in iconMap`)
    return null
  }

  return <Icon className={className} size={size} strokeWidth={strokeWidth} style={style} />
}
