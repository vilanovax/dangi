import { redirect } from 'next/navigation'
import { getProjectById } from '@/lib/services/project.service'
import { ReactNode } from 'react'

interface LayoutRedirectProps {
  projectId: string
  children: ReactNode
}

export async function LayoutRedirect({
  projectId,
  children,
}: LayoutRedirectProps) {
  // Fetch project to check template
  const project = await getProjectById(projectId)

  // Redirect to family dashboard if template is family
  if (project && project.template === 'family') {
    redirect(`/project/${projectId}/family`)
  }

  // Otherwise, render the children (standard project page)
  return <>{children}</>
}
