export type SectionId = 'inicio' | 'pedidos' | 'reportes' | 'menu' | 'local' | 'pagos' | 'envio'

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
  paymentLink?: string
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

export type OrderDeliveryMethod = 'delivery' | 'pickup'
export type OrderPaymentMethod = 'cash' | 'mp'
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  name: string
  qty: number
  unitPrice: number
  subtotal: number
}

export interface OrderDraft {
  localeSlug: string
  customerName: string
  customerPhone: string
  customerAddress: string
  customerNotes: string
  deliveryMethod: OrderDeliveryMethod
  paymentMethod: OrderPaymentMethod
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
}

export interface Order extends OrderDraft {
  id: string
  status: OrderStatus
  createdAt: number
  updatedAt: number
  customerId?: string | null
}

export type UserRole = 'customer' | 'merchant' | 'admin'

export interface UserProfile {
  id: string
  role: UserRole
  fullName: string
  phone: string
  createdAt: number
}

export interface CustomerAddress {
  id: string
  ownerId: string
  label: string
  address: string
  notes: string
  isDefault: boolean
}

export type LocaleStatus = 'pending_review' | 'active' | 'suspended'
