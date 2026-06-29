import { useMemo, useState } from 'react'
import { useOrders } from '../lib/ordersStore'
import {
  bucketByDay,
  distributionByDelivery,
  distributionByPayment,
  ordersInLastDays,
  ordersInPreviousPeriod,
  percentDelta,
  summarize,
  topProducts,
} from '../lib/analytics'
import type { DailyBucket, Distribution, TopProduct } from '../lib/analytics'
import { formatPrice } from '../utils'

interface ReportesSectionProps {
  slug: string
  isMobile: boolean
}

type PeriodKey = '7d' | '30d' | '90d' | 'all'

const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
  { key: '7d', label: 'Últimos 7 días', days: 7 },
  { key: '30d', label: 'Últimos 30 días', days: 30 },
  { key: '90d', label: 'Últimos 90 días', days: 90 },
  { key: 'all', label: 'Todo el historial', days: 0 },
]

export function ReportesSection({ slug, isMobile }: ReportesSectionProps) {
  const ordersQ = useOrders(slug)
  const [periodKey, setPeriodKey] = useState<PeriodKey>('30d')

  const period = PERIODS.find((p) => p.key === periodKey) ?? PERIODS[1]

  const { current, previous, days } = useMemo(() => {
    const isAll = period.days === 0
    const days = isAll ? 0 : period.days
    const current = isAll ? ordersQ.data : ordersInLastDays(ordersQ.data, days)
    const previous = isAll ? [] : ordersInPreviousPeriod(ordersQ.data, days)
    return { current, previous, days }
  }, [ordersQ.data, period.days])

  const summaryCurrent = useMemo(() => summarize(current), [current])
  const summaryPrev = useMemo(() => summarize(previous), [previous])

  const chartDays = days > 0 ? Math.min(days, 30) : 30
  const buckets = useMemo(() => bucketByDay(current, chartDays), [current, chartDays])
  const top = useMemo(() => topProducts(current, 6), [current])
  const payments = useMemo(() => distributionByPayment(current), [current])
  const delivery = useMemo(() => distributionByDelivery(current), [current])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Period selector */}
      <div
        className="pa-scroll-x"
        style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}
      >
        {PERIODS.map((p) => {
          const active = periodKey === p.key
          return (
            <button
              key={p.key}
              onClick={() => setPeriodKey(p.key)}
              style={{
                background: active ? '#1A1410' : 'white',
                color: active ? 'white' : '#1A1410',
                border: '1px solid ' + (active ? 'transparent' : 'rgba(26, 20, 16, 0.08)'),
                padding: '9px 14px',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {ordersQ.loading ? (
        <EmptyCard text="Cargando pedidos…" />
      ) : ordersQ.data.length === 0 ? (
        <EmptyCard
          icon="📊"
          title="Todavía no hay pedidos"
          subtitle="Cuando entren pedidos vas a ver acá las métricas, los gráficos y los productos más vendidos."
        />
      ) : (
        <>
          {/* Stat cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(2, 1fr)'
                : 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <StatCard
              label="Pedidos"
              value={String(summaryCurrent.orderCount)}
              hint={
                period.days === 0
                  ? 'en el historial'
                  : `vs ${summaryPrev.orderCount} antes`
              }
              delta={percentDelta(summaryCurrent.orderCount, summaryPrev.orderCount)}
              icon="📋"
            />
            <StatCard
              label="Ingresos"
              value={formatPrice(summaryCurrent.revenue)}
              hint={
                period.days === 0
                  ? 'cobrado / a cobrar'
                  : `vs ${formatPrice(summaryPrev.revenue)} antes`
              }
              delta={percentDelta(summaryCurrent.revenue, summaryPrev.revenue)}
              icon="💰"
            />
            <StatCard
              label="Ticket promedio"
              value={formatPrice(summaryCurrent.averageTicket)}
              hint="por pedido"
              delta={percentDelta(summaryCurrent.averageTicket, summaryPrev.averageTicket)}
              icon="🧾"
            />
            <StatCard
              label="Tasa entrega"
              value={`${Math.round(summaryCurrent.deliveryRate * 100)}%`}
              hint={`${summaryCurrent.completedCount} entregados${
                summaryCurrent.cancelledCount > 0
                  ? ` · ${summaryCurrent.cancelledCount} cancelados`
                  : ''
              }`}
              delta={percentDelta(
                summaryCurrent.deliveryRate,
                summaryPrev.deliveryRate,
              )}
              icon="✅"
            />
          </div>

          {/* Daily chart */}
          <Card title="Pedidos e ingresos por día" subtitle={`Últimos ${chartDays} días`}>
            <DailyChart buckets={buckets} isMobile={isMobile} />
          </Card>

          {/* Top products + distributions in 2 columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 16,
            }}
          >
            <Card title="Productos más vendidos" subtitle="Por cantidad pedida">
              <TopProductsList items={top} />
            </Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card title="Modalidad" subtitle="Delivery vs Retiro">
                <DistributionBars items={delivery} />
              </Card>
              <Card title="Método de pago" subtitle="Cash vs Transferencia">
                <DistributionBars items={payments} />
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ---------- subcomponents ----------

function StatCard({
  label,
  value,
  hint,
  delta,
  icon,
}: {
  label: string
  value: string
  hint: string
  delta: number | null
  icon: string
}) {
  const showDelta = delta !== null && Number.isFinite(delta) && delta !== 0
  const positive = (delta ?? 0) >= 0
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 14,
        padding: '16px 18px',
        border: '1px solid rgba(26, 20, 16, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            color: '#7A6E66',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 16 }}>{icon}</span>
      </div>
      <div
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800,
          fontSize: 26,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: '#7A6E66',
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {showDelta ? (
          <span
            style={{
              fontWeight: 700,
              color: positive ? '#157A40' : '#C03A1E',
              background: positive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(229, 75, 42, 0.12)',
              padding: '1px 7px',
              borderRadius: 999,
              fontSize: 10.5,
            }}
          >
            {positive ? '▲' : '▼'} {Math.abs(Math.round(delta ?? 0))}%
          </span>
        ) : null}
        <span>{hint}</span>
      </div>
    </div>
  )
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: 18,
        border: '1px solid rgba(26, 20, 16, 0.05)',
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h3
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            margin: 0,
          }}
        >
          {title}
        </h3>
        {subtitle ? (
          <p style={{ fontSize: 12, color: '#7A6E66', margin: '3px 0 0' }}>{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function DailyChart({ buckets, isMobile }: { buckets: DailyBucket[]; isMobile: boolean }) {
  const max = Math.max(1, ...buckets.map((b) => b.count))
  const totalRevenue = buckets.reduce((a, b) => a + b.revenue, 0)
  const showEveryNthLabel = isMobile ? Math.ceil(buckets.length / 5) : Math.ceil(buckets.length / 12)
  const gap = 4
  const innerHeight = 140
  const barRadius = 4

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${buckets.length}, 1fr)`,
          gap,
          alignItems: 'end',
          height: innerHeight,
        }}
      >
        {buckets.map((b) => {
          const heightPct = (b.count / max) * 100
          return (
            <div
              key={b.key}
              title={`${b.label}: ${b.count} pedidos · ${formatPrice(b.revenue)}`}
              style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                cursor: 'help',
              }}
            >
              <div
                style={{
                  background:
                    b.count === 0
                      ? 'rgba(26, 20, 16, 0.05)'
                      : 'linear-gradient(180deg, #F0823A, #E54B2A)',
                  height: `${Math.max(2, heightPct)}%`,
                  borderRadius: `${barRadius}px ${barRadius}px 0 0`,
                  transition: 'height 220ms ease',
                }}
              />
            </div>
          )
        })}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${buckets.length}, 1fr)`,
          gap,
          marginTop: 8,
        }}
      >
        {buckets.map((b, i) => (
          <div
            key={b.key}
            style={{
              fontSize: 10,
              color: '#7A6E66',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {i % showEveryNthLabel === 0 ? b.label : ''}
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid rgba(26, 20, 16, 0.05)',
          fontSize: 12,
        }}
      >
        <span style={{ color: '#7A6E66' }}>Total del período</span>
        <span style={{ fontWeight: 700 }}>{formatPrice(totalRevenue)}</span>
      </div>
    </div>
  )
}

function TopProductsList({ items }: { items: TopProduct[] }) {
  if (items.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#7A6E66', margin: 0 }}>
        Todavía no hay productos vendidos en este período.
      </p>
    )
  }
  const maxQty = Math.max(...items.map((i) => i.qty))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, idx) => (
        <div key={item.productId}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 4,
              gap: 8,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 18,
                  fontSize: 11.5,
                  color: '#7A6E66',
                  fontWeight: 700,
                }}
              >
                {idx + 1}.
              </span>
              {item.name}
            </span>
            <span style={{ fontSize: 12, color: '#7A6E66', flexShrink: 0 }}>
              {item.qty} × · {formatPrice(item.revenue)}
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: 'rgba(26, 20, 16, 0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(item.qty / maxQty) * 100}%`,
                background: 'linear-gradient(90deg, #F0823A, #E54B2A)',
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function DistributionBars({ items }: { items: Distribution[] }) {
  if (items.length === 0) {
    return <p style={{ fontSize: 13, color: '#7A6E66', margin: 0 }}>Sin datos.</p>
  }
  const total = items.reduce((a, b) => a + b.count, 0) || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((d) => {
        const pct = (d.count / total) * 100
        return (
          <div key={d.key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12.5,
                marginBottom: 4,
              }}
            >
              <span style={{ fontWeight: 600 }}>{d.label}</span>
              <span style={{ color: '#7A6E66' }}>
                {d.count} · {Math.round(pct)}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: 'rgba(26, 20, 16, 0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: '#1A1410',
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        )
      })}
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
