'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, Card, BottomSheet } from '@/components/ui'
import { getCurrencyLabel } from '@/lib/utils/money'
import { getTemplate } from '@/lib/domain/templates'
import { getCurrentPersianYear } from '@/lib/utils/persian-date'

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

  // Charge year state (only for building template)
  const [chargeYear, setChargeYear] = useState<number>(getCurrentPersianYear())

  // Modal states
  const [showCurrencySheet, setShowCurrencySheet] = useState(false)
  const [showSplitTypeSheet, setShowSplitTypeSheet] = useState(false)
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

  // Common emoji icons for categories
  const categoryIcons = ['🍕', '🚗', '🏨', '🎢', '🛍️', '💊', '🎬', '☕', '🎁', '📱', '✂️', '📝', '🔧', '🎉', '💡', '🏠']

  useEffect(() => {
    fetchProject()
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
      if (data.project.chargeYear) {
        setChargeYear(data.project.chargeYear)
      }
    } catch {
      setError('خطا در بارگذاری پروژه')
    } finally {
      setLoading(false)
    }
  }

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
        }),
      })

      if (!res.ok) throw new Error('خطا در ذخیره تنظیمات')

      setSuccess('تنظیمات با موفقیت ذخیره شد')
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
    setSuccess('لینک دعوت کپی شد!')
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
      setSuccess(data.project.isArchived ? 'پروژه آرشیو شد' : 'پروژه از آرشیو خارج شد')
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
      setSuccess('دسته‌بندی با موفقیت افزوده شد')
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
      setSuccess('دسته‌بندی حذف شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('خطا در حذف دسته‌بندی')
    }
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
    <main className="min-h-dvh pb-8">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">تنظیمات پروژه</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm">
            {success}
          </div>
        )}

        {/* Basic Info */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">اطلاعات پروژه</h2>
          <Card className="space-y-4">
            <Input
              label="نام پروژه"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="توضیحات (اختیاری)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح کوتاه درباره پروژه"
            />
          </Card>
        </section>

        {/* Currency & Split */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">تنظیمات مالی</h2>
          <Card className="divide-y divide-gray-100 dark:divide-gray-800">
            <button
              onClick={() => setShowCurrencySheet(true)}
              className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <span className="text-gray-700 dark:text-gray-300">واحد پول</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{getCurrencyLabel(currency)}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => setShowSplitTypeSheet(true)}
              className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <span className="text-gray-700 dark:text-gray-300">نوع تقسیم</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">
                  {SPLIT_TYPES.find((s) => s.code === splitType)?.label}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </button>
          </Card>
        </section>

        {/* Charge Rules - Only for templates that support it */}
        {getTemplate(project.template).supportsChargeRules && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">قواعد شارژ</h2>
            <Card className="divide-y divide-gray-100 dark:divide-gray-800">
              <button
                onClick={() => setShowYearSheet(true)}
                className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <span className="text-gray-700 dark:text-gray-300">سال شمسی</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{chargeYear}</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => router.push(`/project/${projectId}/charge-rules`)}
                className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">مدیریت قواعد شارژ</p>
                  <p className="text-xs text-gray-500 mt-1">
                    تعریف پرداخت‌های دوره‌ای مورد انتظار
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Card>
          </section>
        )}

        {/* Participants Management */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">اعضا</h2>
          <Card>
            <button
              onClick={() => router.push(`/project/${projectId}/participants`)}
              className="w-full flex items-center justify-between"
            >
              <div>
                <p className="font-medium">مدیریت اعضا</p>
                <p className="text-xs text-gray-500 mt-1">
                  افزودن، ویرایش یا حذف اعضای پروژه
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{project.participants.length} نفر</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </button>
          </Card>
        </section>

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500">دسته‌بندی‌ها</h2>
            <button
              onClick={() => setShowAddCategory(true)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              + افزودن
            </button>
          </div>
          <Card className="divide-y divide-gray-100 dark:divide-gray-800">
            {project.categories.length === 0 ? (
              <p className="text-gray-400 text-sm py-2 text-center">دسته‌بندی‌ای وجود ندارد</p>
            ) : (
              project.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setShowEditCategory(cat)}
                  className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ))
            )}
          </Card>
          <p className="text-xs text-gray-400 mt-2">
            دسته‌بندی‌های اختصاصی این پروژه. تغییرات روی قالب اصلی تأثیر نمی‌گذارد.
          </p>
        </section>

        {/* Share */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">اشتراک‌گذاری</h2>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">لینک دعوت</p>
                <p className="text-xs text-gray-500 mt-1">
                  با این لینک دیگران می‌توانند به پروژه بپیوندند
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={copyShareLink}>
                کپی لینک
              </Button>
            </div>
          </Card>
        </section>

        {/* Export */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">خروجی‌گیری</h2>
          <Card className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">خروجی Excel (CSV)</p>
                <p className="text-xs text-gray-500 mt-1">
                  لیست هزینه‌ها برای Excel
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
            <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">پشتیبان کامل (JSON)</p>
                <p className="text-xs text-gray-500 mt-1">
                  تمام اطلاعات پروژه
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleExportData}>
                دانلود
              </Button>
            </div>
          </Card>
        </section>

        {/* Save Button */}
        <Button onClick={handleSave} loading={saving} className="w-full">
          ذخیره تغییرات
        </Button>

        {/* Archive Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">وضعیت پروژه</h2>
          <Card className={project.isArchived ? 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10' : ''}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium flex items-center gap-2">
                  {project.isArchived ? (
                    <>
                      <span className="text-amber-600">📦</span>
                      <span className="text-amber-700 dark:text-amber-400">پروژه آرشیو شده</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>پروژه فعال</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {project.isArchived
                    ? 'پروژه بسته شده و فقط قابل مشاهده است'
                    : 'پروژه فعال است و می‌توان هزینه ثبت کرد'}
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
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-sm font-semibold text-red-500 mb-3">منطقه خطر</h2>
          <Card className="border-red-200 dark:border-red-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">حذف پروژه</p>
                <p className="text-xs text-gray-500 mt-1">
                  این عمل قابل بازگشت نیست
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="!text-red-600 !border-red-200 hover:!bg-red-50"
              >
                حذف
              </Button>
            </div>
          </Card>
        </section>
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
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                currency === curr.code
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-8">{curr.symbol}</span>
                <span>{curr.label}</span>
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
              className={`w-full text-right p-3 rounded-xl transition-all ${
                splitType === type.code
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{type.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{type.description}</p>
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
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  chargeYear === year
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent'
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
        <p className="text-xs text-gray-400 mt-4 text-center">
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
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <span className="text-2xl">✅</span>
                <p className="text-green-700 dark:text-green-400">
                  با فعال‌سازی، می‌توانید مجدداً هزینه ثبت کنید
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <span className="text-2xl">📦</span>
                <p className="text-amber-700 dark:text-amber-400">
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
          <p className="text-gray-600 dark:text-gray-400">
            آیا مطمئن هستید که می‌خواهید پروژه «{project.name}» را حذف کنید؟
            تمام هزینه‌ها و اطلاعات مربوط به این پروژه پاک خواهد شد.
          </p>
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
                      : 'bg-gray-100 dark:bg-gray-800'
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
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-2xl">{showEditCategory.icon}</span>
              <span className="font-medium">{showEditCategory.name}</span>
            </div>

            <p className="text-sm text-gray-500">
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
    </main>
  )
}
