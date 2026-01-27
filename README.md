# 💰 دنگی | Dangi

یک اپلیکیشن مدرن و کامل برای مدیریت هزینه‌های شخصی و گروهی، ساخته شده با Next.js و Prisma.

## ✨ ویژگی‌ها

### 🎯 تمپلیت‌های متنوع
- **سفر (Trip)**: مدیریت هزینه‌های سفرهای گروهی
- **ساختمان (Building)**: پیگیری هزینه‌های ساختمانی با سیستم شارژ
- **دورهمی (Gathering)**: مدیریت هزینه‌های دورهمی‌ها + لیست خرید
- **مالی شخصی (Personal)**: دو حالت Split (تقسیم هزینه) و Tracking (فقط ردیابی)

### 🔐 امنیت و احراز هویت
- احراز هویت با JWT
- Rate limiting برای محافظت از API
- Security headers استاندارد
- Hash کردن رمز عبور با bcrypt

### 📊 مدیریت هزینه‌ها
- ثبت و ویرایش هزینه‌ها
- دسته‌بندی هزینه‌ها با آیکون و رنگ
- آپلود رسید (S3-compatible storage)
- فیلتر کردن بر اساس تاریخ و دسته‌بندی

### 💳 تسویه حساب هوشمند
- محاسبه خودکار بدهی‌ها
- پیشنهاد بهینه برای تسویه
- امکان ثبت تسویه‌های دستی
- نمایش تاریخچه تسویه‌ها

### 📈 گزارش‌گیری و تحلیل
- نمودارهای تحلیلی با Recharts
- خلاصه هزینه‌ها بر اساس دسته‌بندی
- نمایش سهم هر نفر از هزینه‌ها
- Export به Excel

### 🎨 رابط کاربری مدرن
- طراحی Responsive با Tailwind CSS
- Dark mode کامل
- پشتیبانی RTL
- PWA support
- انیمیشن‌های روان

---

## 🚀 شروع به کار

### پیش‌نیازها

- **Node.js** 18.0 یا بالاتر
- **PostgreSQL** 14 یا بالاتر
- **npm** یا **pnpm** یا **yarn**

### نصب

#### 1. Clone کردن پروژه

```bash
git clone https://github.com/vilanovax/dangi.git
cd dangi
```

#### 2. نصب Dependencies

```bash
npm install
# یا
pnpm install
# یا
yarn install
```

#### 3. تنظیم Environment Variables

فایل `.env.example` رو کپی کنید:

```bash
cp .env.example .env
```

سپس متغیرهای زیر رو در `.env` پر کنید:

```env
# Database (الزامی)
DATABASE_URL="postgresql://user:password@localhost:5432/dangi"

# JWT Secret (الزامی - حداقل 32 کاراکتر)
JWT_SECRET="your-secret-key-at-least-32-characters-long"

# S3 Storage (اختیاری - برای آپلود فایل)
S3_ENDPOINT=""
S3_BUCKET=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_REGION="us-east-1"
```

**نکته مهم:** برای تولید JWT_SECRET:
```bash
openssl rand -base64 32
```

#### 4. Setup دیتابیس

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# یا اگر می‌خواهید از migrations استفاده کنید:
npx prisma migrate dev
```

#### 5. اجرای Development Server

```bash
npm run dev
```

اپلیکیشن روی [http://localhost:3000](http://localhost:3000) در دسترس خواهد بود.

---

## 📚 معماری

### Tech Stack

#### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS 4
- **UI Components:** Custom components
- **Charts:** Recharts
- **State Management:** React Hooks + SWR

#### Backend
- **API:** Next.js API Routes
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt

#### DevOps
- **Testing:** Vitest + React Testing Library
- **Logging:** Winston
- **Validation:** Zod
- **Deployment:** Vercel (recommended)

### ساختار پروژه

```
dangi/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── project/           # صفحات پروژه
│   │   └── page.tsx           # صفحه اصلی
│   ├── components/            # React Components
│   │   └── ui/               # UI Components
│   ├── lib/
│   │   ├── db/               # Database (Prisma)
│   │   ├── services/         # Business Logic
│   │   ├── utils/            # Utilities
│   │   ├── env.ts            # Environment Validation
│   │   └── errors.ts         # Custom Error Classes
│   ├── types/                # TypeScript Types
│   └── tests/                # Test Setup
├── prisma/
│   └── schema.prisma         # Database Schema
├── docs/                     # Documentation
├── vitest.config.ts         # Test Configuration
└── next.config.ts           # Next.js Configuration
```

---

## 🧪 تست

### اجرای تست‌ها

```bash
# همه تست‌ها
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Type checking
npm run type-check
```

### نوشتن تست جدید

تست‌ها در پوشه `__tests__` کنار فایل اصلی قرار می‌گیرند:

```typescript
// src/lib/utils/__tests__/money.test.ts
import { describe, it, expect } from 'vitest'
import { formatMoney } from '../money'

