import type {
  Category,
  LocaleStatus,
  LocalConfig,
  PaymentsConfig,
  Product,
  ScheduleDay,
  ShippingConfig,
} from '../types'

export interface LocaleState {
  slug: string
  categories: Category[]
  products: Product[]
  local: LocalConfig
  schedule: ScheduleDay[]
  payments: PaymentsConfig
  shipping: ShippingConfig
  localOpen: boolean
  status: LocaleStatus
  createdAt: number
}

export interface LocaleSummary {
  slug: string
  name: string
  slogan: string
  logo: string
  primaryColor: string
  localOpen: boolean
  status: LocaleStatus
  productCount: number
}
