/**
 * Checklist Templates - Central Registry
 * Exports all checklist templates and provides helper functions
 */

import { ChecklistTemplateCategory } from './types'
import { travelTemplates } from './travel'
import { gatheringTemplates } from './gathering'
import { personalFinanceTemplates } from './personal-finance'

// Export types
export * from './types'

/**
 * All checklist template categories with their templates
 */
export const checklistTemplateCategories: ChecklistTemplateCategory[] = [
  {
    id: 'travel',
    title: 'سفر',
    titleEn: 'Travel',
    icon: '✈️',
    color: '#3b82f6',
    templates: travelTemplates,
  },
  {
    id: 'gathering',
    title: 'دورهمی',
    titleEn: 'Gathering',
    icon: '🎉',
    color: '#a855f7',
    templates: gatheringTemplates,
  },
  {
    id: 'personal-finance',
    title: 'خرج شخصی',
    titleEn: 'Personal Finance',
    icon: '💰',
    color: '#f59e0b',
    templates: personalFinanceTemplates,
  },
]

/**
 * Get all templates from all categories
 */
export function getAllTemplates() {
  return checklistTemplateCategories.flatMap((cat) => cat.templates)
}

/**
 * Get a specific template by ID
 * @param id - Template ID (e.g., "travel-supplies")
 * @returns Template or undefined if not found
 */
export function getTemplateById(id: string) {
  return getAllTemplates().find((t) => t.id === id)
}

/**
 * Get all templates from a specific category
 * @param categoryId - Category ID (e.g., "travel")
 * @returns Array of templates in that category
 */
export function getTemplatesByCategory(categoryId: string) {
  const category = checklistTemplateCategories.find((c) => c.id === categoryId)
  return category?.templates || []
}

/**
 * Get a category by ID
 * @param categoryId - Category ID (e.g., "travel")
 * @returns Category or undefined if not found
 */
export function getCategoryById(categoryId: string) {
  return checklistTemplateCategories.find((c) => c.id === categoryId)
}
