import { useEffect, useState } from 'react'
import { isCloudMode, supabase } from './supabase'
import type { Order, OrderDraft, OrderStatus } from '../types'
import { CHANGED_EVENT } from './localStore'

const ORDERS_KEY = 'pedidoExpress.orders.v1'
const ORDERS_EVENT = 'pedidoExpress.ordersChanged'

interface LocalOrdersStore {
  byLocale: Record<string, Order[]>
}

function readLocalOrders(): LocalOrdersStore {
  if (typeof window === 'undefined') return { byLocale: {} }
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LocalOrdersStore
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    /* ignore */
  }
  return { byLocale: {} }
}

function writeLocalOrders(store: LocalOrdersStore): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(store))
    window.dispatchEvent(new Event(ORDERS_EVENT))
  } catch {
    /* ignore */
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'o_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// --------- local mode ----------
function localCreateOrder(draft: OrderDraft): Order {
  const now = Date.now()
  const order: Order = {
    ...draft,
    id: newId(),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  const store = readLocalOrders()
  store.byLocale[draft.localeSlug] = [order, ...(store.byLocale[draft.localeSlug] ?? [])]
  writeLocalOrders(store)
  return order
}

function localListOrders(slug: string): Order[] {
  return readLocalOrders().byLocale[slug] ?? []
}

function localUpdateStatus(id: string, status: OrderStatus): void {
  const store = readLocalOrders()
  for (const slug of Object.keys(store.byLocale)) {
    store.byLocale[slug] = store.byLocale[slug].map((o) =>
      o.id === id ? { ...o, status, updatedAt: Date.now() } : o,
    )
  }
  writeLocalOrders(store)
}

function localDeleteOrder(id: string): void {
  const store = readLocalOrders()
  for (const slug of Object.keys(store.byLocale)) {
    store.byLocale[slug] = store.byLocale[slug].filter((o) => o.id !== id)
  }
  writeLocalOrders(store)
}

function localSubscribeOrders(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', cb)
  window.addEventListener(ORDERS_EVENT, cb)
  window.addEventListener(CHANGED_EVENT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(ORDERS_EVENT, cb)
    window.removeEventListener(CHANGED_EVENT, cb)
  }
}

// --------- cloud mode ----------
interface DbOrder {
  id: string
  locale_slug: string
  customer_name: string
  customer_phone: string
  customer_address: string | null
  customer_notes: string | null
  delivery_method: string
  payment_method: string
  subtotal: number
  delivery_fee: number
  total: number
  items: Order['items']
  status: OrderStatus
  created_at: string
  updated_at: string
}

function rowToOrder(r: DbOrder): Order {
  return {
    id: r.id,
    localeSlug: r.locale_slug,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerAddress: r.customer_address ?? '',
    customerNotes: r.customer_notes ?? '',
    deliveryMethod: (r.delivery_method as Order['deliveryMethod']) || 'delivery',
    paymentMethod: (r.payment_method as Order['paymentMethod']) || 'cash',
    subtotal: Number(r.subtotal) || 0,
    deliveryFee: Number(r.delivery_fee) || 0,
    total: Number(r.total) || 0,
    items: Array.isArray(r.items) ? r.items : [],
    status: r.status,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  }
}

async function cloudCreateOrder(draft: OrderDraft): Promise<Order> {
  if (!supabase) throw new Error('Cloud no configurado')
  const { data, error } = await supabase
    .from('orders')
    .insert({
      locale_slug: draft.localeSlug,
      customer_name: draft.customerName,
      customer_phone: draft.customerPhone,
      customer_address: draft.customerAddress,
      customer_notes: draft.customerNotes,
      delivery_method: draft.deliveryMethod,
      payment_method: draft.paymentMethod,
      subtotal: draft.subtotal,
      delivery_fee: draft.deliveryFee,
      total: draft.total,
      items: draft.items,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return rowToOrder(data as DbOrder)
}

async function cloudListOrders(slug: string): Promise<Order[]> {
  if (!supabase) throw new Error('Cloud no configurado')
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('locale_slug', slug)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []).map((r) => rowToOrder(r as DbOrder))
}

async function cloudUpdateStatus(id: string, status: OrderStatus): Promise<void> {
  if (!supabase) throw new Error('Cloud no configurado')
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

async function cloudDeleteOrder(id: string): Promise<void> {
  if (!supabase) throw new Error('Cloud no configurado')
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

function cloudSubscribeOrders(slug: string, cb: () => void): () => void {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`orders-${slug}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `locale_slug=eq.${slug}` },
      cb,
    )
    .subscribe()
  return () => {
    channel.unsubscribe()
  }
}

// --------- public API (dispatcher) ----------
export async function createOrder(draft: OrderDraft): Promise<Order> {
  if (!isCloudMode) return localCreateOrder(draft)
  return cloudCreateOrder(draft)
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  if (!isCloudMode) {
    localUpdateStatus(id, status)
    return
  }
  await cloudUpdateStatus(id, status)
}

export async function deleteOrder(id: string): Promise<void> {
  if (!isCloudMode) {
    localDeleteOrder(id)
    return
  }
  await cloudDeleteOrder(id)
}

export interface OrdersResult {
  data: Order[]
  loading: boolean
  error: string | null
}

/** Hook that lists a locale's orders and stays in sync with realtime / storage events. */
export function useOrders(slug: string | null): OrdersResult {
  const [state, setState] = useState<OrdersResult>(() => ({
    data: !isCloudMode && slug ? localListOrders(slug) : [],
    loading: Boolean(isCloudMode && slug),
    error: null,
  }))

  useEffect(() => {
    if (!slug) {
      setState({ data: [], loading: false, error: null })
      return
    }

    if (!isCloudMode) {
      const refresh = () =>
        setState({ data: localListOrders(slug), loading: false, error: null })
      const unsub = localSubscribeOrders(refresh)
      refresh()
      return unsub
    }

    let alive = true
    setState((s) => ({ ...s, loading: true }))
    const refresh = async () => {
      try {
        const data = await cloudListOrders(slug)
        if (alive) setState({ data, loading: false, error: null })
      } catch (err) {
        if (alive) {
          setState({
            data: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Error de carga',
          })
        }
      }
    }
    refresh()
    const unsub = cloudSubscribeOrders(slug, refresh)
    return () => {
      alive = false
      unsub()
    }
  }, [slug])

  return state
}
