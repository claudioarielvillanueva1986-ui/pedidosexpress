import { Toggle } from './Toggle'

interface TopBarProps {
  title: string
  subtitle: string
  isOpen: boolean
  onToggleStatus: () => void
  onOpenCustomerView: () => void
}

export function TopBar({ title, subtitle, isOpen, onToggleStatus, onOpenCustomerView }: TopBarProps) {
  const statusLabel = isOpen ? 'Local abierto' : 'Local cerrado'
  const statusDotColor = isOpen ? '#22C55E' : '#94918D'

  return (
    <header
      style={{
        background: 'rgba(245, 242, 238, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(26, 20, 16, 0.05)',
        padding: '18px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            margin: 0,
            letterSpacing: '-0.015em',
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 13, color: '#7A6E66', margin: '3px 0 0' }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'white',
            padding: '7px 12px 7px 14px',
            borderRadius: 999,
            border: '1px solid rgba(26, 20, 16, 0.06)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusDotColor,
            }}
          />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{statusLabel}</span>
          <Toggle on={isOpen} onClick={onToggleStatus} />
        </div>
        <button
          onClick={onOpenCustomerView}
          className="pa-btn-dark"
          style={{
            background: '#1A1410',
            color: 'white',
            border: 'none',
            padding: '9px 14px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            textDecoration: 'none',
          }}
        >
          <span>👁</span>
          <span>Vista del cliente</span>
        </button>
      </div>
    </header>
  )
}
