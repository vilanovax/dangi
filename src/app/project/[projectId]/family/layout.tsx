import { BottomNav } from './components'

interface FamilyLayoutProps {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}

export default async function FamilyLayout({
  children,
  params,
}: FamilyLayoutProps) {
  const { projectId } = await params

  return (
    <div className="relative min-h-screen">
      {/* Main content with bottom padding to avoid overlap with bottom nav */}
      <div className="pb-20">
        {children}
      </div>

      {/* Bottom Navigation */}
      <BottomNav projectId={projectId} />
    </div>
  )
}
