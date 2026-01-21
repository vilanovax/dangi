// Auth utilities - Simple password hashing and JWT-like token

// Simple hash using Web Crypto API (works in Edge runtime)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + process.env.AUTH_SECRET || 'dangi-secret-key')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hashPassword(password)
  return hash === hashedPassword
}

// Simple token generation (Base64 encoded JSON with expiry)
const TOKEN_SECRET = process.env.AUTH_SECRET || 'dangi-secret-key-2024'

export function generateToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    rand: Math.random().toString(36).substring(2), // Add randomness
  }

  const jsonStr = JSON.stringify(payload)
  const base64 = Buffer.from(jsonStr).toString('base64')

  // Add simple signature
  const signature = Buffer.from(jsonStr + TOKEN_SECRET).toString('base64').substring(0, 16)

  return `${base64}.${signature}`
}

export function verifyToken(token: string): string | null {
  try {
    const [base64, signature] = token.split('.')
    if (!base64 || !signature) return null

    const jsonStr = Buffer.from(base64, 'base64').toString('utf-8')
    const expectedSig = Buffer.from(jsonStr + TOKEN_SECRET).toString('base64').substring(0, 16)

    if (signature !== expectedSig) return null

    const payload = JSON.parse(jsonStr)

    // Check expiry
    if (payload.exp < Date.now()) return null

    return payload.userId
  } catch {
    return null
  }
}

// Helper to get current user from cookies (for server components)
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) return null

    const userId = verifyToken(token)
    if (!userId) return null

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
      },
    })

    return user
  } catch {
    return null
  }
}
