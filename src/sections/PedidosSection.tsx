import { useEffect, useMemo, useState } from 'react'
import { deleteOrder, updateOrderStatus, useOrders } from '../lib/ordersStore'
import { formatPrice } from '../utils'
import type { Order, OrderStatus } from '../types'
import {
  NotificationBanner,
  loadNotificationPrefs,
} from '../components/NotificationBanner'

interface PedidosSectionProps {
  slug: string
  isMobile: boolean
  whatsapp: string
}

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string; emoji: string }> = {
  pending: { label: 'Pendiente', bg: 'rgba(240, 130, 58, 0.14)', color: '#A85311', emoji: '🟠' },
  preparing: { label: 'Preparando', bg: 'rgba(0, 158, 227, 0.14)', color: '#0070A3', emoji: '👨‍🍳' },
  ready: { label: 'Listo', bg: 'rgba(139, 92, 246, 0.14)', color: '#5B30B7', emoji: '✅' },
  delivered: { label: 'Entregado', bg: 'rgba(34, 197, 94, 0.14)', color: '#157A40', emoji: '🎉' },
  cancelled: { label: 'Cancelado', bg: 'rgba(26, 20, 16, 0.08)', color: '#7A6E66', emoji: '❌' },
}

const FILTERS: { value: OrderStatus | 'all' | 'active'; label: string }[] = [
  { value: 'active', label: 'Activos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'ready', label: 'Listos' },
  { value: 'delivered', label: 'Entregados' },
  { value: 'all', label: 'Todos' },
]

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  pending: { next: 'preparing', label: 'Tomar pedido' },
  preparing: { next: 'ready', label: 'Marcar listo' },
  ready: { next: 'delivered', label: 'Entregado' },
}

function isActive(o: Order): boolean {
  return o.status !== 'delivered' && o.status !== 'cancelled'
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'hace instantes'
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  return `hace ${days} d`
}

