# سیستم لایه‌بندی (Layout System)

این سند تغییرات فنی مربوط به سیستم یکپارچه هدر و فرم را توضیح می‌دهد.

## تغییرات کلی

### کامپوننت‌های جدید

| کامپوننت | مسیر | توضیح |
|----------|------|-------|
| `UnifiedHeader` | `src/components/layout/UnifiedHeader.tsx` | هدر یکپارچه با ۳ واریانت |
| `FormLayout` | `src/components/layout/FormLayout.tsx` | لایه‌بندی یکپارچه فرم‌ها |
| `TransferPreview` | `src/app/project/[projectId]/add-settlement/components/TransferPreview.tsx` | پیش‌نمایش انتقال پول |

### کامپوننت‌های حذف شده

| کامپوننت | دلیل |
|----------|------|
| `TravelHeader` | جایگزین شده با `UnifiedHeader` |
| `SettlementHeader` | جایگزین شده با `TransferPreview` + `UnifiedHeader` |

---

## UnifiedHeader

### واریانت‌ها

```typescript
type HeaderVariant = 'project' | 'action' | 'form'
```

| واریانت | کاربرد | ظاهر |
|---------|--------|------|
| `project` | داشبورد پروژه | گرادیان آبی با موج پایین |
| `action` | صفحات لیست (خرج‌ها، خلاصه) | گرادیان رنگی ساده |
| `form` | صفحات فرم | سفید مینیمال |

### Action Tones

```typescript
type ActionTone = 'default' | 'success' | 'danger' | 'warning'
```

| تون | رنگ | کاربرد |
|-----|-----|--------|
| `default` | آبی | پیش‌فرض |
| `success` | سبز | تسویه موفق |
| `danger` | قرمز | حذف |
| `warning` | نارنجی | هشدار |

### استفاده

```tsx
import { UnifiedHeader } from '@/components/layout'

// داشبورد پروژه
<UnifiedHeader
  variant="project"
  title="سفر شمال"
  projectMeta={{ membersCount: 5 }}
  showBack
  onBack={() => router.back()}
>
  <HeaderTotalCard
    label="مجموع خرج‌ها"
    amount={1500000}
    currency="IRR"
  />
</UnifiedHeader>

// صفحه فرم
<UnifiedHeader
  variant="form"
  title="ثبت هزینه"
  subtitle="اطلاعات هزینه رو وارد کن"
  showBack
  onBack={handleBack}
/>

// صفحه لیست
<UnifiedHeader
  variant="action"
  tone="default"
  title="خرج‌ها"
  subtitle="۱۰ مورد"
  showBack
  onBack={handleBack}
/>
```

### کامپوننت‌های کمکی

| کامپوننت | کاربرد |
|----------|--------|
| `HeaderCard` | کارت داخل هدر |
| `HeaderBadge` | بج (تعداد شرکت‌کننده) |
| `HeaderIconButton` | دکمه آیکون (تنظیمات) |
| `HeaderTotalCard` | کارت مجموع مبلغ |
| `HeaderSummaryCard` | کارت خلاصه |

---

## FormLayout

### ساختار

```
┌─────────────────────────────────┐
│         Header                  │ ← Sticky
├─────────────────────────────────┤
│         Context (optional)      │
├─────────────────────────────────┤
│         Hero Section            │ ← برجسته
├─────────────────────────────────┤
│         Divider                 │
├─────────────────────────────────┤
│         Secondary Fields        │ ← قابل اسکرول
│         (children)              │
├─────────────────────────────────┤
│         Footer CTA              │ ← Fixed
└─────────────────────────────────┘
```

### استفاده

```tsx
import { FormLayout, FormSection, FormError } from '@/components/layout'

<FormLayout
  header={
    <UnifiedHeader
      variant="form"
      title="ثبت هزینه"
      showBack
      onBack={handleBack}
    />
  }
  hero={<AmountInput value={amount} onChange={setAmount} />}
  footer={
    <Button onClick={handleSubmit} loading={submitting}>
      ثبت هزینه
    </Button>
  }
>
  {error && <FormError message={error} />}

  <FormSection title="عنوان">
    <Input value={title} onChange={setTitle} />
  </FormSection>

  <FormSection title="توضیحات" optional>
    <Input value={note} onChange={setNote} />
  </FormSection>
</FormLayout>
```

