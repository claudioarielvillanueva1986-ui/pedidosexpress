export type SectionId = 'inicio' | 'menu' | 'local' | 'pagos' | 'envio'

export interface Category {
  id: string
  name: string
  emoji: string
}

export interface Product {
  id: string
  categoryId: string
  name: string
  desc: string
  price: number
  img: string
  available: boolean
}

export interface LocalConfig {
  name: string
  slogan: string
  logo: string
  primaryColor: string
  whatsapp: string
  phone: string
  email: string
  address: string
}

export interface ScheduleDay {
  day: string
  open: boolean
  from: string
  to: string
}

export interface PaymentsConfig {
  cashEnabled: boolean
  transferEnabled: boolean
  alias: string
  cbu: string
  holder: string
  message: string
}

export interface ShippingConfig {
  deliveryEnabled: boolean
  pickupEnabled: boolean
  cost: number | ''
  freeFrom: number | ''
  zone: string
  etaDelivery: string
  etaPickup: string
}

export interface ProductDraft {
  name: string
  desc: string
  price: number | ''
  img: string
  categoryId: string
  available: boolean
}

export interface NavItem {
  id: SectionId
  name: string
  icon: string
  title: string
  subtitle: string
}
