import type { Order } from '../types'

export interface PeriodSummary {
  orderCount: number
  completedCount: number
  cancelledCount: number
  revenue: number
  averageTicket: number
  deliveryRate: number  // share of delivered vs total non-cancelled
}

export interface DailyBucket {
  /** Date key YYYY-MM-DD */
  key: string
  /** Display label for the chart axis (Sa 12, Do 13, …) */
  label: string
  /** Friday-of-the-week start timestamp */
  timestamp: number
  count: number
  revenue: number
}

export interface TopProduct {
  productId: string
  name: string
  qty: number
  revenue: number
}

export interface Distribution {
  key: string
  label: string
  count: number
  revenue: number
}

const ONE_DAY = 24 * 60 * 60 * 1000

function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const SHORT_DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

function isoKey(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isoLabel(ms: number): string {
  const d = new Date(ms)
  return `${SHORT_DAYS[d.getDay()]} ${d.getDate()}`
}

/** Return orders within the last `days` days (excluding the lookback boundary). */
export function ordersInLastDays(orders: Order[], days: number): Order[] {
  if (days <= 0) return orders
  const cutoff = startOfDay(Date.now() - (days - 1) * ONE_DAY)
  return orders.filter((o) => o.createdAt >= cutoff)
}

/** Same length window ending the day before the current one. */
export function ordersInPreviousPeriod(orders: Order[], days: number): Order[] {
  if (days <= 0) return []
  const todayStart = startOfDay(Date.now())
  const windowStart = todayStart - (days - 1) * ONE_DAY
  const prevEnd = windowStart  // exclusive
  const prevStart = windowStart - days * ONE_DAY
  return orders.filter((o) => o.createdAt >= prevStart && o.createdAt < prevEnd)
}

export function summarize(orders: Order[]): PeriodSummary {
  const cancelled = orders.filter((o) => o.status === 'cancelled')
  const delivered = orders.filter((o) => o.status === 'delivered')
  const nonCancelled = orders.filter((o) => o.status !== 'cancelled')
  const revenue = nonCancelled.reduce((a, o) => a + o.total, 0)
  const orderCount = orders.length
  const completedCount = delivered.length
  const cancelledCount = cancelled.length
  const averageTicket = nonCancelled.length > 0 ? revenue / nonCancelled.length : 0
  const deliveryRate =
    nonCancelled.length > 0 ? completedCount / nonCancelled.length : 0
  return {
    orderCount,
    completedCount,
    cancelledCount,
    revenue,
    averageTicket,
    deliveryRate,
  }
}

/** Returns one bucket per day for the last `days` days, including empty days. */
export function bucketByDay(orders: Order[], days: number): DailyBucket[] {
  const todayStart = startOfDay(Date.now())
  const buckets: DailyBucket[] = []
  for (let i = days - 1; i >= 0; i--) {
    const ts = todayStart - i * ONE_DAY
    buckets.push({
      key: isoKey(ts),
      label: isoLabel(ts),
      timestamp: ts,
      count: 0,
      revenue: 0,
    })
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]))
  for (const o of orders) {
    if (o.status === 'cancelled') continue
    const key = isoKey(o.createdAt)
    const b = byKey.get(key)
    if (b) {
      b.count += 1
      b.revenue += o.total
    }
  }
  return buckets
}

export function topProducts(orders: Order[], limit = 5): TopProduct[] {
  const byId = new Map<string, TopProduct>()
  for (const o of orders) {
    if (o.status === 'cancelled') continue
    for (const it of o.items) {
      const id = it.productId || it.name
      const cur = byId.get(id) ?? {
        productId: id,
        name: it.name,
        qty: 0,
        revenue: 0,
      }
      cur.qty += it.qty
      cur.revenue += it.subtotal
      byId.set(id, cur)
    }
  }
  return [...byId.values()].sort((a, b) => b.qty - a.qty).slice(0, limit)
}

export function distributionByPayment(orders: Order[]): Distribution[] {
  const map = new Map<string, Distribution>()
  for (const o of orders) {
    if (o.status === 'cancelled') continue
    const key = o.paymentMethod
    const label = key === 'cash' ? 'Efectivo' : 'Transferencia / Digital'
    const cur = map.get(key) ?? { key, label, count: 0, revenue: 0 }
    cur.count += 1
    cur.revenue += o.total
    map.set(key, cur)
  }
  return [...map.values()]
}

export function distributionByDelivery(orders: Order[]): Distribution[] {
  const map = new Map<string, Distribution>()
  for (const o of orders) {
    if (o.status === 'cancelled') continue
    const key = o.deliveryMethod
    const label = key === 'delivery' ? 'Delivery' : 'Retiro'
    const cur = map.get(key) ?? { key, label, count: 0, revenue: 0 }
    cur.count += 1
    cur.revenue += o.total
    map.set(key, cur)
  }
  return [...map.values()]
}

export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}
