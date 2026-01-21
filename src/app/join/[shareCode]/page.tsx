'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, Card } from '@/components/ui'

interface Project {
  id: string
  name: string
  participants: { id: string; name: string }[]
}

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const shareCode = params.shareCode as string

  const [project, setProject] = useState<Project | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProject()
  }, [shareCode])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/join/${shareCode}`)
      if (!res.ok) throw new Error('پروژه یافت نشد')

      const data = await res.json()
      setProject(data.project)
    } catch {
      setError('لینک دعوت نامعتبر است')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('لطفاً نام خود را وارد کنید')
      return
    }

    if (!project) return

    setJoining(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${project.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) throw new Error('خطا در پیوستن')

      router.push(`/project/${project.id}`)
    } catch {
      setError('خطا در پیوستن به پروژه')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={() => router.push('/')}>بازگشت به خانه</Button>
      </div>
    )
  }

  if (!project) return null

  return (
    <main className="min-h-dvh p-4 flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">👋</div>
        <h1 className="text-2xl font-bold mb-2">دعوت به پروژه</h1>
        <p className="text-gray-500 mb-6">
          شما به <span className="font-semibold text-blue-500">{project.name}</span> دعوت شده‌اید
        </p>

        <Card className="w-full max-w-sm mb-6">
          <p className="text-sm text-gray-500 mb-2">اعضای فعلی:</p>
          <div className="flex flex-wrap gap-2">
            {project.participants.map((p) => (
              <span
                key={p.id}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
              >
                {p.name}
              </span>
            ))}
          </div>
        </Card>

        <div className="w-full max-w-sm">
          <Input
            label="نام شما"
            placeholder="نامتان را وارد کنید"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-3">{error}</p>
        )}
      </div>

      {/* Join Button */}
      <div className="mt-6">
        <Button
          onClick={handleJoin}
          loading={joining}
          className="w-full"
          size="lg"
        >
          پیوستن به پروژه
        </Button>
      </div>
    </main>
  )
}
