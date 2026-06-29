import type { LocalConfig, PaymentsConfig, ShippingConfig } from '../types'
import { formatPrice } from '../utils'

interface InicioSectionProps {
  isOpen: boolean
  productCount: number
  availableCount: number
  categoryCount: number
  payments: PaymentsConfig
  shipping: ShippingConfig
  local: LocalConfig
  isMobile?: boolean
  onToggleStatus: () => void
  onGoMenu: () => void
  onGoLocal: () => void
  onGoPagos: () => void
  onGoEnvio: () => void
}

interface ChecklistEntry {
  title: string
  hint: string
  done: boolean
  goto: () => void
}

export function InicioSection({
  isOpen,
  productCount,
  availableCount,
  categoryCount,
  payments,
  shipping,
  local,
  isMobile = false,
  onToggleStatus,
  onGoMenu,
  onGoLocal,
  onGoPagos,
  onGoEnvio,
}: InicioSectionProps) {
  const statusLabel = isOpen ? 'Local abierto' : 'Local cerrado'
  const statusDotColor = isOpen ? '#22C55E' : '#94918D'
  const statusBadgeBg = isOpen ? 'rgba(34, 197, 94, 0.12)' : 'rgba(26, 20, 16, 0.06)'
  const statusBadgeColor = isOpen ? '#157A40' : '#7A6E66'

  const enabledPays = (payments.cashEnabled ? 1 : 0) + (payments.transferEnabled ? 1 : 0)

  const heroTitle = isOpen ? 'Estás recibiendo pedidos.' : 'Tu local está pausado.'
  const heroSubtitle = isOpen
    ? 'Los clientes pueden enviar pedidos por WhatsApp a través de tu link público.'
    : 'Mientras esté cerrado, los clientes pueden ver el menú pero no enviar pedidos nuevos.'
  const heroCtaLabel = isOpen ? 'Pausar pedidos' : 'Volver a abrir'

  const statCards = [
    { label: 'Productos activos', value: String(availableCount), hint: `de ${productCount} totales`, icon: '🍽' },
    { label: 'Categorías', value: String(categoryCount), hint: 'organizan tu menú', icon: '🗂' },
    { label: 'Medios de pago', value: String(enabledPays), hint: 'habilitados', icon: '💳' },
    {
      label: 'Costo de envío',
      value: formatPrice(shipping.cost),
      hint: 'envío gratis desde ' + formatPrice(shipping.freeFrom),
      icon: '🛵',
    },
  ]

  const checklist: ChecklistEntry[] = [
    { title: 'WhatsApp configurado', hint: local.whatsapp || 'Sin número', done: !!local.whatsapp, goto: onGoLocal },
    { title: 'Productos en el menú', hint: `${productCount} productos cargados`, done: productCount > 0, goto: onGoMenu },
    { title: 'Métodos de pago activos', hint: `${enabledPays} habilitados`, done: enabledPays > 0, goto: onGoPagos },
    {
      title: 'Zona de cobertura definida',
      hint: shipping.zone ? 'Lista para vender' : 'Definí tu zona',
      done: !!shipping.zone,
      goto: onGoEnvio,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Status hero */}
      <div
        style={{
          background: 'white',
          borderRadius: 18,
          padding: isMobile ? 18 : 24,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
          gap: isMobile ? 14 : 20,
          alignItems: 'center',
          border: '1px solid rgba(26, 20, 16, 0.05)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: statusBadgeBg,
              color: statusBadgeColor,
              padding: '5px 11px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDotColor }} />
            <span>{statusLabel}</span>
          </div>
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: 26,
              margin: '0 0 6px',
              letterSpacing: '-0.015em',
            }}
          >
            {heroTitle}
          </h2>
          <p style={{ fontSize: 14, color: '#7A6E66', margin: '0 0 14px', lineHeight: 1.5, maxWidth: 540 }}>
            {heroSubtitle}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={onToggleStatus}
              style={{
                background: '#1A1410',
                color: 'white',
                border: 'none',
                padding: '10px 14px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {heroCtaLabel}
            </button>
            <button
              onClick={onGoMenu}
              style={{
                background: 'white',
                color: '#1A1410',
                border: '1px solid rgba(26, 20, 16, 0.1)',
                padding: '10px 14px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Editar menú →
            </button>
          </div>
        </div>
        <div
          style={{
            width: isMobile ? 84 : 120,
            height: isMobile ? 84 : 120,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #FFE4D6, #FCC89E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? 42 : 56,
            justifySelf: isMobile ? 'center' : 'auto',
          }}
        >
          🔥
        </div>
      </div>

      {/* Public link card */}
      <div
        style={{
          background: 'white',
          borderRadius: 18,
          padding: 22,
          border: '1px solid rgba(26, 20, 16, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>🔗</span>
          <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, margin: 0 }}>
            Tu link público de pedidos
          </h3>
        </div>
        <p style={{ fontSize: 13, color: '#7A6E66', margin: '0 0 14px', lineHeight: 1.5 }}>
          Compartilo en redes, en el flyer, en el cartel del local. Tus clientes piden desde ahí y los pedidos te
          llegan por WhatsApp.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr auto auto',
            gap: 8,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              background: '#F5F2EE',
              padding: '11px 14px',
              borderRadius: 10,
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 13,
              color: '#1A1410',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              pedido.express/laesquina
            </span>
          </div>
          <button
            style={{
              background: 'white',
              border: '1px solid rgba(26, 20, 16, 0.1)',
              padding: '0 14px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📋 Copiar
          </button>
          <button
            style={{
              background: '#1A1410',
              color: 'white',
              border: 'none',
              padding: '0 14px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📱 QR
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {statCards.map((stat) => (
          <div
            key={stat.label}
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
                {stat.label}
              </span>
              <span style={{ fontSize: 16 }}>{stat.icon}</span>
            </div>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: 28,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 11.5, color: '#7A6E66', marginTop: 6 }}>{stat.hint}</div>
          </div>
        ))}
      </div>

      {/* Setup checklist */}
      <div
        style={{
          background: 'white',
          borderRadius: 18,
          padding: 22,
          border: '1px solid rgba(26, 20, 16, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, margin: 0 }}>
            Pasos para vender más
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {checklist.map((step) => (
            <div
              key={step.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 12,
                background: step.done ? '#F0FDF4' : '#FFF7ED',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: step.done ? '#22C55E' : '#F0823A',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {step.done ? '✓' : '!'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: '#7A6E66', marginTop: 2 }}>{step.hint}</div>
              </div>
              {!step.done ? (
                <button
                  onClick={step.goto}
                  style={{
                    background: 'white',
                    border: '1px solid rgba(26, 20, 16, 0.1)',
                    padding: '6px 11px',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Configurar
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
