import type { NavItem, SectionId } from '../types'

interface SidebarProps {
  nav: NavItem[]
  active: SectionId
  onNavigate: (id: SectionId) => void
  isMobile: boolean
  open: boolean
  onClose: () => void
}

function navItemStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? '#1A1410' : 'transparent',
    color: active ? 'white' : '#1A1410',
    border: 'none',
    padding: '11px 14px',
    borderRadius: 9,
    fontSize: 13.5,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textAlign: 'left',
    transition: 'background 140ms ease',
    width: '100%',
  }
}

export function Sidebar({ nav, active, onNavigate, isMobile, open, onClose }: SidebarProps) {
  const sidebarStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'min(280px, 80vw)',
        background: 'white',
        borderRight: '1px solid rgba(26, 20, 16, 0.06)',
        zIndex: 70,
        display: 'flex',
        flexDirection: 'column',
        transform: `translateX(${open ? '0%' : '-100%'})`,
        transition: 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: open ? '20px 0 60px rgba(0, 0, 0, 0.18)' : 'none',
      }
    : {
        background: 'white',
        borderRight: '1px solid rgba(26, 20, 16, 0.06)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }

  const handleNavigate = (id: SectionId) => {
    onNavigate(id)
    if (isMobile) onClose()
  }

  return (
    <>
      {isMobile ? (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 20, 16, 0.45)',
            zIndex: 65,
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none',
            transition: 'opacity 240ms ease',
          }}
        />
      ) : null}

      <aside style={sidebarStyle}>
        {/* Brand */}
        <div
          style={{
            padding: '18px 16px 14px',
            borderBottom: '1px solid rgba(26, 20, 16, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #E54B2A, #F0823A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                boxShadow: '0 4px 10px rgba(229, 75, 42, 0.3)',
              }}
            >
              🔥
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                Pedido Express
              </div>
              <div style={{ fontSize: 10.5, color: '#7A6E66', marginTop: 3 }}>
                Panel del comerciante
              </div>
            </div>
          </div>
          {isMobile ? (
            <button
              onClick={onClose}
              aria-label="Cerrar menú"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#F5F2EE',
                border: 'none',
                cursor: 'pointer',
                fontSize: 15,
                color: '#1A1410',
              }}
            >
              ✕
            </button>
          ) : null}
        </div>

        {/* Workspace switcher */}
        <div style={{ padding: '12px 12px 6px' }}>
          <button
            className="pa-btn-light"
            style={{
              width: '100%',
              background: '#F5F2EE',
              border: '1px solid rgba(26, 20, 16, 0.06)',
              borderRadius: 11,
              padding: '9px 11px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: '#1A1410',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 11,
                flexShrink: 0,
              }}
            >
              HE
            </div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 12.5,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Hamburguesería La Esquina
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: '#7A6E66',
                  marginTop: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#22C55E',
                    display: 'inline-block',
                  }}
                />
                <span>Plan Pro · activo</span>
              </div>
            </div>
            <span style={{ color: '#7A6E66', fontSize: 11 }}>⇅</span>
          </button>
        </div>

        {/* Nav */}
        <nav
          style={{
            padding: '8px 10px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            flex: isMobile ? 1 : 'unset',
            overflowY: isMobile ? 'auto' : 'visible',
          }}
        >
          {nav.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handleNavigate(sec.id)}
              style={navItemStyle(sec.id === active)}
            >
              <span style={{ fontSize: 15, width: 20, textAlign: 'center', lineHeight: 1 }}>
                {sec.icon}
              </span>
              <span>{sec.name}</span>
            </button>
          ))}
        </nav>

        {/* Plan card */}
        <div
          style={{
            margin: '14px 12px 0',
            padding: 14,
            background: 'linear-gradient(135deg, #1A1410, #2E2018)',
            color: 'white',
            borderRadius: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: '#F0823A',
              marginBottom: 8,
            }}
          >
            <span>⭐</span>
            <span>PLAN PRO</span>
          </div>
          <div
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              lineHeight: 1.3,
              marginBottom: 8,
            }}
          >
            Productos ilimitados, pedidos sin tope
          </div>
          <button
            style={{
              background: 'white',
              color: '#1A1410',
              border: 'none',
              padding: '7px 12px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 11.5,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Gestionar suscripción
          </button>
        </div>

        {/* Bottom user */}
        <div
          style={{
            marginTop: 'auto',
            padding: 12,
            borderTop: '1px solid rgba(26, 20, 16, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              M
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.2 }}>Martín G.</div>
              <div style={{ fontSize: 10.5, color: '#7A6E66', marginTop: 1 }}>Propietario</div>
            </div>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#7A6E66',
                fontSize: 14,
                padding: 4,
              }}
            >
              ⚙
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