export function PedidosSection({ slug, isMobile, whatsapp }: PedidosSectionProps) {
  const ordersQ = useOrders(slug)
  const [filter, setFilter] = useState<OrderStatus | 'all' | 'active'>('active')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notifPrefs, setNotifPrefs] = useState(() => loadNotificationPrefs())

  useEffect(() => {
    const onStorage = () => setNotifPrefs(loadNotificationPrefs())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ordersQ.data.length, active: 0 }
    for (const s of ['pending', 'preparing', 'ready', 'delivered', 'cancelled'] as const) {
      c[s] = 0
    }
    for (const o of ordersQ.data) {
      c[o.status] = (c[o.status] ?? 0) + 1
      if (isActive(o)) c.active += 1
    }
    return c
  }, [ordersQ.data])

  const filtered = useMemo(() => {
    if (filter === 'all') return ordersQ.data
    if (filter === 'active') return ordersQ.data.filter(isActive)
    return ordersQ.data.filter((o) => o.status === filter)
  }, [ordersQ.data, filter])

  const advance = async (o: Order) => {
    const next = NEXT_STATUS[o.status]
    if (!next) return
    setBusy(o.id)
    try {
      await updateOrderStatus(o.id, next.next)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No pudimos actualizar el pedido')
    } finally {
      setBusy(null)
    }
  }

  const cancel = async (o: Order) => {
    if (!window.confirm('¿Cancelar este pedido?')) return
    setBusy(o.id)
    try {
      await updateOrderStatus(o.id, 'cancelled')
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No pudimos actualizar el pedido')
    } finally {
      setBusy(null)
    }
  }

  const removeOrder = async (o: Order) => {
    if (!window.confirm('¿Eliminar definitivamente este pedido? Esta acción no se deshace.')) return
    setBusy(o.id)
    try {
      await deleteOrder(o.id)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No pudimos eliminar el pedido')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NotificationBanner
        prefs={notifPrefs}
        onPrefsChange={setNotifPrefs}
        isMobile={isMobile}
      />

      {/* Filter chips */}
      <div
        className="pa-scroll-x"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.value
          const count = counts[f.value] ?? 0
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 999,
                background: active ? '#1A1410' : 'white',
                color: active ? 'white' : '#1A1410',
                border: '1px solid ' + (active ? 'transparent' : 'rgba(26, 20, 16, 0.08)'),
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span>{f.label}</span>
              <span
                style={{
                  background: active ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.05)',
                  color: active ? 'white' : '#7A6E66',
                  padding: '1px 7px',
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {ordersQ.loading ? (
        <EmptyCard text="Cargando pedidos…" />
      ) : ordersQ.data.length === 0 ? (
        <EmptyCard
          icon="📋"
          title="Todavía no entró ningún pedido"
          subtitle="Cuando un cliente confirme un pedido desde el menú, va a aparecer acá. También te avisamos en el WhatsApp."
        />
      ) : filtered.length === 0 ? (
        <EmptyCard icon="🔎" text="No hay pedidos en este filtro." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              expanded={expanded === o.id}
              isMobile={isMobile}
              busy={busy === o.id}
              merchantWhatsapp={whatsapp}
              onToggle={() => setExpanded((cur) => (cur === o.id ? null : o.id))}
              onAdvance={() => advance(o)}
              onCancel={() => cancel(o)}
              onDelete={() => removeOrder(o)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyCard({
  icon,
  title,
  subtitle,
  text,
}: {
  icon?: string
  title?: string
  subtitle?: string
  text?: string
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px dashed rgba(26, 20, 16, 0.14)',
        borderRadius: 16,
        padding: '40px 24px',
        textAlign: 'center',
        color: '#7A6E66',
      }}
    >
      {icon ? <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div> : null}
      {title ? (
        <h3
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            margin: '0 0 6px',
            color: '#1A1410',
          }}
        >
          {title}
        </h3>
      ) : null}
      <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>{subtitle ?? text}</p>
    </div>
  )
}

interface OrderCardProps {
  order: Order
  expanded: boolean
  isMobile: boolean
  busy: boolean
  merchantWhatsapp: string
  onToggle: () => void
  onAdvance: () => void
  onCancel: () => void
  onDelete: () => void
}

function OrderCard({
  order,
  expanded,
  isMobile,
  busy,
  merchantWhatsapp,
  onToggle,
  onAdvance,
  onCancel,
  onDelete,
}: OrderCardProps) {
  const meta = STATUS_META[order.status]
  const next = NEXT_STATUS[order.status]
  const itemsLine = order.items
    .map((i) => `${i.qty}× ${i.name}`)
    .join(' · ')

  const openCustomerWhatsApp = () => {
    const number = order.customerPhone.replace(/\D/g, '')
    if (!number) return
    const text = encodeURIComponent(
      `Hola ${order.customerName}, te escribo por tu pedido en ${origin()}. ${
        merchantWhatsapp ? '' : ''
      }`,
    )
    window.open(`https://wa.me/${number}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid rgba(26, 20, 16, 0.06)',
        borderRadius: 14,
        padding: isMobile ? 14 : 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr auto' : '1fr auto auto',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: meta.bg,
                color: meta.color,
                padding: '3px 9px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
            </span>
            <span style={{ fontSize: 11.5, color: '#7A6E66' }}>{relativeTime(order.createdAt)}</span>
          </div>
          <div
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: 15.5,
              lineHeight: 1.25,
            }}
          >
            {order.customerName} · {order.deliveryMethod === 'delivery' ? 'Delivery' : 'Retiro'}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: '#7A6E66',
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {itemsLine || '—'}
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 17,
            color: '#1A1410',
            textAlign: 'right',
            gridColumn: isMobile ? '2' : 'auto',
          }}
        >
          {formatPrice(order.total)}
        </div>
        {!isMobile ? (
          <span style={{ color: '#7A6E66', fontSize: 14 }}>{expanded ? '▴' : '▾'}</span>
        ) : null}
      </button>

      {expanded ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(26, 20, 16, 0.05)',
          }}
        >
          {/* Customer details */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <DetailRow icon="📞" label="Teléfono" value={order.customerPhone} />
            <DetailRow
              icon="💳"
              label="Pago"
              value={order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia / Digital'}
            />
            {order.deliveryMethod === 'delivery' ? (
              <DetailRow
                icon="📍"
                label="Dirección"
                value={order.customerAddress || '—'}
                fullWidth={!isMobile}
              />
            ) : null}
            {order.customerNotes ? (
              <DetailRow icon="📝" label="Notas" value={order.customerNotes} fullWidth={!isMobile} />
            ) : null}
          </div>

          {/* Items */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#7A6E66',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              Detalle
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {order.items.map((i, idx) => (
                <div
                  key={idx}
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}
                >
                  <span>
                    <span style={{ color: '#7A6E66', marginRight: 6 }}>{i.qty}×</span>
                    {i.name}
                  </span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(i.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div
            style={{
              background: '#F5F2EE',
              borderRadius: 11,
              padding: '10px 12px',
              fontSize: 13,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#7A6E66' }}>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.deliveryFee > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7A6E66' }}>Envío</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 6,
                borderTop: '1px solid rgba(26, 20, 16, 0.06)',
                marginTop: 2,
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 15.5 }}>
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {next && order.status !== 'cancelled' ? (
              <button
                onClick={onAdvance}
                disabled={busy}
                style={{
                  background: '#1A1410',
                  color: 'white',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: busy ? 'wait' : 'pointer',
                  flex: '1 1 160px',
                  minWidth: 0,
                }}
              >
                {busy ? '…' : next.label}
              </button>
            ) : null}
            {order.customerPhone ? (
              <button
                onClick={openCustomerWhatsApp}
                style={{
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                💬 WhatsApp cliente
              </button>
            ) : null}
            {order.status !== 'cancelled' && order.status !== 'delivered' ? (
              <button
                onClick={onCancel}
                disabled={busy}
                style={{
                  background: 'white',
                  color: '#C03A1E',
                  border: '1px solid rgba(229, 75, 42, 0.3)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: busy ? 'wait' : 'pointer',
                }}
              >
                Cancelar
              </button>
            ) : null}
            <button
              onClick={onDelete}
              disabled={busy}
              style={{
                background: 'white',
                color: '#7A6E66',
                border: '1px solid rgba(26, 20, 16, 0.08)',
                padding: '10px 14px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 13,
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              🗑 Eliminar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
  fullWidth,
}: {
  icon: string
  label: string
  value: string
  fullWidth?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        gridColumn: fullWidth ? '1 / -1' : 'auto',
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1.4 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: '#7A6E66',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 1,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 13, color: '#1A1410', lineHeight: 1.4, wordBreak: 'break-word' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

function origin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}
