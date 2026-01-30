/**
 * Family Finance Template - Unified Input Component
 *
 * کامپوننت input یکپارچه با پشتیبانی از currency formatting
 */

'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'
import { FamilyIcon, type IconName } from './FamilyIcon'

export type InputSize = 'md' | 'lg' | 'hero'

export interface FamilyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  icon?: IconName
  size?: InputSize
}

const sizeClasses: Record<InputSize, string> = {
  md: 'px-4 py-3 text-[15px]',
  lg: 'px-4 py-4 text-[18px]',
  hero: 'px-6 py-6 text-[44px] font-extrabold',
}

/**
 * Input یکپارچه با label, error, hint
 *
 * @example
 * <FamilyInput
 *   label="مبلغ"
 *   value={amount}
 *   onChange={handleChange}
 *   error="مبلغ را وارد کنید"
 * />
 */
export const FamilyInput = forwardRef<HTMLInputElement, FamilyInputProps>(
  ({ label, error, hint, icon, size = 'md', className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2 text-[14px]">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <FamilyIcon name={icon} size={20} className="text-gray-400" />
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full
              ${sizeClasses[size]}
              ${icon ? 'pr-12' : ''}
              bg-gray-50 dark:bg-gray-800
              border
              ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
              rounded-xl
              focus:outline-none
              focus:ring-2
              focus:ring-[#FF8A00]
              focus:border-transparent
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-colors
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <p className="text-red-600 dark:text-red-400 text-[12px] mt-1 flex items-center gap-1">
            <FamilyIcon name="warning" size={14} />
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-gray-500 dark:text-gray-400 text-[12px] mt-1">{hint}</p>
        )}
      </div>
    )
  }
)

FamilyInput.displayName = 'FamilyInput'
