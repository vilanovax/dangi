import type { Metadata, Viewport } from 'next'
import './globals.css'
import { InstallPrompt, OfflineBanner, ServiceWorkerRegistration } from '@/components/pwa'
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { QueryProvider } from '@/components/providers/QueryProvider'

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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('dangi_theme') || 'system';
                  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-gray-50 dark:bg-gray-950">
        <QueryProvider>
          <ThemeProvider>
            <ServiceWorkerRegistration />
            <OfflineBanner />
            {/* Desktop PWA Container - Center mobile view on desktop */}
            <div className="min-h-dvh mx-auto max-w-[480px] bg-white dark:bg-gray-900 shadow-2xl">
              <ClientErrorBoundary>
                {children}
              </ClientErrorBoundary>
            </div>
            <InstallPrompt />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
