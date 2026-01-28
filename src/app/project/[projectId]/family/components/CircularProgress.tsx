'use client'

import { familyTheme } from '@/styles/family-theme'

interface CircularProgressProps {
  percentage: number // 0-100
  size?: number // diameter in pixels
  strokeWidth?: number
  income: number
  expense: number
  currency: string
}

export function CircularProgress({
  percentage,
  size = 200,
  strokeWidth = 12,
  income,
  expense,
  currency,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const netBalance = income - expense
  const isPositive = netBalance >= 0

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={familyTheme.colors.primarySoft}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isPositive ? familyTheme.colors.success : familyTheme.colors.danger}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <div
            className="font-bold"
            style={{
              fontSize: '24px',
              fontWeight: familyTheme.typography.cardNumber.weight,
              color: isPositive ? familyTheme.colors.success : familyTheme.colors.danger
            }}
          >
            {isPositive ? '+' : ''}
            {netBalance.toLocaleString('fa-IR')}
          </div>
          <div
            className="mt-1"
            style={{
              fontSize: familyTheme.typography.small.size,
              color: familyTheme.colors.textSecondary
            }}
          >
            {currency}
          </div>
          <div
            className="mt-2"
            style={{
              fontSize: familyTheme.typography.small.size,
              color: familyTheme.colors.textTertiary
            }}
          >
            خالص
          </div>
        </div>
      </div>
    </div>
  )
}
