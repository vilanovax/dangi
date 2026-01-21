// Domain Types for Dangi

export type SplitType = 'EQUAL' | 'WEIGHTED' | 'PERCENTAGE' | 'MANUAL'

export type ParticipantRole = 'OWNER' | 'MEMBER'

export interface ProjectSummary {
  projectId: string
  projectName: string
  totalExpenses: number
  currency: string
  participantBalances: ParticipantBalance[]
  settlements: Settlement[]
}

export interface ParticipantBalance {
  participantId: string
  participantName: string
  totalPaid: number      // چقدر پرداخت کرده
  totalShare: number     // سهمش چقدر بوده
  balance: number        // مثبت = طلبکار، منفی = بدهکار
}

export interface Settlement {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

export interface ExpenseInput {
  title: string
  amount: number
  description?: string
  paidById: string
  categoryId?: string
  expenseDate?: Date
  // شرکت‌کننده‌های شامل در تقسیم (اگر خالی باشه همه شامل میشن)
  includedParticipantIds?: string[]
  // برای تقسیم Manual
  customShares?: { participantId: string; amount: number }[]
}

export interface SplitResult {
  participantId: string
  amount: number
  weight: number
}

// Template definitions
export interface TemplateDefinition {
  id: string
  name: string
  nameFa: string
  defaultCategories: CategoryDefinition[]
  defaultSplitType: SplitType
  icon: string
  labels: TemplateLabels
}

export interface CategoryDefinition {
  name: string
  nameFa: string
  icon: string
  color: string
}

// Template-specific labels for UX microcopy
export interface TemplateLabels {
  // Page titles
  addExpenseTitle: string
  addExpenseSubtitle: string

  // Form fields
  expenseTitleLabel: string
  expenseTitlePlaceholder: string
  expenseTitleHelper: string

  amountLabel: string
  amountPlaceholder: string

  categoryLabel: string
  categoryHelper: string
  addCategoryPlaceholder: string

  paidByLabel: string
  paidByHelper: string

  splitBetweenLabel: string
  splitBetweenHelper: string

  // CTA
  submitButton: string
  submittingButton: string

  // Success/Error
  successMessage: string
  errorMessage: string

  // Edge cases
  onlyForYouMessage: string
  payerNotIncludedMessage: string
  deletedCategoryLabel: string

  // Generic terms
  expenseTerm: string // "خرج" vs "شارژ"
  participantTerm: string // "نفر" vs "واحد"
}
