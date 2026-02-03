// Shopping Checklist Types

export interface ParticipantInfo {
  id: string
  name: string
  avatar?: string | null
}

export interface ShoppingItem {
  id: string
  text: string
  isChecked: boolean
  quantity?: string | null
  note?: string | null
  addedBy?: ParticipantInfo | null
  assignedTo?: ParticipantInfo | null  // مسئول خرید
  checkedBy?: ParticipantInfo | null   // کی خریده
  checkedAt?: string | null            // زمان خرید
  createdAt: string
}

export interface ShoppingStats {
  total: number
  checked: number
  unchecked: number
}

export interface ShoppingItemsResponse {
  items: ShoppingItem[]
  stats: ShoppingStats
}

export interface CreateShoppingItemInput {
  text: string
  quantity?: string
  note?: string
  assignedToId?: string  // مسئول خرید (پیش‌فرض: کسی که اضافه کرده)
}

export interface UpdateShoppingItemInput {
  text?: string
  isChecked?: boolean
  quantity?: string
  note?: string
  assignedToId?: string  // تغییر مسئول خرید
}
