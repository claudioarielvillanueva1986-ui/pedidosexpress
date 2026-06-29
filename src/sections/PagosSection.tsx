import type { PaymentsConfig } from '../types'
import { Toggle } from '../components/Toggle'
import { inputStyle } from '../utils'

interface PagosSectionProps {
  payments: PaymentsConfig
  onToggleCash: () => void
  onToggleTransfer: () => void
  onPaymentsChange: (patch: Partial<PaymentsConfig>) => void
}

function payCardStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? 'white' : '#FAF8F5',
    border: '2px solid ' + (active ? '#E54B2A' : 'rgba(26, 20, 16, 0.08)'),
    borderRadius: 14,
    padding: 16,
    transition: 'all 160ms ease',
    boxShadow: active ? '0 4px 14px rgba(229, 75, 42, 0.12)' : 'none',
  }
}

export function PagosSection({ payments, onToggleCash, onToggleTransfer, onPaymentsChange }: PagosSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 22,
          border: '1px solid rgba(26, 20, 16, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 17 }}>💳</span>
          <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, margin: 0 }}>
            Métodos de pago
          </h3>
        </div>
        <p style={{ fontSize: 12.5, color: '#7A6E66', margin: '0 0 18px' }}>
          Activá los que aceptás. El cliente elige al hacer el pedido.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Cash */}
          <div style={payCardStyle(payments.cashEnabled)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: '#F5F2EE',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                💵
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      Efectivo
                    </div>
                    <div style={{ fontSize: 12, color: '#7A6E66', marginTop: 2 }}>
                      El cliente paga al recibir o retirar.
                    </div>
                  </div>
                  <Toggle on={payments.cashEnabled} onClick={onToggleCash} size="md" />
                </div>
              </div>
            </div>
          </div>

          {/* Transfer */}
          <div style={payCardStyle(payments.transferEnabled)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: 'rgba(0, 158, 227, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                🏦
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      Transferencia / Pago digital
                    </div>
                    <div style={{ fontSize: 12, color: '#7A6E66', marginTop: 2 }}>
                      Mandás el link de pago o Alias/CBU por WhatsApp.
                    </div>
                  </div>
                  <Toggle on={payments.transferEnabled} onClick={onToggleTransfer} size="md" />
                </div>

                {payments.transferEnabled ? (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: '1px solid rgba(26, 20, 16, 0.06)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                    }}
                  >
                    <label style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 4 }}>
                        Alias
                      </span>
                      <input
                        type="text"
                        value={payments.alias}
                        onChange={(e) => onPaymentsChange({ alias: e.target.value })}
                        placeholder="esquina.burger.mp"
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 4 }}>
                        CBU / CVU
                      </span>
                      <input
                        type="text"
                        value={payments.cbu}
                        onChange={(e) => onPaymentsChange({ cbu: e.target.value })}
                        placeholder="00000031000000000000"
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ display: 'block', gridColumn: '1 / -1' }}>
                      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 4 }}>
                        Titular de la cuenta
                      </span>
                      <input
                        type="text"
                        value={payments.holder}
                        onChange={(e) => onPaymentsChange({ holder: e.target.value })}
                        placeholder="Juan Pérez"
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ display: 'block', gridColumn: '1 / -1' }}>
                      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 4 }}>
                        Mensaje que se envía con el link de pago
                      </span>
                      <textarea
                        value={payments.message}
                        onChange={(e) => onPaymentsChange({ message: e.target.value })}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '9px 11px',
                          borderRadius: 9,
                          border: '1px solid rgba(26, 20, 16, 0.12)',
                          background: 'white',
                          fontSize: 13,
                          outline: 'none',
                          resize: 'vertical',
                          minHeight: 54,
                        }}
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