describe('formatMoney', () => {
  it('should format IRR currency', () => {
    expect(formatMoney(1000, 'IRR')).toBe('1,000 تومان')
  })
})
```

---

## 🛠️ Development

### مفاهیم کلیدی

#### 1. Environment Variables

متغیرهای محیطی با Zod اعتبارسنجی می‌شوند:

```typescript
import { env } from '@/lib/env'

// Type-safe access
const dbUrl = env.DATABASE_URL
```

#### 2. Error Handling

از custom error classes و centralized error handler استفاده کنید:

```typescript
import { apiHandler } from '@/lib/utils/api-handler'
import { NotFoundError } from '@/lib/errors'

export const GET = apiHandler(async (req: Request) => {
  const user = await getUser()
  if (!user) throw new NotFoundError('کاربر')
  return NextResponse.json({ user })
})
```

#### 3. Logging

از Winston logger استفاده کنید (نه console.log):

```typescript
import { logApiError, logger } from '@/lib/utils/logger'

try {
  // ...
} catch (error) {
  logApiError(error, { context: 'your-context' })
}

logger.info('User logged in', { userId: user.id })
```

### Scripts مفید

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint

# Database
npx prisma studio        # GUI برای دیتابیس
npx prisma migrate dev   # ایجاد migration جدید
npx prisma generate      # Generate Prisma Client
```

---

## 🚀 Deployment

### Vercel (توصیه می‌شود)

#### 1. Push to GitHub

```bash
git push origin main
```

#### 2. Import در Vercel

1. به [vercel.com](https://vercel.com) بروید
2. پروژه GitHub رو import کنید
3. Environment variables رو اضافه کنید
4. Deploy!

#### 3. تنظیم Database

از Vercel Postgres یا سرویس‌های زیر استفاده کنید:
- [Neon](https://neon.tech) (توصیه می‌شود)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build & Run
docker build -t dangi .
docker run -p 3000:3000 -e DATABASE_URL="..." -e JWT_SECRET="..." dangi
```

---

## 🔒 امنیت

### Best Practices پیاده‌سازی شده

✅ **Authentication:**
- JWT با expiry 30 روز
- HttpOnly cookies
- Rate limiting برای login و register

✅ **Security Headers:**
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- Referrer-Policy

✅ **Input Validation:**
- Zod schemas برای API validation
- Environment variable validation

✅ **Error Handling:**
- Centralized error handler
- خطاهای امنیتی لاگ نمی‌شن در production

✅ **Database:**
- Prisma ORM (محافظت در برابر SQL injection)
- Prepared statements

### توصیه‌ها برای Production

1. **JWT_SECRET** حتماً باید 32+ کاراکتر و random باشد
2. از **HTTPS** استفاده کنید
3. Password minimum length رو به **8 کاراکتر** افزایش دهید
4. Session token expiry رو بررسی کنید
5. برای production multi-instance از Redis rate limiting استفاده کنید

---

## 📖 مستندات API

API endpoints در `src/app/api/` قرار دارند.

### Authentication

```bash
# Register
POST /api/auth/register
{
  "phone": "09123456789",
  "password": "password",
  "name": "نام کاربر"
}

# Login
POST /api/auth/login
{
  "phone": "09123456789",
  "password": "password"
}

# Get Current User
GET /api/auth/me

# Logout
POST /api/auth/logout
```

### Projects

```bash
# Get All Projects
GET /api/projects

# Create Project
POST /api/projects
{
  "name": "نام پروژه",
  "template": "trip",
  "ownerName": "نام شما"
}

# Get Project
GET /api/projects/[projectId]

# Update Project
PATCH /api/projects/[projectId]

# Delete Project
DELETE /api/projects/[projectId]
```

برای مستندات کامل API، به [docs/API.md](docs/API.md) مراجعه کنید.

---

## 🤝 مشارکت

برای مشارکت در پروژه:

1. Fork کنید
2. یک branch جدید بسازید (`git checkout -b feature/amazing-feature`)
3. تغییرات رو commit کنید (`git commit -m 'feat: add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. یک Pull Request باز کنید

### Commit Message Convention

از [Conventional Commits](https://www.conventionalcommits.org/) استفاده می‌کنیم:

```
feat: اضافه کردن ویژگی جدید
fix: رفع باگ
docs: تغییرات مستندات
style: تغییرات فرمت کد
refactor: بازنویسی کد
test: اضافه کردن تست
chore: تغییرات build/tooling
```

---

## 📝 مجوز

این پروژه تحت مجوز MIT منتشر شده است. برای جزئیات بیشتر به [LICENSE](LICENSE) مراجعه کنید.

---

## 🙏 تشکر

- [Next.js](https://nextjs.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Vitest](https://vitest.dev)

---

## 📧 تماس

برای سوالات یا مشکلات، یک [Issue](https://github.com/vilanovax/dangi/issues) باز کنید.

**ساخته شده با ❤️ در ایران**