### کامپوننت‌های کمکی

| کامپوننت | کاربرد |
|----------|--------|
| `FormSection` | گروه‌بندی فیلدها با عنوان |
| `FormDivider` | جداکننده بین بخش‌ها |
| `FormContextBadge` | نمایش context (نام پروژه) |
| `FormError` | نمایش خطا |
| `FormSuccess` | نمایش موفقیت |

### توکن‌های فاصله‌گذاری

```typescript
const FORM_SPACING = {
  sectionGap: 'space-y-6',      // فاصله بین بخش‌ها
  fieldGap: 'space-y-5',        // فاصله بین فیلدها
  contentPadding: 'px-4 py-5',  // پدینگ محتوا
  footerSafeArea: 'pb-32',      // فضای امن فوتر
}
```

---

## Design Tokens

### HEADER_TOKENS

```typescript
const HEADER_TOKENS = {
  // Project variant
  project: {
    gradient: 'from-sky-400 via-blue-500 to-indigo-500',
    textPrimary: 'text-white',
    textSecondary: 'text-blue-100',
    cardBg: 'bg-white/15',
  },

  // Action variant tones
  action: {
    success: { gradient: 'from-green-500 to-emerald-600' },
    danger: { gradient: 'from-red-500 to-rose-600' },
    warning: { gradient: 'from-amber-500 to-orange-600' },
    default: { gradient: 'from-blue-500 to-blue-600' },
  },

  // Form variant
  form: {
    bg: 'bg-white/95 dark:bg-gray-900/95',
    textPrimary: 'text-gray-800 dark:text-gray-100',
    textSecondary: 'text-gray-500 dark:text-gray-400',
  },
}
```

---

## Migration Guide

### از TravelHeader به UnifiedHeader

**قبل:**
```tsx
import { TravelHeader } from '@/components/ui'

<TravelHeader
  projectName="سفر شمال"
  totalExpenses={1500000}
  currency="IRR"
/>
```

**بعد:**
```tsx
import { UnifiedHeader, HeaderTotalCard } from '@/components/layout'

<UnifiedHeader
  variant="project"
  title="سفر شمال"
  projectMeta={{ membersCount: 5 }}
  showBack
  onBack={() => router.back()}
>
  <HeaderTotalCard
    label="مجموع خرج‌ها"
    amount={1500000}
    currency="IRR"
  />
</UnifiedHeader>
```

### از ساختار دستی به FormLayout

**قبل:**
```tsx
<main className="min-h-dvh">
  <header>...</header>
  <div className="p-4">
    <input />
    <input />
  </div>
  <div className="fixed bottom-0">
    <Button>ثبت</Button>
  </div>
</main>
```

**بعد:**
```tsx
<FormLayout
  header={<UnifiedHeader variant="form" title="عنوان" />}
  hero={<HeroComponent />}
  footer={<Button>ثبت</Button>}
>
  <FormSection title="فیلد ۱">
    <Input />
  </FormSection>
</FormLayout>
```

---

## صفحات آپدیت شده

| صفحه | تغییرات |
|------|---------|
| `add-expense` | استفاده از `FormLayout` + `UnifiedHeader variant="form"` |
| `add-settlement` | استفاده از `FormLayout` + `TransferPreview` |
| `expenses` | استفاده از `UnifiedHeader variant="action"` |
| `summary` | استفاده از `UnifiedHeader variant="action"` |
| `DashboardHeader` | استفاده از `UnifiedHeader variant="project"` |

---

## فایل‌های تغییر یافته

```
src/components/layout/
├── index.ts              # Exports
├── UnifiedHeader.tsx     # NEW - هدر یکپارچه
└── FormLayout.tsx        # NEW - لایه‌بندی فرم

src/components/ui/
└── index.ts              # حذف export TravelHeader

src/app/project/[projectId]/
├── add-expense/page.tsx          # Refactored
├── add-settlement/
│   ├── page.tsx                  # Refactored
│   └── components/
│       ├── TransferPreview.tsx   # NEW
│       └── index.ts              # Updated
├── components/
│   └── DashboardHeader.tsx       # Migrated
├── expenses/components/
│   └── ExpensesHeader.tsx        # Migrated
└── summary/page.tsx              # Migrated
```
