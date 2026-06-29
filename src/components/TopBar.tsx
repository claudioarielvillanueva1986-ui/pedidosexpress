import { Toggle } from './Toggle'

interface TopBarProps {
  title: string
  subtitle: string
  isOpen: boolean
  isMobile: boolean
  onToggleStatus: () => void
  onOpenCustomerView: () => void
  onOpenSidebar: () => void
}

export function TopBar({
  title,
  subtitle,
  isOpen,
  isMobile,
  onToggleStatus,
  onOpenCustomerView,
  onOpenSidebar,
}: TopBarProps) {
  const statusLabel = isOpen ? 'Local abierto' : 'Local cerrado'
  const statusDotColor = isOpen ? '#22C55E' : '#94918D'

  return (
    <header
      style={{
        background: 'rgba(245, 242, 238, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(26, 20, 16, 0.05)',
        padding: isMobile ? '14px 16px' : '18px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        {isMobile ? (
          <button
            onClick={onOpenSidebar}
            aria-label="Abrir menú"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'white',
              border: '1px solid rgba(26, 20, 16, 0.08)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ☰
          </button>
        ) : null}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: isMobile ? 17 : 22,
              margin: 0,
              letterSpacing: '-0.015em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h1>
          {!isMobile ? (
            <p style={{ fontSize: 13, color: '#7A6E66', margin: '3px 0 0' }}>{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {isMobile ? (
          <>
            <button
              onClick={onToggleStatus}
              title={statusLabel}
              aria-label={statusLabel}
              style={{
                background: 'white',
                border: '1px solid rgba(26, 20, 16, 0.06)',
                padding: '7px 10px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: '#1A1410',
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
              <span>{isOpen ? 'Abierto' : 'Cerrado'}</span>
            </button>
            <button
              onClick={onOpenCustomerView}
              className="pa-btn-dark"
              aria-label="Vista del cliente"
              style={{
                background: '#1A1410',
                color: 'white',
                border: 'none',
                width: 38,
                height: 38,
                borderRadius: 10,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
              }}
            >
              👁
            </button>
          </>
        ) : (
          <>
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
              }}
            >
              <span>👁</span>
              <span>Vista del cliente</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
