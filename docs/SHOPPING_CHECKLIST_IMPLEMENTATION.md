# مستندات پیاده‌سازی چک‌لیست خرید (Shopping Checklist)

این سند شامل تمام اطلاعات و اسکریپت‌های لازم برای پیاده‌سازی مجدد فیچر چک‌لیست خرید است.

## فهرست مطالب
1. [تغییرات دیتابیس](#تغییرات-دیتابیس)
2. [دستورات Migration](#دستورات-migration)
3. [Type Definitions](#type-definitions)
4. [Service Layer](#service-layer)
5. [API Routes](#api-routes)
6. [Frontend Components](#frontend-components)
7. [Integration Points](#integration-points)

---

## تغییرات دیتابیس

### Schema Changes (Prisma)

#### 1. مدل ShoppingItem (جدید)

```prisma
// چک‌لیست خرید - لیست خریدها برای دورهمی (فقط برای template gathering)
model ShoppingItem {
  id        String       @id @default(cuid())
  text      String       // متن آیتم (مثلاً "پیتزا پپرونی 2 عدد")
  isChecked Boolean      @default(false) // آیا خریداری شده؟
  quantity  String?      // تعداد (اختیاری)
  note      String?      // یادداشت (اختیاری)
  addedById String?      // کی اضافه کرده
  projectId String
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  project   Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  addedBy   Participant? @relation(fields: [addedById], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@index([projectId, createdAt])
}
```

#### 2. تغییرات در مدل Project

```prisma
model Project {
  // ... فیلدهای موجود
  shoppingItems ShoppingItem[] // چک‌لیست خرید (برای template gathering)
}
```

#### 3. تغییرات در مدل Participant

```prisma
model Participant {
  // ... فیلدهای موجود
  shoppingItemsAdded ShoppingItem[] // آیتم‌های لیست خریدی که اضافه کرده
}
```

### نکات مهم دیتابیس

- **Cascade Delete**: وقتی پروژه حذف می‌شود، تمام آیتم‌های لیست خرید آن هم حذف می‌شوند
- **Set Null**: وقتی شرکت‌کننده حذف می‌شود، `addedById` به `null` تبدیل می‌شود (تاریخچه حفظ می‌شود)
- **Indexes**: دو ایندکس برای بهبود performance:
  - `[projectId]`: برای دریافت سریع آیتم‌های یک پروژه
  - `[projectId, createdAt]`: برای مرتب‌سازی بر اساس تاریخ

---

## دستورات Migration

### روش 1: Development (پیشنهادی برای محیط توسعه)

```bash
# همگام‌سازی schema با دیتابیس
npx prisma db push

# تولید Prisma Client
npx prisma generate
```

### روش 2: Production (برای محیط تولید)

```bash
# ساخت migration جدید
npx prisma migrate dev --name add_shopping_checklist

# اعمال migration در production
npx prisma migrate deploy
```

### بررسی تغییرات

```bash
# مشاهده وضعیت migration
npx prisma migrate status

# باز کردن Prisma Studio برای بررسی دیتا
npx prisma studio
```

---

## Type Definitions

### فایل: `src/types/shopping.ts`

```typescript
/**
 * Shopping Checklist Types
 * برای فیچر چک‌لیست خرید در template gathering
 */

export interface ShoppingItem {
  id: string
  text: string
  isChecked: boolean
  quantity?: string | null
  note?: string | null
  addedBy?: {
    id: string
    name: string
    avatar?: string | null
  } | null
  createdAt: string
}

export interface ShoppingStats {
  total: number
  checked: number
  unchecked: number
}

export interface ShoppingItemsResponse {
  items: ShoppingItem[]
  stats: ShoppingStats
}

export interface CreateShoppingItemInput {
  text: string
  quantity?: string
  note?: string
}

export interface UpdateShoppingItemInput {
  text?: string
  isChecked?: boolean
  quantity?: string
  note?: string
}
```

### به‌روزرسانی `src/types/index.ts`

```typescript
export * from './project'
export type {
  ShoppingItem,
  ShoppingStats,
  ShoppingItemsResponse,
  CreateShoppingItemInput,
  UpdateShoppingItemInput,
} from './shopping'
```

---

## Service Layer

### فایل: `src/lib/services/shopping.service.ts`

```typescript
// Shopping Checklist Service
// Manages shopping items for gathering template projects

import { prisma } from '@/lib/db/prisma'

/**
 * Get all shopping items for a project
 * Returns items sorted: unchecked first, then checked
 * Within each group, newest items first
 */
export async function getShoppingItems(projectId: string) {
  const items = await prisma.shoppingItem.findMany({
    where: { projectId },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: [
      { isChecked: 'asc' }, // unchecked first (false < true)
      { createdAt: 'desc' }, // newest first within each group
    ],
  })

  // Calculate stats
  const stats = {
    total: items.length,
    checked: items.filter((i) => i.isChecked).length,
    unchecked: items.filter((i) => !i.isChecked).length,
  }

  return { items, stats }
}

/**
 * Create a new shopping item
 */
export async function createShoppingItem(
  projectId: string,
  data: {
    text: string
    quantity?: string
    note?: string
    addedById?: string
  }
) {
  return await prisma.shoppingItem.create({
    data: {
      ...data,
      projectId,
    },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })
}

/**
 * Update a shopping item
 */
export async function updateShoppingItem(
  itemId: string,
  data: {
    text?: string
    isChecked?: boolean
    quantity?: string
    note?: string
  }
) {
  return await prisma.shoppingItem.update({
    where: { id: itemId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })
}

/**
 * Delete a shopping item
 */
export async function deleteShoppingItem(itemId: string) {
  await prisma.shoppingItem.delete({
    where: { id: itemId },
  })
}
```

### نکات Service Layer

- **Auto-sorting**: آیتم‌ها به صورت خودکار مرتب می‌شوند (unchecked اول، سپس checked)
- **Include addedBy**: اطلاعات کسی که آیتم را اضافه کرده همیشه برگردانده می‌شود
- **Stats calculation**: آمار به صورت real-time محاسبه می‌شود
- **UpdatedAt**: هر به‌روزرسانی، زمان را تغییر می‌دهد

---

## API Routes

### 1. Main Route: `/api/projects/[projectId]/shopping-items/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getShoppingItems, createShoppingItem } from '@/lib/services/shopping.service'

/**
 * GET /api/projects/[projectId]/shopping-items
 * Get all shopping items for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    const result = await getShoppingItems(projectId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching shopping items:', error)
    return NextResponse.json(
      { error: 'خطا در بارگذاری لیست خرید' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectId]/shopping-items
 * Create a new shopping item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()

    const { text, quantity, note, addedById } = body

    // Validation
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'متن آیتم الزامی است' },
        { status: 400 }
      )
    }

    if (text.trim().length > 200) {
      return NextResponse.json(
        { error: 'متن آیتم نباید بیشتر از ۲۰۰ کاراکتر باشد' },
        { status: 400 }
      )
    }

    const item = await createShoppingItem(projectId, {
      text: text.trim(),
      quantity: quantity?.trim() || undefined,
      note: note?.trim() || undefined,
      addedById: addedById || undefined,
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating shopping item:', error)
    return NextResponse.json(
      { error: 'خطا در افزودن آیتم' },
      { status: 500 }
    )
  }
}
```

### 2. Item Route: `/api/projects/[projectId]/shopping-items/[itemId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { updateShoppingItem, deleteShoppingItem } from '@/lib/services/shopping.service'

/**
 * PATCH /api/projects/[projectId]/shopping-items/[itemId]
 * Update a shopping item (toggle check, edit text, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
    const body = await request.json()

    const { text, isChecked, quantity, note } = body

    // Validation
    if (text !== undefined) {
      if (typeof text !== 'string' || !text.trim()) {
        return NextResponse.json(
          { error: 'متن آیتم نمی‌تواند خالی باشد' },
          { status: 400 }
        )
      }

      if (text.trim().length > 200) {
        return NextResponse.json(
          { error: 'متن آیتم نباید بیشتر از ۲۰۰ کاراکتر باشد' },
          { status: 400 }
        )
      }
    }

    if (isChecked !== undefined && typeof isChecked !== 'boolean') {
      return NextResponse.json(
        { error: 'مقدار isChecked باید boolean باشد' },
        { status: 400 }
      )
    }

    const item = await updateShoppingItem(itemId, {
      text: text?.trim(),
      isChecked,
      quantity: quantity?.trim() || undefined,
      note: note?.trim() || undefined,
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating shopping item:', error)
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی آیتم' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[projectId]/shopping-items/[itemId]
 * Delete a shopping item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params

    await deleteShoppingItem(itemId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shopping item:', error)
    return NextResponse.json(
      { error: 'خطا در حذف آیتم' },
      { status: 500 }
    )
  }
}
```

### نکات API Routes

- **Validation**: اعتبارسنجی کامل برای text (الزامی، حداکثر 200 کاراکتر)
- **Error Handling**: پیام‌های خطای فارسی و واضح
- **Status Codes**: استفاده صحیح از کدهای HTTP (201 برای CREATE، 400 برای BAD REQUEST)
- **Type Safety**: استفاده از TypeScript برای params و body

---

## Frontend Components

### 1. ShoppingChecklistTab Component

**مسیر**: `src/app/project/[projectId]/components/ShoppingChecklistTab.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { ShoppingItem, ShoppingStats } from '@/types'
import { ShoppingItemCard } from './ShoppingItemCard'
import { ShoppingItemInput } from './ShoppingItemInput'

interface ShoppingChecklistTabProps {
  projectId: string
  currentParticipantId?: string
}

export function ShoppingChecklistTab({ projectId, currentParticipantId }: ShoppingChecklistTabProps) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [stats, setStats] = useState<ShoppingStats>({ total: 0, checked: 0, unchecked: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchItems()
  }, [projectId])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}/shopping-items`)
      if (!res.ok) throw new Error('خطا در بارگذاری لیست')

      const data = await res.json()
      setItems(data.items)
      setStats(data.stats)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری لیست')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (text: string, quantity?: string, note?: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          quantity: quantity || undefined,
          note: note || undefined,
          addedById: currentParticipantId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در افزودن آیتم')
      }

      // Refetch to get updated sorted list
      await fetchItems()
    } catch (err) {
      throw err // Re-throw to let input component handle it
    }
  }

  const handleToggle = async (itemId: string, isChecked: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChecked }),
      })

      if (!res.ok) throw new Error('خطا در به‌روزرسانی')

      // Refetch to get updated sorted list
      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در به‌روزرسانی')
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items/${itemId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('خطا در حذف آیتم')

      // Refetch to get updated list
      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف آیتم')
    }
  }

  const handleEdit = async (itemId: string, text: string, quantity?: string, note?: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          quantity: quantity || undefined,
          note: note || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ویرایش آیتم')
      }

      // Refetch to get updated list
      await fetchItems()
    } catch (err) {
      throw err
    }
  }

  // Split items into unchecked and checked
  const uncheckedItems = items.filter((item) => !item.isChecked)
  const checkedItems = items.filter((item) => item.isChecked)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Stats Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              لیست خرید 🛒
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
              {stats.unchecked > 0 ? `${stats.unchecked} چیز مونده` : 'همه چیز خریده شد! 🎉'}
            </p>
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.checked}/{stats.total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              خریده شده
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Add New Item */}
      <ShoppingItemInput onAdd={handleAdd} />

      {/* Items List */}
      <div className="space-y-2">
        {/* Unchecked Items */}
        {uncheckedItems.map((item) => (
          <ShoppingItemCard
            key={item.id}
            item={item}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}

        {/* Checked Items - Separator */}
        {checkedItems.length > 0 && uncheckedItems.length > 0 && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-600">خریده شده</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
        )}

        {/* Checked Items */}
        {checkedItems.map((item) => (
          <ShoppingItemCard
            key={item.id}
            item={item}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🛒</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              لیست خالیه! چی باید بخریم؟
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2. ShoppingItemCard Component

**مسیر**: `src/app/project/[projectId]/components/ShoppingItemCard.tsx`

**ویژگی‌های کلیدی**:
- Checkbox برای toggle کردن وضعیت
- Strikethrough و opacity برای آیتم‌های checked
- دکمه‌های edit و delete که در hover نمایش داده می‌شوند
- فرم inline edit
- نمایش addedBy با Avatar
- تأیید برای delete

### 3. ShoppingItemInput Component

**مسیر**: `src/app/project/[projectId]/components/ShoppingItemInput.tsx`

**ویژگی‌های کلیدی**:
- Input سریع با placeholder راهنما
- دکمه "جزئیات" برای نمایش فیلدهای اختیاری (quantity, note)
- دکمه submit فقط زمانی نمایش داده می‌شود که text وارد شده باشد
- Error handling

---

## Integration Points

### 1. Project Page Integration

**فایل**: `src/app/project/[projectId]/page.tsx`

```typescript
// Import shopping component
import { ShoppingChecklistTab } from './components'

// Add tab state
const [activeTab, setActiveTab] = useState<'expenses' | 'shopping'>('expenses')

// Add tabs UI (only for gathering template)
{project.template === 'gathering' && (
  <div className="px-4 mt-6">
    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
      <button
        onClick={() => setActiveTab('expenses')}
        className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
          activeTab === 'expenses'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        💰 خرج‌ها
      </button>
      <button
        onClick={() => setActiveTab('shopping')}
        className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
          activeTab === 'shopping'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        🛒 لیست خرید
      </button>
    </div>
  </div>
)}

// Render shopping tab
{project.template === 'gathering' && activeTab === 'shopping' && (
  <section className="px-4 mt-6">
    <ShoppingChecklistTab
      projectId={projectId}
      currentParticipantId={myParticipantId || undefined}
    />
  </section>
)}

// Conditional rendering for expenses and settlements
{(project.template !== 'gathering' || activeTab === 'expenses') && (
  // ... expenses section
)}
```

### 2. Component Exports

**فایل**: `src/app/project/[projectId]/components/index.ts`

```typescript
// Shopping checklist components (gathering template)
export { ShoppingChecklistTab } from './ShoppingChecklistTab'
export { ShoppingItemCard } from './ShoppingItemCard'
export { ShoppingItemInput } from './ShoppingItemInput'
```

---

## نکات مهم پیاده‌سازی

### 1. Performance

- **Indexes**: دو ایندکس در دیتابیس برای سرعت بالا
- **Auto-sorting در query**: مرتب‌سازی در سطح دیتابیس (نه در JavaScript)
- **Refetch after mutations**: بعد از هر تغییر، لیست مجدد دریافت می‌شود

### 2. UX

- **Real-time feedback**: بعد از هر عملیات، UI بلافاصله به‌روز می‌شود
- **Loading states**: نمایش spinner در حال بارگذاری
- **Error messages**: پیام‌های خطای واضح و فارسی
- **Empty states**: پیام‌های راهنما برای لیست خالی

### 3. Security

- **Validation**: اعتبارسنجی در سطح API
- **Cascade delete**: حذف امن با حفظ یکپارچگی دیتا
- **Type safety**: استفاده کامل از TypeScript

### 4. Maintainability

- **Service layer**: منطق business در لایه جداگانه
- **Reusable components**: کامپوننت‌های قابل استفاده مجدد
- **Clear naming**: نام‌گذاری واضح و معنادار
- **Documentation**: کامنت‌های توضیحی در کد

---

## تست و راه‌اندازی

### 1. راه‌اندازی اولیه

```bash
# نصب dependencies (اگر نصب نشده)
npm install

# همگام‌سازی دیتابیس
npx prisma db push

# تولید Prisma Client
npx prisma generate

# اجرای پروژه
npm run dev
```

### 2. بررسی عملکرد

1. ساخت پروژه جدید با template "دورهمی"
2. رفتن به صفحه پروژه و کلیک روی تب "🛒 لیست خرید"
3. افزودن آیتم‌های مختلف
4. تست toggle کردن آیتم‌ها (بررسی انتقال به پایین لیست)
5. تست ویرایش و حذف آیتم‌ها
6. بررسی نمایش avatar و نام شخصی که آیتم را اضافه کرده

### 3. تست API با curl

```bash
# دریافت لیست آیتم‌ها
curl http://localhost:3000/api/projects/{projectId}/shopping-items

# افزودن آیتم جدید
curl -X POST http://localhost:3000/api/projects/{projectId}/shopping-items \
  -H "Content-Type: application/json" \
  -d '{"text":"پیتزا","quantity":"2 عدد","addedById":"participant_id"}'

# به‌روزرسانی آیتم (toggle)
curl -X PATCH http://localhost:3000/api/projects/{projectId}/shopping-items/{itemId} \
  -H "Content-Type: application/json" \
  -d '{"isChecked":true}'

# حذف آیتم
curl -X DELETE http://localhost:3000/api/projects/{projectId}/shopping-items/{itemId}
```

---

## عیب‌یابی مشکلات رایج

### مشکل: Migration error (drift detected)

**راه حل**: استفاده از `prisma db push` به جای `prisma migrate dev`

```bash
npx prisma db push
npx prisma generate
```

### مشکل: Type error با Avatar component

**راه حل**: استفاده از `deserializeAvatar` برای تبدیل JSON string به Avatar type

```typescript
import { deserializeAvatar } from '@/lib/types/avatar'

<Avatar
  name={item.addedBy.name}
  avatar={deserializeAvatar(item.addedBy.avatar || null, item.addedBy.name)}
  size="sm"
/>
```

### مشکل: Items مرتب نمی‌شوند

**بررسی**: مطمئن شوید `orderBy` در service layer صحیح است:

```typescript
orderBy: [
  { isChecked: 'asc' },  // unchecked first
  { createdAt: 'desc' }, // newest first
]
```

---

## چک‌لیست پیاده‌سازی کامل

- [ ] ✅ اضافه کردن ShoppingItem به schema.prisma
- [ ] ✅ اضافه کردن relation به Project model
- [ ] ✅ اضافه کردن relation به Participant model
- [ ] ✅ اجرای `npx prisma db push`
- [ ] ✅ اجرای `npx prisma generate`
- [ ] ✅ ساخت فایل types/shopping.ts
- [ ] ✅ به‌روزرسانی types/index.ts
- [ ] ✅ ساخت shopping.service.ts
- [ ] ✅ ساخت API route: shopping-items/route.ts
- [ ] ✅ ساخت API route: shopping-items/[itemId]/route.ts
- [ ] ✅ ساخت ShoppingChecklistTab component
- [ ] ✅ ساخت ShoppingItemCard component
- [ ] ✅ ساخت ShoppingItemInput component
- [ ] ✅ به‌روزرسانی components/index.ts
- [ ] ✅ اضافه کردن tab system به project page
- [ ] ✅ تست عملکرد کامل

---

## منابع و لینک‌های مفید

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**تاریخ آخرین به‌روزرسانی**: 2026-01-26
**نسخه**: 1.0.0
**وضعیت**: ✅ پیاده‌سازی کامل و تست شده
