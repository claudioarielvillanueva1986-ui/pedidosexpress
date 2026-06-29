import type { ShippingConfig } from '../types'
import { Toggle } from '../components/Toggle'
import { inputStyle } from '../utils'

interface EnvioSectionProps {
  shipping: ShippingConfig
  isMobile: boolean
  onToggleDelivery: () => void
  onTogglePickup: () => void
  onShippingChange: (patch: Partial<ShippingConfig>) => void
}

function modeCardStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? 'white' : '#FAF8F5',
    border: '2px solid ' + (active ? '#E54B2A' : 'rgba(26, 20, 16, 0.08)'),
    borderRadius: 13,
    padding: 14,
    transition: 'all 160ms ease',
    boxShadow: active ? '0 4px 14px rgba(229, 75, 42, 0.14)' : 'none',
  }
}

export function EnvioSection({
  shipping,
  isMobile,
  onToggleDelivery,
  onTogglePickup,
  onShippingChange,
}: EnvioSectionProps) {
  const sectionPad: React.CSSProperties = {
    background: 'white',
    borderRadius: 16,
    padding: isMobile ? 16 : 22,
    border: '1px solid rgba(26, 20, 16, 0.05)',
  }
  const grid2: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: 14,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Modalidades */}
      <section style={sectionPad}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 17 }}>🛵</span>
          <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, margin: 0 }}>
            Modalidades de entrega
          </h3>
        </div>
        <p style={{ fontSize: 12.5, color: '#7A6E66', margin: '0 0 18px' }}>
          Activá lo que ofrecés. Si desactivás ambos, sólo se podrá consultar el menú.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div style={modeCardStyle(shipping.deliveryEnabled)}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 24 }}>🛵</div>
              <Toggle on={shipping.deliveryEnabled} onClick={onToggleDelivery} />
            </div>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15 }}>
              Delivery
            </div>
            <div style={{ fontSize: 12, color: '#7A6E66', marginTop: 2 }}>
              Llevás vos o coordinás con un servicio.
            </div>
          </div>
          <div style={modeCardStyle(shipping.pickupEnabled)}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 24 }}>🏪</div>
              <Toggle on={shipping.pickupEnabled} onClick={onTogglePickup} />
            </div>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15 }}>
              Retiro en local
            </div>
            <div style={{ fontSize: 12, color: '#7A6E66', marginTop: 2 }}>El cliente pasa a buscarlo.</div>
          </div>
        </div>
      </section>

      {/* Costos */}
      {shipping.deliveryEnabled ? (
        <section style={sectionPad}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 17 }}>💰</span>
            <h3
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, margin: 0 }}
            >
              Costos y tiempos
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: '#7A6E66', margin: '0 0 18px' }}>
            Lo que ve y paga el cliente al elegir delivery.
          </p>

          <div style={grid2}>
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Costo de envío fijo
              </span>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 13,
                    color: '#7A6E66',
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  value={shipping.cost}
                  onChange={(e) =>
                    onShippingChange({ cost: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 24px',
                    borderRadius: 10,
                    border: '1px solid rgba(26, 20, 16, 0.12)',
                    background: 'white',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                />
              </div>
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Envío gratis desde
              </span>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 13,
                    color: '#7A6E66',
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  value={shipping.freeFrom}
                  onChange={(e) =>
                    onShippingChange({ freeFrom: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 24px',
                    borderRadius: 10,
                    border: '1px solid rgba(26, 20, 16, 0.12)',
                    background: 'white',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                />
              </div>
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Tiempo estimado · Delivery
              </span>
              <input
                type="text"
                value={shipping.etaDelivery}
                onChange={(e) => onShippingChange({ etaDelivery: e.target.value })}
                placeholder="25-35 min"
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Tiempo estimado · Retiro
              </span>
              <input
                type="text"
                value={shipping.etaPickup}
                onChange={(e) => onShippingChange({ etaPickup: e.target.value })}
                placeholder="15 min"
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'block', gridColumn: '1 / -1' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Zona de cobertura
              </span>
              <textarea
                value={shipping.zone}
                onChange={(e) => onShippingChange({ zone: e.target.value })}
                rows={2}
                placeholder="Ej: Palermo, Villa Crespo y Almagro. Hasta 4km del local."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(26, 20, 16, 0.12)',
                  background: 'white',
                  fontSize: 13.5,
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: 60,
                }}
              />
            </label>
          </div>
        </section>
      ) : null}
    </div>
  )
}
