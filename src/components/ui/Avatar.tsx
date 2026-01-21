'use client'

import Image from 'next/image'
import type { Avatar as AvatarType } from '@/lib/types/avatar'
import { generateAutoAvatar } from '@/lib/types/avatar'

interface AvatarProps {
  avatar?: AvatarType | null
  name: string // برای fallback به auto avatar
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const imageSizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

export function Avatar({ avatar, name, size = 'md', className = '' }: AvatarProps) {
  // اگر آواتار نداریم، یک auto avatar می‌سازیم
  const resolvedAvatar = avatar || generateAutoAvatar(name)

  const sizeClass = sizeClasses[size]
  const imageSize = imageSizes[size]

  // آواتار از پیش تعریف شده
  if (resolvedAvatar.type === 'preset') {
    return (
      <div className={`relative rounded-full overflow-hidden ${sizeClass} ${className}`}>
        <Image
          src={`/avatars/${resolvedAvatar.value}.svg`}
          alt={name}
          width={imageSize}
          height={imageSize}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // آواتار آپلود شده (برای آینده)
  if (resolvedAvatar.type === 'uploaded') {
    return (
      <div className={`relative rounded-full overflow-hidden ${sizeClass} ${className}`}>
        <Image
          src={resolvedAvatar.value}
          alt={name}
          width={imageSize}
          height={imageSize}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // آواتار خودکار (حرف + رنگ)
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold ${sizeClass} ${className}`}
      style={{ backgroundColor: resolvedAvatar.value }}
    >
      {resolvedAvatar.letter}
    </div>
  )
}
