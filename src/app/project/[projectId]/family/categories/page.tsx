'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { familyTheme } from '@/styles/family-theme'

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
}

export default function CategoriesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [projectId])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/categories`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!name.trim()) {
      setError('نام دسته‌بندی الزامی است')
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon: icon.trim() || '📝',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      // Reset form and refresh
      setName('')
      setIcon('')
      setError('')
      setShowAddForm(false)
      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ایجاد دسته‌بندی')
    }
  }

  const handleEdit = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    if (!name.trim()) {
      setError('نام دسته‌بندی الزامی است')
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon: icon.trim() || category.icon,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      // Reset form and refresh
      setName('')
      setIcon('')
      setError('')
      setEditingId(null)
      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ویرایش دسته‌بندی')
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      fetchCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در حذف دسته‌بندی')
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setName(category.name)
    setIcon(category.icon || '')
    setError('')
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setName('')
    setIcon('')
    setError('')
  }

  const startAdd = () => {
    setShowAddForm(true)
    setEditingId(null)
    setName('')
    setIcon('')
    setError('')
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: familyTheme.colors.background }}
      >
        <div style={{ color: familyTheme.colors.textSecondary }}>در حال بارگذاری...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: familyTheme.colors.background }}>
      {/* Header */}
      <div
        className="text-white p-6 shadow-lg"
        style={{ background: familyTheme.gradients.primaryHeader }}
      >
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            ←
          </button>
          <h1
            className="font-bold"
            style={{
              fontSize: familyTheme.typography.pageTitle.size,
              fontWeight: familyTheme.typography.pageTitle.weight
            }}
          >
            مدیریت دسته‌بندی‌ها
          </h1>
        </div>
        <p
          className="text-white/90 mr-14"
          style={{ fontSize: familyTheme.typography.body.size }}
        >
          دسته‌بندی‌های هزینه را مدیریت کنید
        </p>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {/* Add button */}
        {!showAddForm && !editingId && (
          <button
            onClick={startAdd}
            className="w-full text-white py-4 rounded-2xl font-bold transition-all"
            style={{
              backgroundColor: familyTheme.colors.danger,
              boxShadow: familyTheme.card.shadow,
              fontSize: familyTheme.typography.body.size
            }}
          >
            ➕ افزودن دسته‌بندی جدید
          </button>
        )}

        {/* Add form */}
        {showAddForm && (
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{
              backgroundColor: familyTheme.colors.card,
              boxShadow: familyTheme.card.shadow
            }}
          >
            <h3
              className="font-bold"
              style={{
                fontSize: familyTheme.typography.subtitle.size,
                color: familyTheme.colors.textPrimary
              }}
            >
              دسته‌بندی جدید
            </h3>

            <div>
              <label
                className="block font-medium mb-2"
                style={{
                  fontSize: familyTheme.typography.body.size,
                  color: familyTheme.colors.textPrimary
                }}
              >
                نام <span style={{ color: familyTheme.colors.danger }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: خوراک و خواربار"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                style={{
                  backgroundColor: familyTheme.colors.background,
                  borderColor: familyTheme.colors.divider,
                  fontSize: familyTheme.typography.body.size
                }}
              />
            </div>

            <div>
              <label
                className="block font-medium mb-2"
                style={{
                  fontSize: familyTheme.typography.body.size,
                  color: familyTheme.colors.textPrimary
                }}
              >
                آیکون (ایموجی)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🍎"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                style={{
                  backgroundColor: familyTheme.colors.background,
                  borderColor: familyTheme.colors.divider,
                  fontSize: familyTheme.typography.body.size
                }}
                maxLength={2}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: familyTheme.colors.dangerSoft,
                  border: `1px solid ${familyTheme.colors.danger}33`,
                  color: familyTheme.colors.danger,
                  fontSize: familyTheme.typography.body.size
                }}
              >
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleAdd}
                className="flex-1 text-white py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: familyTheme.colors.danger,
                  fontSize: familyTheme.typography.body.size
                }}
              >
                ذخیره
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false)
                  setName('')
                  setIcon('')
                  setError('')
                }}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: familyTheme.colors.divider,
                  color: familyTheme.colors.textPrimary,
                  fontSize: familyTheme.typography.body.size
                }}
              >
                انصراف
              </Button>
            </div>
          </div>
        )}

        {/* Categories list */}
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: familyTheme.colors.card,
                boxShadow: familyTheme.card.shadow
              }}
            >
              {editingId === category.id ? (
                // Edit mode
                <div className="space-y-4">
                  <div>
                    <label
                      className="block font-medium mb-2"
                      style={{
                        fontSize: familyTheme.typography.body.size,
                        color: familyTheme.colors.textPrimary
                      }}
                    >
                      نام <span style={{ color: familyTheme.colors.danger }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{
                        backgroundColor: familyTheme.colors.background,
                        borderColor: familyTheme.colors.divider,
                        fontSize: familyTheme.typography.body.size
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block font-medium mb-2"
                      style={{
                        fontSize: familyTheme.typography.body.size,
                        color: familyTheme.colors.textPrimary
                      }}
                    >
                      آیکون (ایموجی)
                    </label>
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{
                        backgroundColor: familyTheme.colors.background,
                        borderColor: familyTheme.colors.divider,
                        fontSize: familyTheme.typography.body.size
                      }}
                      maxLength={2}
                    />
                  </div>

                  {error && (
                    <div
                      className="px-4 py-3 rounded-xl"
                      style={{
                        backgroundColor: familyTheme.colors.dangerSoft,
                        border: `1px solid ${familyTheme.colors.danger}33`,
                        color: familyTheme.colors.danger,
                        fontSize: familyTheme.typography.body.size
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleEdit(category.id)}
                      className="flex-1 text-white py-3 rounded-xl font-bold"
                      style={{
                        backgroundColor: familyTheme.colors.danger,
                        fontSize: familyTheme.typography.body.size
                      }}
                    >
                      ذخیره
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      className="flex-1 py-3 rounded-xl font-bold"
                      style={{
                        backgroundColor: familyTheme.colors.divider,
                        color: familyTheme.colors.textPrimary,
                        fontSize: familyTheme.typography.body.size
                      }}
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon || '📝'}</span>
                    <span
                      className="font-medium"
                      style={{
                        fontSize: familyTheme.typography.body.size,
                        color: familyTheme.colors.textPrimary
                      }}
                    >
                      {category.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="px-4 py-2 rounded-lg font-medium hover:opacity-80 transition-colors"
                      style={{
                        backgroundColor: familyTheme.colors.infoSoft,
                        color: familyTheme.colors.info,
                        fontSize: familyTheme.typography.small.size
                      }}
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="px-4 py-2 rounded-lg font-medium hover:opacity-80 transition-colors"
                      style={{
                        backgroundColor: familyTheme.colors.dangerSoft,
                        color: familyTheme.colors.danger,
                        fontSize: familyTheme.typography.small.size
                      }}
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && !showAddForm && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              backgroundColor: familyTheme.colors.card,
              boxShadow: familyTheme.card.shadow
            }}
          >
            <span className="text-6xl mb-4 block">📁</span>
            <p
              className="mb-4"
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              هنوز دسته‌بندی‌ای ایجاد نشده است
            </p>
            <button
              onClick={startAdd}
              className="font-medium hover:underline"
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.danger
              }}
            >
              اولین دسته‌بندی را بسازید
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
