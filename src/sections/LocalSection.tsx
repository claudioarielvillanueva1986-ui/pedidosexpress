import type { LocalConfig, ScheduleDay } from '../types'
import { Toggle } from '../components/Toggle'
import { COLOR_PALETTE } from '../data'
import { inputStyle } from '../utils'

interface LocalSectionProps {
  local: LocalConfig
  schedule: ScheduleDay[]
  isMobile: boolean
  onLocalChange: (patch: Partial<LocalConfig>) => void
  onColorChange: (color: string) => void
  onToggleDay: (idx: number) => void
  onScheduleFieldChange: (idx: number, field: 'from' | 'to', value: string) => void
}

function swatchStyle(color: string, active: boolean): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: color,
    border: '3px solid ' + (active ? 'white' : 'transparent'),
    boxShadow: active ? `0 0 0 2px ${color}, 0 4px 10px ${color}55` : 'inset 0 0 0 1px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'transform 140ms ease',
  }
}

export function LocalSection({
  local,
  schedule,
  isMobile,
  onLocalChange,
  onColorChange,
  onToggleDay,
  onScheduleFieldChange,
}: LocalSectionProps) {
  const grid2: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: 14,
  }
  const sectionPad: React.CSSProperties = {
    background: 'white',
    borderRadius: 16,
    padding: isMobile ? 16 : 22,
    border: '1px solid rgba(26, 20, 16, 0.05)',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Marca */}
      <section style={sectionPad}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 17 }}>🎨</span>
          <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, margin: 0 }}>
            Marca y presentación
          </h3>
        </div>
        <p style={{ fontSize: 12.5, color: '#7A6E66', margin: '0 0 18px' }}>
          Lo primero que ven tus clientes en el menú digital.
        </p>

        <div style={grid2}>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Nombre del local
            </span>
            <input
              type="text"
              value={local.name}
              onChange={(e) => onLocalChange({ name: e.target.value })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Emoji / Logo
            </span>
            <input
              type="text"
              value={local.logo}
              onChange={(e) => onLocalChange({ logo: e.target.value })}
              placeholder="🔥 o URL de imagen"
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'block', gridColumn: '1 / -1' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Slogan / Descripción corta
            </span>
            <input
              type="text"
              value={local.slogan}
              onChange={(e) => onLocalChange({ slogan: e.target.value })}
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            Color principal
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                title={c}
                style={swatchStyle(c, c === local.primaryColor)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section style={sectionPad}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 17 }}>📞</span>
          <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, margin: 0 }}>
            Contacto
          </h3>
        </div>
        <p style={{ fontSize: 12.5, color: '#7A6E66', margin: '0 0 18px' }}>
          Donde llegan los pedidos y dónde te encuentran tus clientes.
        </p>

        <div style={grid2}>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              WhatsApp del local <span style={{ color: '#E54B2A' }}>*</span>
            </span>
            <input
              type="tel"
              value={local.whatsapp}
              onChange={(e) => onLocalChange({ whatsapp: e.target.value })}
              placeholder="Ej: 5491100000000"
              style={inputStyle}
            />
            <span style={{ display: 'block', fontSize: 11, color: '#7A6E66', marginTop: 4 }}>
              Con código de país, sin + ni espacios. Acá te llegan los pedidos.
            </span>
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Teléfono (opcional)
            </span>
            <input
              type="tel"
              value={local.phone}
              onChange={(e) => onLocalChange({ phone: e.target.value })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'block', gridColumn: '1 / -1' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Dirección del local
            </span>
            <input
              type="text"
              value={local.address}
              onChange={(e) => onLocalChange({ address: e.target.value })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'block', gridColumn: '1 / -1' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Email</span>
            <input
              type="email"
              value={local.email}
              onChange={(e) => onLocalChange({ email: e.target.value })}
              style={inputStyle}
            />
          </label>
        </div>
      </section>

      {/* Horarios */}
      <section style={sectionPad}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 17 }}>🕒</span>
          <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, margin: 0 }}>
            Horarios de atención
          </h3>
        </div>
        <p style={{ fontSize: 12.5, color: '#7A6E66', margin: '0 0 18px' }}>
          Cuando el local está cerrado, los clientes ven el menú pero no pueden enviar pedidos.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {schedule.map((row, i) => (
            <div
              key={row.day}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '90px auto 1fr' : '110px auto 1fr',
                gap: isMobile ? 10 : 14,
                alignItems: 'center',
                padding: '8px 0',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{row.day}</div>
              <Toggle on={row.open} onClick={() => onToggleDay(i)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: row.open ? 1 : 0.5 }}>
                <input
                  type="time"
                  value={row.from}
                  onChange={(e) => onScheduleFieldChange(i, 'from', e.target.value)}
                  disabled={!row.open}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(26, 20, 16, 0.1)',
                    background: 'white',
                    fontSize: 13,
                    outline: 'none',
                    color: '#1A1410',
                    width: isMobile ? 92 : 110,
                  }}
                />
                <span style={{ fontSize: 12, color: '#7A6E66' }}>a</span>
                <input
                  type="time"
                  value={row.to}
                  onChange={(e) => onScheduleFieldChange(i, 'to', e.target.value)}
                  disabled={!row.open}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(26, 20, 16, 0.1)',
                    background: 'white',
                    fontSize: 13,
                    outline: 'none',
                    color: '#1A1410',
                    width: isMobile ? 92 : 110,
                  }}
                />
                {!row.open ? (
                  <span style={{ fontSize: 12, color: '#7A6E66', fontStyle: 'italic' }}>Cerrado</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
