import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getProjectById } from '@/lib/services/project.service'
import { getCurrentUser, requireProjectAccess } from '@/lib/utils/auth'
import { validateAccessLink } from '@/lib/services/access-link.service'
import ProjectPageClient from './ProjectPageClient'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = await params

  // Check authentication - support both user auth and access link auth
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    // If no user, check for access_token cookie (link-based access)
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (accessToken) {
      // Validate access link
      const validation = await validateAccessLink(accessToken)

      if (!validation.valid || validation.projectId !== projectId) {
        // Invalid or wrong project - redirect to auth
        redirect('/auth')
      }

      // Valid access link - allow access (no further checks needed)
    } else {
      // No user and no access token - require authentication
      redirect('/auth')
    }
  } else {
    // User is authenticated - verify they have access to this project
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      redirect('/')
    }
  }

  // Fetch project to check template
  const project = await getProjectById(projectId)
  if (!project) {
    redirect('/')
  }

  // Redirect to appropriate dashboard based on template (SERVER-SIDE, before render)
  if (project.template === 'building') {
    redirect(`/project/${projectId}/building`)
  }

  if (project.template === 'family' || (project.template === 'personal' && project.trackingOnly)) {
    redirect(`/project/${projectId}/family`)
  }

  // Otherwise, render the client component
  return <ProjectPageClient />
}
