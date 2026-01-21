// Template Registry
// All available templates for projects

import type { TemplateDefinition, TemplateLabels } from '@/lib/types/domain'
import { travelTemplate } from './travel'
import { buildingTemplate } from './building'

// Registry of all templates
export const templates: Record<string, TemplateDefinition> = {
  travel: travelTemplate,
  building: buildingTemplate,
  // Future templates:
  // party: partyTemplate,
  // custom: customTemplate,
}

export function getTemplate(templateId: string): TemplateDefinition {
  return templates[templateId] || travelTemplate
}

export function getTemplateLabels(templateId: string): TemplateLabels {
  return getTemplate(templateId).labels
}

export function getAllTemplates(): TemplateDefinition[] {
  return Object.values(templates)
}
