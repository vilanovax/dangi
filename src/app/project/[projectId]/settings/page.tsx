'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, Card, BottomSheet } from '@/components/ui'
import { getCurrencyLabel } from '@/lib/utils/money'
import { getTemplate } from '@/lib/domain/templates'
import { getCurrentPersianYear } from '@/lib/utils/persian-date'
import { AccessLinkCard } from '../components/AccessLinkCard'
import { CreateAccessLinkSheet } from '../components/CreateAccessLinkSheet'
import { EditAccessLinkSheet } from '../components/EditAccessLinkSheet'
import type { ProjectAccessLink } from '@/types/access-link'

interface Participant {
  id: string
  name: string
  role: string
  weight: number
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Project {
  id: string
  name: string
  description: string | null
  template: string
  splitType: string
  currency: string
  shareCode: string
  chargeYear?: number | null
  trackingOnly?: boolean
  isArchived: boolean
  archivedAt?: string | null
  participants: Participant[]
  categories: Category[]
}

const CURRENCIES = [
  { code: 'IRR', label: 'تومان', symbol: '﷼' },
  { code: 'USD', label: 'دلار', symbol: '$' },
  { code: 'EUR', label: 'یورو', symbol: '€' },
  { code: 'AED', label: 'درهم', symbol: 'د.إ' },
  { code: 'TRY', label: 'لیر ترکیه', symbol: '₺' },
]

const SPLIT_TYPES = [
  { code: 'EQUAL', label: 'مساوی', description: 'تقسیم برابر بین همه' },
  { code: 'WEIGHTED', label: 'وزنی', description: 'بر اساس وزن هر نفر (مثلاً متراژ)' },
  { code: 'PERCENTAGE', label: 'درصدی', description: 'بر اساس درصد مشخص شده' },
]

/**
 * Collapsible Section Component
 * UX: Reduces visual clutter by hiding less frequently used settings
 */
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  isDanger = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  isDanger?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section>
      {/* UX: Section header with clear hierarchy */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <h2 className={`text-base font-bold ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
          {title}
        </h2>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* UX: Smooth height transition for better perceived performance */}
      {isOpen && (
        <div className="animate-fade-in">
          {children}
        </div>
      )}
    </section>
  )
}

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('IRR')
  const [splitType, setSplitType] = useState('EQUAL')
  const [trackingOnly, setTrackingOnly] = useState(false)

  // Charge year state (only for building template)
  const [chargeYear, setChargeYear] = useState<number>(getCurrentPersianYear())

  // Modal states
  const [showCurrencySheet, setShowCurrencySheet] = useState(false)
  const [showSplitTypeSheet, setShowSplitTypeSheet] = useState(false)
  const [showModeSheet, setShowModeSheet] = useState(false)
  const [showYearSheet, setShowYearSheet] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showEditCategory, setShowEditCategory] = useState<Category | null>(null)

  // Category form state
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝')
  const [savingCategory, setSavingCategory] = useState(false)

  // Access links state
  const [accessLinks, setAccessLinks] = useState<ProjectAccessLink[]>([])
  const [loadingAccessLinks, setLoadingAccessLinks] = useState(false)
  const [showCreateAccessLink, setShowCreateAccessLink] = useState(false)
  const [editingAccessLink, setEditingAccessLink] = useState<ProjectAccessLink | null>(null)

  // Common emoji icons for categories
  const categoryIcons = ['🍕', '🚗', '🏨', '🎢', '🛍️', '💊', '🎬', '☕', '🎁', '📱', '✂️', '📝', '🔧', '🎉', '💡', '🏠']

  useEffect(() => {
    fetchProject()
    fetchAccessLinks()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('پروژه یافت نشد')

      const data = await res.json()
      setProject(data.project)
      setName(data.project.name)
      setDescription(data.project.description || '')
      setCurrency(data.project.currency)
      setSplitType(data.project.splitType)
      setTrackingOnly(data.project.trackingOnly || false)
      if (data.project.chargeYear) {
        setChargeYear(data.project.chargeYear)
      }
    } catch {
      setError('خطا در بارگذاری پروژه')
    } finally {
      setLoading(false)
    }
  }

  const fetchAccessLinks = async () => {
    setLoadingAccessLinks(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/access-links`)
      if (!res.ok) throw new Error('خطا در بارگذاری لینک‌های دسترسی')

      const data = await res.json()
      setAccessLinks(data.links || [])
    } catch (error) {
      console.error('Failed to fetch access links:', error)
      // Don't show error to user, just fail silently
    } finally {
      setLoadingAccessLinks(false)
    }
  }

  // UX: Detect changes to enable/disable save button
  const hasChanges = useMemo(() => {
    if (!project) return false

    return (
      name.trim() !== project.name ||
      (description.trim() || null) !== (project.description || null) ||
      currency !== project.currency ||
      splitType !== project.splitType ||
      (project.template === 'personal' && trackingOnly !== (project.trackingOnly || false)) ||
      (getTemplate(project.template).supportsChargeRules && chargeYear !== (project.chargeYear || getCurrentPersianYear()))
    )
  }, [project, name, description, currency, splitType, trackingOnly, chargeYear])

  const handleSave = async () => {
    if (!name.trim()) {
      setError('نام پروژه الزامی است')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          currency,
          splitType,
          ...(project && getTemplate(project.template).supportsChargeRules && { chargeYear }),
          ...(project && project.template === 'personal' && { trackingOnly }),
        }),
      })

      if (!res.ok) throw new Error('خطا در ذخیره تنظیمات')

      const data = await res.json()
      setProject(data.project)
      setSuccess('✅ تنظیمات با موفقیت ذخیره شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('خطا در ذخیره تنظیمات')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = () => {
    if (!project) return

    const exportData = {
      exportDate: new Date().toISOString(),
      project: project,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dangi-${project.name}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyShareLink = () => {
    if (!project) return
    navigator.clipboard.writeText(`${window.location.origin}/join/${project.shareCode}`)
    setSuccess('✅ لینک دعوت کپی شد!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('خطا در حذف پروژه')

      router.push('/')
    } catch {
      setError('خطا در حذف پروژه')
      setShowDeleteConfirm(false)
    }
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isArchived: !project?.isArchived,
        }),
      })

      if (!res.ok) throw new Error('خطا در آرشیو پروژه')

      const data = await res.json()
      setProject(data.project)
      setShowArchiveConfirm(false)
      setSuccess(data.project.isArchived ? '📦 پروژه آرشیو شد' : '✅ پروژه از آرشیو خارج شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('خطا در آرشیو پروژه')
    } finally {
      setArchiving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    setSavingCategory(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
        }),
      })

      if (!res.ok) throw new Error('خطا در افزودن دسته‌بندی')

      const data = await res.json()

      // Add to local state
      if (project) {
        setProject({
          ...project,
          categories: [...project.categories, data.category],
        })
      }

      setNewCategoryName('')
      setNewCategoryIcon('📝')
      setShowAddCategory(false)
      setSuccess('✅ دسته‌بندی با موفقیت افزوده شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('خطا در افزودن دسته‌بندی')
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('خطا در حذف دسته‌بندی')

      // Remove from local state
      if (project) {
        setProject({
          ...project,
          categories: project.categories.filter((c) => c.id !== categoryId),
        })
      }

      setShowEditCategory(null)
      setSuccess('✅ دسته‌بندی حذف شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('خطا در حذف دسته‌بندی')
    }
  }

  // Access link handlers
  const handleCopyAccessLink = async (link: ProjectAccessLink) => {
    const linkUrl = `${window.location.origin}/access/${link.token}`
    try {
      await navigator.clipboard.writeText(linkUrl)
      setSuccess('✅ لینک دسترسی کپی شد!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      setError('خطا در کپی لینک')
    }
  }

  const handleEditAccessLink = (link: ProjectAccessLink) => {
    setEditingAccessLink(link)
  }

  const handleToggleAccessLink = async (link: ProjectAccessLink) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/access-links/${link.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.isActive }),
      })

      if (!res.ok) throw new Error('خطا در تغییر وضعیت لینک')

      await fetchAccessLinks()
      setSuccess(link.isActive ? '✅ لینک غیرفعال شد' : '✅ لینک فعال شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to toggle link:', error)
      setError('خطا در تغییر وضعیت لینک')
    }
  }

  const handleDeleteAccessLink = async (link: ProjectAccessLink) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/access-links/${link.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('خطا در حذف لینک')

      await fetchAccessLinks()
      setSuccess('✅ لینک حذف شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to delete link:', error)
      setError('خطا در حذف لینک')
    }
  }

  const handleAccessLinkSuccess = () => {
    fetchAccessLinks()
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center">
        <p className="text-gray-500">{error || 'پروژه یافت نشد'}</p>
      </div>
    )
  }

  return (
    <main className="min-h-dvh pb-32 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 py-4 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">تنظیمات پروژه</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{project.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl text-sm border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}

        {/* A. اطلاعات پروژه */}
        {/* UX: Most frequently edited settings at the top */}
        <CollapsibleSection title="اطلاعات پروژه" defaultOpen={true}>
          <Card className="space-y-4 p-4">
            <Input
              label="نام پروژه"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: سفر شمال تابستان ۱۴۰۳"
            />
            <Input
              label="توضیحات (اختیاری)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="یک توضیح کوتاه که به یادآوری اطلاعات کمک کنه"
            />
          </Card>
        </CollapsibleSection>

        {/* B. تنظیمات مالی */}
        {/* UX: Financial settings grouped together */}
        <CollapsibleSection title="تنظیمات مالی" defaultOpen={true}>
          <Card className="divide-y divide-gray-100 dark:divide-gray-800">
            <button
              onClick={() => setShowCurrencySheet(true)}
              className="w-full flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg px-3 -mx-3"
            >
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">واحد پول</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">برای نمایش قیمت‌ها</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">{getCurrencyLabel(currency)}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => setShowSplitTypeSheet(true)}
              className="w-full flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg px-3 -mx-3"
            >
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">نوع تقسیم</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">چطور هزینه‌ها تقسیم بشن</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {SPLIT_TYPES.find((s) => s.code === splitType)?.label}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </button>
          </Card>
        </CollapsibleSection>

        {/* Mode Selection - Only for personal template */}
        {/* UX: Contextual settings only shown when relevant */}
        {project.template === 'personal' && (
          <CollapsibleSection title="حالت پروژه" defaultOpen={true}>
            <Card>
              <button
                onClick={() => setShowModeSheet(true)}
                className="w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg px-3 py-3 -mx-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-xl">{trackingOnly ? '👨‍👩‍👧' : '🏠'}</span>
                      {trackingOnly ? 'فقط ردیابی (خانواده)' : 'تقسیم خرج (هم‌خونه)'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {trackingOnly
                        ? 'فقط ثبت می‌شه هر نفر چقدر خرج کرده'
                        : 'خرج‌ها تقسیم میشن و تسویه حساب انجام میشه'
                      }
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </button>
            </Card>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 pr-1">
              💡 تغییر این تنظیم روی خرج‌های قبلی هم اثر می‌گذارد
            </p>
          </CollapsibleSection>
        )}

        {/* Charge Rules - Only for templates that support it */}
        {getTemplate(project.template).supportsChargeRules && (
          <CollapsibleSection title="قواعد شارژ" defaultOpen={false}>
            <Card className="divide-y divide-gray-100 dark:divide-gray-800">
              <button
                onClick={() => setShowYearSheet(true)}
                className="w-full flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg px-3 -mx-3"
              >
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">سال شمسی</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">برای محاسبه شارژ ماهانه</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{chargeYear}</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => router.push(`/project/${projectId}/charge-rules`)}
                className="w-full flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg px-3 -mx-3"
              >
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">مدیریت قواعد شارژ</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    تعریف پرداخت‌های دوره‌ای مورد انتظار
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Card>
          </CollapsibleSection>
        )}

        {/* C. اعضا */}
        {/* UX: Member management and sharing grouped together */}
        <CollapsibleSection title="اعضا" defaultOpen={false}>
          <div className="space-y-3">
            <Card>
              <button
                onClick={() => router.push(`/project/${projectId}/participants`)}
                className="w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg px-3 py-3 -mx-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">مدیریت اعضا</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      افزودن، ویرایش یا حذف اعضا
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                      {project.participants.length} نفر
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </div>
              </button>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div className="text-right flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">لینک دعوت</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    با این لینک دیگران می‌تونن به پروژه بپیوندن
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={copyShareLink}>
                  کپی لینک
                </Button>
              </div>
            </Card>
          </div>
        </CollapsibleSection>

        {/* D. لینک‌های اشتراک */}
        {/* UX: Share links for granular permissions */}
        <CollapsibleSection title="لینک‌های اشتراک" defaultOpen={false}>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ایجاد لینک برای دسترسی بدون ثبت‌نام
              </p>
              <button
                onClick={() => setShowCreateAccessLink(true)}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                + ایجاد لینک جدید
              </button>
            </div>

            {loadingAccessLinks ? (
              <Card>
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              </Card>
            ) : accessLinks.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">🔗</span>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">
                    هنوز لینک دسترسی‌ای ایجاد نشده
                  </p>
                  <button
                    onClick={() => setShowCreateAccessLink(true)}
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    ایجاد اولین لینک
                  </button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {accessLinks.map((link) => (
                  <AccessLinkCard
                    key={link.id}
                    link={link}
                    onCopy={handleCopyAccessLink}
                    onEdit={handleEditAccessLink}
                    onToggle={handleToggleAccessLink}
                    onDelete={handleDeleteAccessLink}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* E. دسته‌بندی‌ها */}
        {/* UX: Advanced feature, collapsed by default */}
        <CollapsibleSection title="دسته‌بندی‌ها" defaultOpen={false}>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                دسته‌بندی‌های اختصاصی این پروژه
              </p>
              <button
                onClick={() => setShowAddCategory(true)}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                + افزودن
              </button>
            </div>

            <Card className="divide-y divide-gray-100 dark:divide-gray-800">
              {project.categories.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">📋</span>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    هنوز دسته‌بندی‌ای اضافه نشده
                  </p>
                </div>
              ) : (
                project.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setShowEditCategory(cat)}
                    className="w-full flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg px-3 -mx-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                ))
              )}
            </Card>
          </div>
        </CollapsibleSection>

        {/* F. خروجی و پشتیبان‌گیری */}
        {/* UX: Secondary actions, collapsed by default */}
        <CollapsibleSection title="خروجی و پشتیبان‌گیری" defaultOpen={false}>
          <Card className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="text-right flex-1">
                <p className="font-medium text-gray-900 dark:text-white">خروجی Excel (CSV)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  لیست هزینه‌ها برای استفاده در Excel
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(`/api/projects/${projectId}/export?format=csv`, '_blank')}
              >
                دانلود
              </Button>
            </div>
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="text-right flex-1">
                <p className="font-medium text-gray-900 dark:text-white">پشتیبان کامل (JSON)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  تمام اطلاعات پروژه برای ذخیره‌سازی
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleExportData}>
                دانلود
              </Button>
            </div>
          </Card>
        </CollapsibleSection>

        {/* G. وضعیت پروژه */}
        {/* UX: Less frequently used, collapsed by default */}
        <CollapsibleSection title="وضعیت پروژه" defaultOpen={false}>
          <Card className={project.isArchived ? 'border-2 border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-900/10' : 'bg-white dark:bg-gray-900'}>
            <div className="flex items-center justify-between">
              <div className="text-right flex-1">
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {project.isArchived ? (
                    <>
                      <span className="text-xl">📦</span>
                      <span className="text-amber-700 dark:text-amber-400">آرشیو شده</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">✅</span>
                      <span>فعال</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {project.isArchived
                    ? 'پروژه بسته شده، فقط قابل مشاهده است'
                    : 'می‌تونید هزینه جدید ثبت کنید'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowArchiveConfirm(true)}
                className={project.isArchived ? '!text-green-600 !border-green-200 hover:!bg-green-50' : '!text-amber-600 !border-amber-200 hover:!bg-amber-50'}
              >
                {project.isArchived ? 'فعال‌سازی' : 'آرشیو'}
              </Button>
            </div>
          </Card>
        </CollapsibleSection>

        {/* H. منطقه خطر (Danger Zone) */}
        {/* UX: Visually distinct danger zone, collapsed by default */}
        <CollapsibleSection title="منطقه خطر ⚠️" defaultOpen={false} isDanger>
          <Card className="border-2 border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10">
            <div className="space-y-4">
              {/* UX: Warning message for transparency */}
              <div className="flex items-start gap-3 p-3 bg-red-100/50 dark:bg-red-900/20 rounded-lg">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-red-700 dark:text-red-300">
                  این عملیات قابل بازگشت نیست. بعد از حذف، تمام اطلاعات پروژه برای همیشه پاک می‌شود.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-right flex-1">
                  <p className="font-bold text-red-600 dark:text-red-400">حذف کامل پروژه</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    تمام هزینه‌ها، اعضا و تسویه‌ها حذف می‌شن
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="!text-red-600 !border-red-300 dark:!border-red-800 hover:!bg-red-100 dark:hover:!bg-red-900/30"
                >
                  حذف پروژه
                </Button>
              </div>
            </div>
          </Card>
        </CollapsibleSection>
      </div>

      {/* Fixed Bottom Save Button */}
      {/* UX: Always visible, shows change status */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-lg">
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!hasChanges}
          className="w-full"
        >
          {hasChanges ? 'ذخیره تغییرات' : 'تغییری برای ذخیره وجود ندارد'}
        </Button>
        {hasChanges && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            💡 تغییرات شما ذخیره نشده‌اند
          </p>
        )}
      </div>

      {/* Currency Bottom Sheet */}
      <BottomSheet
        isOpen={showCurrencySheet}
        onClose={() => setShowCurrencySheet(false)}
        title="انتخاب واحد پول"
      >
        <div className="space-y-2">
          {CURRENCIES.map((curr) => (
            <button
              key={curr.code}
              onClick={() => {
                setCurrency(curr.code)
                setShowCurrencySheet(false)
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                currency === curr.code
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl w-8">{curr.symbol}</span>
                <span className="font-medium">{curr.label}</span>
              </div>
              {currency === curr.code && (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Split Type Bottom Sheet */}
      <BottomSheet
        isOpen={showSplitTypeSheet}
        onClose={() => setShowSplitTypeSheet(false)}
        title="نوع تقسیم هزینه"
      >
        <div className="space-y-2">
          {SPLIT_TYPES.map((type) => (
            <button
              key={type.code}
              onClick={() => {
                setSplitType(type.code)
                setShowSplitTypeSheet(false)
              }}
              className={`w-full text-right p-4 rounded-xl transition-all ${
                splitType === type.code
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{type.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
                </div>
                {splitType === type.code && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Mode Selection Bottom Sheet - Only for personal template */}
      <BottomSheet
        isOpen={showModeSheet}
        onClose={() => setShowModeSheet(false)}
        title="انتخاب حالت پروژه"
      >
        <div className="space-y-3">
          <button
            onClick={() => {
              setTrackingOnly(true)
              setShowModeSheet(false)
            }}
            className={`w-full text-right p-4 rounded-xl transition-all ${
              trackingOnly
                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">👨‍👩‍👧</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">فقط ردیابی (خانواده)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  فقط مشخص میشه هر نفر چقدر خرج کرده، بدون تسویه حساب
                </p>
                <ul className="text-xs text-gray-400 dark:text-gray-500 mt-2 space-y-1 pr-4">
                  <li>• بدون محاسبه balance</li>
                  <li>• بدون تسویه حساب</li>
                  <li>• فقط ردیابی خرج‌ها</li>
                </ul>
              </div>
              {trackingOnly && (
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>

          <button
            onClick={() => {
              setTrackingOnly(false)
              setShowModeSheet(false)
            }}
            className={`w-full text-right p-4 rounded-xl transition-all ${
              !trackingOnly
                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🏠</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">تقسیم خرج (هم‌خونه)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  خرج‌ها بین اعضا تقسیم میشه و تسویه حساب انجام میشه
                </p>
                <ul className="text-xs text-gray-400 dark:text-gray-500 mt-2 space-y-1 pr-4">
                  <li>• محاسبه balance برای هر نفر</li>
                  <li>• تسویه حساب بدهی‌ها</li>
                  <li>• تقسیم هزینه‌ها</li>
                </ul>
              </div>
              {!trackingOnly && (
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        </div>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex gap-2">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              تغییر حالت روی خرج‌های قبلی هم تأثیر می‌گذارد. برای اعمال تغییرات، "ذخیره تغییرات" را بزنید.
            </p>
          </div>
        </div>
      </BottomSheet>

      {/* Year Selection Bottom Sheet */}
      <BottomSheet
        isOpen={showYearSheet}
        onClose={() => setShowYearSheet(false)}
        title="انتخاب سال شمسی"
      >
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => {
            const year = getCurrentPersianYear() - 2 + i
            return (
              <button
                key={year}
                onClick={() => {
                  setChargeYear(year)
                  setShowYearSheet(false)
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  chargeYear === year
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📅</span>
                  <span className="font-medium">{year}</span>
                  {year === getCurrentPersianYear() && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                      سال جاری
                    </span>
                  )}
                </div>
                {chargeYear === year && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
          سال شمسی برای محاسبه شارژ ماهانه استفاده می‌شود
        </p>
      </BottomSheet>

      {/* Archive Confirmation */}
      <BottomSheet
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        title={project.isArchived ? 'فعال‌سازی پروژه' : 'آرشیو پروژه'}
      >
        <div className="space-y-4">
          {project.isArchived ? (
            <>
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <span className="text-2xl">✅</span>
                <p className="text-green-700 dark:text-green-400 text-sm">
                  با فعال‌سازی، می‌توانید مجدداً هزینه ثبت کنید
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="text-2xl">📦</span>
                <p className="text-amber-700 dark:text-amber-400 text-sm">
                  پروژه بسته می‌شود ولی اطلاعات حفظ می‌شود
                </p>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pr-4">
                <li>• امکان ثبت هزینه جدید غیرفعال می‌شود</li>
                <li>• اطلاعات و گزارشات قابل مشاهده هستند</li>
                <li>• هر زمان می‌توانید پروژه را فعال کنید</li>
              </ul>
            </>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowArchiveConfirm(false)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleArchive}
              loading={archiving}
              className={`flex-1 ${project.isArchived ? '!bg-green-500 hover:!bg-green-600' : '!bg-amber-500 hover:!bg-amber-600'}`}
            >
              {project.isArchived ? 'فعال‌سازی' : 'آرشیو کردن'}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Delete Confirmation */}
      <BottomSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="حذف پروژه"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold text-red-900 dark:text-red-200 mb-1">
                این عملیات قابل بازگشت نیست!
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                تمام هزینه‌ها، اعضا، تسویه‌ها و اطلاعات مربوط به پروژه «{project.name}» برای همیشه پاک می‌شود.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleDelete}
              className="flex-1 !bg-red-500 hover:!bg-red-600"
            >
              حذف پروژه
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Add Category Bottom Sheet */}
      <BottomSheet
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        title="افزودن دسته‌بندی جدید"
      >
        <div className="space-y-4">
          <Input
            label="نام دسته‌بندی"
            placeholder="مثلاً: دارو، سینما، کافه..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              آیکون
            </label>
            <div className="flex flex-wrap gap-2">
              {categoryIcons.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewCategoryIcon(icon)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    newCategoryIcon === icon
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAddCategory}
            loading={savingCategory}
            disabled={!newCategoryName.trim()}
            className="w-full"
          >
            افزودن دسته‌بندی
          </Button>
        </div>
      </BottomSheet>

      {/* Edit Category Bottom Sheet */}
      <BottomSheet
        isOpen={!!showEditCategory}
        onClose={() => setShowEditCategory(null)}
        title="مدیریت دسته‌بندی"
      >
        {showEditCategory && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-3xl">{showEditCategory.icon}</span>
              <span className="font-semibold text-lg">{showEditCategory.name}</span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              این دسته‌بندی مختص این پروژه است. حذف آن روی قالب اصلی تأثیری ندارد.
            </p>

            <Button
              onClick={() => handleDeleteCategory(showEditCategory.id)}
              className="w-full !bg-red-500 hover:!bg-red-600"
            >
              حذف دسته‌بندی
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowEditCategory(null)}
              className="w-full"
            >
              انصراف
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Create Access Link Sheet */}
      <CreateAccessLinkSheet
        isOpen={showCreateAccessLink}
        onClose={() => setShowCreateAccessLink(false)}
        projectId={projectId}
        onSuccess={handleAccessLinkSuccess}
      />

      {/* Edit Access Link Sheet */}
      <EditAccessLinkSheet
        isOpen={!!editingAccessLink}
        onClose={() => setEditingAccessLink(null)}
        link={editingAccessLink}
        projectId={projectId}
        onSuccess={handleAccessLinkSuccess}
      />
    </main>
  )
}
