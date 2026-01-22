'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, Card, BottomSheet } from '@/components/ui'
import { formatMoney, parseMoney } from '@/lib/utils/money'
import { getTemplate } from '@/lib/domain/templates'

interface ChargeRule {
  id: string
  title: string
  amount: number
  frequency: 'monthly' | 'yearly'
  splitType: string
  isActive: boolean
  createdAt: string
}

interface Project {
  id: string
  name: string
  currency: string
  template: string
}

const FREQUENCIES = [
  { code: 'monthly', label: 'ماهانه' },
  { code: 'yearly', label: 'سالانه' },
]

const SPLIT_TYPES = [
  { code: 'EQUAL', label: 'مساوی' },
  { code: 'WEIGHTED', label: 'وزنی' },
  { code: 'PERCENTAGE', label: 'درصدی' },
]

export default function ChargeRulesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [rules, setRules] = useState<ChargeRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Add/Edit modal
  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editingRule, setEditingRule] = useState<ChargeRule | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly')
  const [splitType, setSplitType] = useState('WEIGHTED')
  const [isActive, setIsActive] = useState(true)

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ChargeRule | null>(null)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      // Fetch project
      const projectRes = await fetch(`/api/projects/${projectId}`)
      if (!projectRes.ok) throw new Error('پروژه یافت نشد')
      const projectData = await projectRes.json()
      setProject(projectData.project)

      // Check if template supports charge rules
      const template = getTemplate(projectData.project.template)
      if (!template.supportsChargeRules) {
        setError('این قالب از قواعد شارژ پشتیبانی نمی‌کند')
        setLoading(false)
        return
      }

      // Fetch charge rules
      const rulesRes = await fetch(`/api/projects/${projectId}/charge-rules`)
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData.chargeRules || [])
      }
    } catch {
      setError('خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingRule(null)
    setTitle('')
    setAmount('')
    setFrequency('monthly')
    setSplitType('WEIGHTED')
    setIsActive(true)
    setShowAddEdit(true)
  }

  const openEditModal = (rule: ChargeRule) => {
    setEditingRule(rule)
    setTitle(rule.title)
    setAmount(formatMoney(rule.amount, 'IRR'))
    setFrequency(rule.frequency)
    setSplitType(rule.splitType)
    setIsActive(rule.isActive)
    setShowAddEdit(true)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('عنوان الزامی است')
      return
    }

    const parsedAmount = parseMoney(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('مبلغ باید بیشتر از صفر باشد')
      return
    }

    setSaving(true)
    setError('')

    try {
      const body = {
        title: title.trim(),
        amount: parsedAmount,
        frequency,
        splitType,
        isActive,
      }

      let res: Response
      if (editingRule) {
        // Update
        res = await fetch(`/api/projects/${projectId}/charge-rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        // Create
        res = await fetch(`/api/projects/${projectId}/charge-rules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ذخیره')
      }

      const data = await res.json()

      if (editingRule) {
        // Update in list
        setRules(rules.map(r => r.id === editingRule.id ? data.chargeRule : r))
        setSuccess('قاعده با موفقیت بروزرسانی شد')
      } else {
        // Add to list
        setRules([...rules, data.chargeRule])
        setSuccess('قاعده جدید با موفقیت ایجاد شد')
      }

      setShowAddEdit(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) return

    try {
      const res = await fetch(`/api/projects/${projectId}/charge-rules/${showDeleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('خطا در حذف')

      setRules(rules.filter(r => r.id !== showDeleteConfirm.id))
      setShowDeleteConfirm(null)
      setSuccess('قاعده حذف شد')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('خطا در حذف قاعده')
    }
  }

  const toggleActive = async (rule: ChargeRule) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/charge-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      })

      if (!res.ok) throw new Error('خطا در بروزرسانی')

      const data = await res.json()
      setRules(rules.map(r => r.id === rule.id ? data.chargeRule : r))
    } catch {
      setError('خطا در تغییر وضعیت')
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
    <main className="min-h-dvh pb-24">
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
          <div>
            <h1 className="text-xl font-bold">قواعد شارژ</h1>
            <p className="text-xs text-gray-500">تعریف پرداخت‌های دوره‌ای مورد انتظار</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
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

        {/* Rules List */}
        {rules.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 mb-2">هیچ قاعده شارژی تعریف نشده</p>
            <p className="text-sm text-gray-400">
              با تعریف قواعد شارژ، می‌توانید پرداخت‌های دوره‌ای مورد انتظار را مشخص کنید
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <Card
                key={rule.id}
                className={`transition-opacity ${!rule.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => openEditModal(rule)}>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{rule.title}</h3>
                      {!rule.isActive && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                          غیرفعال
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {formatMoney(rule.amount, project.currency)}
                      </span>
                      <span>•</span>
                      <span>{FREQUENCIES.find(f => f.code === rule.frequency)?.label}</span>
                      <span>•</span>
                      <span>{SPLIT_TYPES.find(s => s.code === rule.splitType)?.label}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(rule)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {rule.isActive ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Add Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <Button onClick={openAddModal} className="w-full" size="lg">
          + افزودن قاعده جدید
        </Button>
      </div>

      {/* Add/Edit Bottom Sheet */}
      <BottomSheet
        isOpen={showAddEdit}
        onClose={() => setShowAddEdit(false)}
        title={editingRule ? 'ویرایش قاعده' : 'افزودن قاعده جدید'}
      >
        <div className="space-y-4">
          <Input
            label="عنوان"
            placeholder="مثلاً: شارژ ماهیانه، آب‌بها..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <Input
            label="مبلغ"
            placeholder="مثلاً: ۵۰۰,۰۰۰"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
          />

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تناوب
            </label>
            <div className="flex gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.code}
                  type="button"
                  onClick={() => setFrequency(f.code as 'monthly' | 'yearly')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                    frequency === f.code
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Split Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نوع تقسیم
            </label>
            <div className="flex gap-2">
              {SPLIT_TYPES.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setSplitType(s.code)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                    splitType === s.code
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Toggle */}
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
          >
            <span className="text-gray-700 dark:text-gray-300">فعال</span>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${
              isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isActive ? 'right-1' : 'left-1'
              }`} />
            </div>
          </button>

          <div className="flex gap-3 pt-2">
            {editingRule && (
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddEdit(false)
                  setShowDeleteConfirm(editingRule)
                }}
                className="!text-red-600 !border-red-200 hover:!bg-red-50"
              >
                حذف
              </Button>
            )}
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!title.trim() || !amount}
              className="flex-1"
            >
              {editingRule ? 'بروزرسانی' : 'افزودن'}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Delete Confirmation */}
      <BottomSheet
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="حذف قاعده"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            آیا مطمئن هستید که می‌خواهید قاعده «{showDeleteConfirm?.title}» را حذف کنید؟
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleDelete}
              className="flex-1 !bg-red-500 hover:!bg-red-600"
            >
              حذف
            </Button>
          </div>
        </div>
      </BottomSheet>
    </main>
  )
}
