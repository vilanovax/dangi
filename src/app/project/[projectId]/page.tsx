import { redirect } from 'next/navigation'
import { getProjectById } from '@/lib/services/project.service'
import { getCurrentUser } from '@/lib/utils/auth'
import ProjectPageClient from './ProjectPageClient'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: PageProps) {
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

  // Redirect to family dashboard if template is family (SERVER-SIDE, before render)
  if (project.template === 'family') {
    redirect(`/project/${projectId}/family`)
  }

  // Otherwise, render the client component
  return <ProjectPageClient />
}
