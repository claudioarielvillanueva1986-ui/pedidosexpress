import { useEffect, useRef, useState } from 'react'
import type { NavItem, SectionId } from '../types'
import { useLocaleSummaries } from '../store'

interface SidebarProps {
  nav: NavItem[]
  active: SectionId
  onNavigate: (id: SectionId) => void
  isMobile: boolean
  open: boolean
  onClose: () => void
  currentSlug: string
  currentName: string
  currentLogo: string
  localOpen: boolean
  navBadges?: Partial<Record<SectionId, number>>
  onSwitchLocale: (slug: string) => void
  onCreateLocale: (name: string) => void
  onDeleteCurrentLocale: () => void
  onGoLanding: () => void
  cloudEnabled?: boolean
  userEmail?: string | null
  onSignOut?: () => void
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

function initialsFor(name: string): string {
  const cleaned = name.trim()
  if (!cleaned) return '??'
  const words = cleaned.split(/\s+/)
  if (words.length === 1) return cleaned.slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function Sidebar({
  nav,
  active,
  onNavigate,
  isMobile,
  open,
  onClose,
  currentSlug,
  currentName,
  currentLogo,
  localOpen,
  onSwitchLocale,
  onCreateLocale,
  onDeleteCurrentLocale,
  onGoLanding,
  cloudEnabled = false,
  userEmail = null,
  onSignOut,
  navBadges = {},
}: SidebarProps) {
  const summariesQ = useLocaleSummaries()
  const summaries = summariesQ.data
  const [menuOpen, setMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setCreating(false)
        setNewName('')
      }
    }
    window.addEventListener('click', onDocClick)
    return () => window.removeEventListener('click', onDocClick)
  }, [menuOpen])

  const handleSwitch = (slug: string) => {
    setMenuOpen(false)
    setCreating(false)
    setNewName('')
    onSwitchLocale(slug)
  }

  const handleConfirmCreate = () => {
    const name = newName.trim()
    if (!name) return
    onCreateLocale(name)
    setCreating(false)
    setNewName('')
    setMenuOpen(false)
  }

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
          <button
            onClick={onGoLanding}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
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
          </button>
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

        {/* Workspace switcher with locale picker */}
        <div style={{ padding: '12px 12px 6px', position: 'relative' }} ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
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
              {currentLogo && currentLogo.length <= 2 ? currentLogo : initialsFor(currentName)}
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
                {currentName}
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
                    background: localOpen ? '#22C55E' : '#94918D',
                    display: 'inline-block',
                  }}
                />
                <span>{localOpen ? 'Abierto' : 'Cerrado'}</span>
                <span style={{ color: 'rgba(26, 20, 16, 0.25)' }}>·</span>
                <span>/{currentSlug}</span>
              </div>
            </div>
            <span style={{ color: '#7A6E66', fontSize: 11 }}>⇅</span>
          </button>

          {menuOpen ? (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 'calc(100% - 2px)',
                left: 12,
                right: 12,
                background: 'white',
                borderRadius: 12,
                border: '1px solid rgba(26, 20, 16, 0.08)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                padding: 6,
                zIndex: 60,
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {summaries.map((s) => {
                const active = s.slug === currentSlug
                return (
                  <button
                    key={s.slug}
                    onClick={() => handleSwitch(s.slug)}
                    style={{
                      width: '100%',
                      background: active ? '#F5F2EE' : 'transparent',
                      border: 'none',
                      padding: '8px 10px',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 7,
                        background: `linear-gradient(135deg, ${s.primaryColor}, ${s.primaryColor}99)`,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {s.logo && s.logo.length <= 2 ? s.logo : initialsFor(s.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 12.5,
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {s.name}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#7A6E66', marginTop: 1 }}>
                        /{s.slug}
                      </div>
                    </div>
                    {active ? <span style={{ color: '#22C55E', fontSize: 13 }}>✓</span> : null}
                  </button>
                )
              })}

              <div style={{ borderTop: '1px solid rgba(26, 20, 16, 0.06)', margin: '6px 0' }} />

              {creating ? (
                <div style={{ padding: '4px 6px', display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={newName}
                    autoFocus
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmCreate()
                      if (e.key === 'Escape') {
                        setCreating(false)
                        setNewName('')
                      }
                    }}
                    placeholder="Nombre del nuevo local…"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid rgba(26, 20, 16, 0.12)',
                      borderRadius: 8,
                      fontSize: 12.5,
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />
                  <button
                    onClick={handleConfirmCreate}
                    style={{
                      background: '#E54B2A',
                      color: 'white',
                      border: 'none',
                      padding: '0 10px',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#E54B2A',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 14 }}>+</span>
                  <span>Crear nuevo local</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMenuOpen(false)
                  onDeleteCurrentLocale()
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#C03A1E',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13 }}>🗑</span>
                <span>Eliminar este local</span>
              </button>
            </div>
          ) : null}
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
          {nav.map((sec) => {
            const isActive = sec.id === active
            const badge = navBadges[sec.id]
            return (
              <button
                key={sec.id}
                onClick={() => handleNavigate(sec.id)}
                style={navItemStyle(isActive)}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: 'center', lineHeight: 1 }}>
                  {sec.icon}
                </span>
                <span style={{ flex: 1 }}>{sec.name}</span>
                {badge && badge > 0 ? (
                  <span
                    style={{
                      background: isActive ? 'rgba(255, 255, 255, 0.18)' : 'rgba(229, 75, 42, 0.12)',
                      color: isActive ? 'white' : '#C03A1E',
                      padding: '1px 8px',
                      borderRadius: 999,
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            )
          })}
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
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'M'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 12.5,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {userEmail ?? 'Martín G.'}
              </div>
              <div style={{ fontSize: 10.5, color: '#7A6E66', marginTop: 1 }}>
                {cloudEnabled ? 'Sesión activa' : 'Modo local'}
              </div>
            </div>
            {cloudEnabled && onSignOut ? (
              <button
                onClick={onSignOut}
                title="Cerrar sesión"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#7A6E66',
                  fontSize: 14,
                  padding: 4,
                }}
              >
                ↩
              </button>
            ) : (
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
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
