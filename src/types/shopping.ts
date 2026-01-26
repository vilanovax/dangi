// Shopping Checklist Types

export interface ShoppingItem {
  id: string
  text: string
  isChecked: boolean
  quantity?: string | null
  note?: string | null
  addedBy?: {
    id: string
    name: string
    avatar?: string | null
  } | null
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
}

export interface UpdateShoppingItemInput {
  text?: string
  isChecked?: boolean
  quantity?: string
  note?: string
}
