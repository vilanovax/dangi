import type { Metadata, Viewport } from 'next'
import './globals.css'
import { InstallPrompt, OfflineBanner, ServiceWorkerRegistration } from '@/components/pwa'

export const metadata: Metadata = {
  title: 'دنگی - تقسیم هزینه‌های گروهی',
  description: 'اپلیکیشن هوشمند تقسیم هزینه‌های سفر، ساختمان، دورهمی و پروژه‌های گروهی',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'دنگی',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-gray-50 dark:bg-gray-950">
        <ServiceWorkerRegistration />
        <OfflineBanner />
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
