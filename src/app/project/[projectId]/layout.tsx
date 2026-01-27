import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getProjectById } from '@/lib/services/project.service'
import { getCurrentUser } from '@/lib/utils/auth'

interface LayoutProps {
  children: ReactNode
  params: Promise<{ projectId: string }>
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const { projectId } = await params

  // Check authentication
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/auth')
  }

  // Fetch project to check template
  const project = await getProjectById(projectId)
  if (!project) {
    redirect('/')
  }

  // Redirect to family dashboard if template is family (SERVER-SIDE)
  if (project.template === 'family') {
    redirect(`/project/${projectId}/family`)
  }

  // Otherwise, render the children (standard project page)
  return <>{children}</>
}
