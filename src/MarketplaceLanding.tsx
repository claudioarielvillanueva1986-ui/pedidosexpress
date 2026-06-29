import { useMemo, useState } from 'react'
import { createLocale, isCloudMode, useLocaleSummaries } from './store'
import { navigate } from './router'
import { useIsMobile } from './hooks/useMediaQuery'
import { BrandLogo } from './components/BrandLogo'

type StatusFilter = 'all' | 'open' | 'closed'

export function MarketplaceLanding() {
  const summariesQ = useLocaleSummaries()
  const isMobile = useIsMobile()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const summaries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return summariesQ.data
      .filter((s) => {
        if (statusFilter === 'open' && !s.localOpen) return false
        if (statusFilter === 'closed' && s.localOpen) return false
        return true
      })
      .filter((s) => {
        if (!q) return true
        return (
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (s.slogan ?? '').toLowerCase().includes(q)
        )
      })
  }, [summariesQ.data, search, statusFilter])

  const openCount = summariesQ.data.filter((s) => s.localOpen).length
  const closedCount = summariesQ.data.length - openCount
  const hasAnyLocales = summariesQ.data.length > 0

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    try {
      if (isCloudMode) {
        // Cloud mode requires auth. Send the user to the panel; the
        // auth screen will prompt sign-up before letting them create.
        navigate({ kind: 'admin', slug: null })
        setNewName('')
        setCreating(false)
        return
      }
      const newLocale = await createLocale(name)
      navigate({ kind: 'admin', slug: newLocale.slug })
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No pudimos crear el local.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F2', color: '#1A1410' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(250, 246, 242, 0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(26, 20, 16, 0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: isMobile ? '14px 18px' : '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #E54B2A, #F0823A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                boxShadow: '0 6px 16px rgba(229, 75, 42, 0.32)',
              }}
            >
              🔥
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                Pedido Express
              </div>
              <div style={{ fontSize: 11, color: '#7A6E66', marginTop: 3 }}>
                Tu marketplace local
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate({ kind: 'admin', slug: null })}
            style={{
              background: '#1A1410',
              color: 'white',
              border: 'none',
              padding: isMobile ? '9px 12px' : '9px 14px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <span>🏪</span>
            <span>{isMobile ? 'Soy comerciante' : 'Acceder como comerciante'}</span>
          </button>
        </div>
      </header>

      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: isMobile ? '28px 18px 8px' : '40px 24px 16px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(229, 75, 42, 0.1)',
            color: '#C03A1E',
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          <span>🚀</span>
          <span>Pedidos directos al local, sin intermediarios</span>
        </div>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: isMobile ? 'clamp(34px, 9vw, 48px)' : 'clamp(40px, 6vw, 60px)',
            lineHeight: 1,
            margin: '0 0 14px',
            letterSpacing: '-0.025em',
          }}
        >
          Los locales de tu barrio,
          <br />
          <span style={{ color: '#E54B2A', fontStyle: 'italic' }}>a un toque.</span>
        </h1>
        <p
          style={{
            fontSize: isMobile ? 15 : 16.5,
            color: '#7A6E66',
            maxWidth: 580,
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          Hacé tu pedido directo al local. Sin comisiones de plataforma. El delivery lo
          coordina el local que elegís.
        </p>
      </section>

      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: isMobile ? '24px 18px 60px' : '32px 24px 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: isMobile ? 20 : 22,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Locales disponibles
          </h2>
          <span style={{ fontSize: 13, color: '#7A6E66' }}>
            {summaries.length === summariesQ.data.length
              ? `${summaries.length} ${summaries.length === 1 ? 'local' : 'locales'}`
              : `${summaries.length} de ${summariesQ.data.length}`}
          </span>
        </div>

        {hasAnyLocales ? (
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 10,
              marginBottom: 18,
              alignItems: isMobile ? 'stretch' : 'center',
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: 1,
                background: 'white',
                border: '1px solid rgba(26, 20, 16, 0.08)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 12px',
              }}
            >
              <span style={{ color: '#7A6E66', fontSize: 14 }}>🔎</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o producto…"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '11px 0',
                  background: 'transparent',
                  fontSize: 14,
                  color: '#1A1410',
                  minWidth: 0,
                }}
              />
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Limpiar búsqueda"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#7A6E66',
                    fontSize: 14,
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <FilterChip
                active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
                label={`Todos · ${summariesQ.data.length}`}
              />
              <FilterChip
                active={statusFilter === 'open'}
                onClick={() => setStatusFilter('open')}
                label={`Abiertos · ${openCount}`}
                dot="#22C55E"
              />
              <FilterChip
                active={statusFilter === 'closed'}
                onClick={() => setStatusFilter('closed')}
                label={`Cerrados · ${closedCount}`}
                dot="#94918D"
              />
            </div>
          </div>
        ) : null}

        {summariesQ.loading ? (
          <div
            style={{
              background: 'white',
              border: '1px dashed rgba(26, 20, 16, 0.12)',
              borderRadius: 18,
              padding: '40px 24px',
              textAlign: 'center',
              color: '#7A6E66',
              fontSize: 13.5,
            }}
          >
            Cargando locales…
          </div>
        ) : !hasAnyLocales ? (
          <div
            style={{
              background: 'white',
              border: '1px dashed rgba(26, 20, 16, 0.18)',
              borderRadius: 18,
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 10 }}>🍔</div>
            <h3
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                margin: '0 0 6px',
              }}
            >
              Todavía no hay locales
            </h3>
            <p style={{ fontSize: 13.5, color: '#7A6E66', margin: '0 0 16px' }}>
              Creá el primero para empezar a vender.
            </p>
            <button
              onClick={() => navigate({ kind: 'admin', slug: null })}
              style={{
                background: '#E54B2A',
                color: 'white',
                border: 'none',
                padding: '11px 18px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(229, 75, 42, 0.32)',
              }}
            >
              + Crear el primer local
            </button>
          </div>
        ) : summaries.length === 0 ? (
          <div
            style={{
              background: 'white',
              border: '1px dashed rgba(26, 20, 16, 0.12)',
              borderRadius: 18,
              padding: '32px 24px',
              textAlign: 'center',
              color: '#7A6E66',
              fontSize: 13.5,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 6 }}>🔍</div>
            <p style={{ margin: 0 }}>
              Nada coincide con esa búsqueda.{' '}
              <button
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E54B2A',
                  fontWeight: 700,
                  cursor: 'pointer',
                  font: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Limpiar filtros
              </button>
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {summaries.map((s) => (
              <button
                key={s.slug}
                onClick={() => navigate({ kind: 'customer', slug: s.slug })}
                style={{
                  background: 'white',
                  border: '1px solid rgba(26, 20, 16, 0.06)',
                  borderRadius: 18,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform 200ms ease, box-shadow 200ms ease',
                  boxShadow:
                    '0 1px 2px rgba(26, 20, 16, 0.04), 0 8px 24px -16px rgba(26, 20, 16, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <BrandLogo
                    logo={s.logo}
                    fallback="🏪"
                    size={56}
                    borderRadius={16}
                    background={`linear-gradient(135deg, ${s.primaryColor}, ${s.primaryColor}88)`}
                    fontSize={28}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontWeight: 700,
                        fontSize: 17,
                        lineHeight: 1.15,
                        marginBottom: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: '#7A6E66',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {s.slogan}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: s.localOpen ? 'rgba(34, 197, 94, 0.12)' : 'rgba(26, 20, 16, 0.06)',
                      color: s.localOpen ? '#157A40' : '#7A6E66',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: s.localOpen ? '#22C55E' : '#94918D',
                      }}
                    />
                    <span>{s.localOpen ? 'Abierto' : 'Cerrado'}</span>
                  </span>
                  <span style={{ fontSize: 12, color: '#7A6E66' }}>
                    {s.productCount} {s.productCount === 1 ? 'producto' : 'productos'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 28,
            background: 'linear-gradient(135deg, #1A1410, #2E2018)',
            color: 'white',
            borderRadius: 18,
            padding: isMobile ? 20 : 28,
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 11.5, color: '#F0823A', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ¿Tenés un local?
            </div>
            <h3
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: isMobile ? 20 : 22,
                margin: '0 0 6px',
                letterSpacing: '-0.01em',
              }}
            >
              Sumate y empezá a recibir pedidos
            </h3>
            <p style={{ fontSize: 13.5, color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.5 }}>
              Creá tu menú, configurá tu envío propio y compartí el link con tus clientes. Sin comisiones.
            </p>
          </div>
          {creating ? (
            <div
              style={{
                display: 'flex',
                gap: 8,
                background: 'white',
                padding: 6,
                borderRadius: 12,
                minWidth: isMobile ? 'auto' : 280,
              }}
            >
              <input
                type="text"
                value={newName}
                autoFocus
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate()
                  if (e.key === 'Escape') {
                    setCreating(false)
                    setNewName('')
                  }
                }}
                placeholder="Nombre del local…"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '8px 10px',
                  fontSize: 14,
                  color: '#1A1410',
                  minWidth: 0,
                }}
              />
              <button
                onClick={() => void handleCreate()}
                disabled={busy}
                style={{
                  background: busy ? 'rgba(26, 20, 16, 0.4)' : '#E54B2A',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: busy ? 'wait' : 'pointer',
                  flexShrink: 0,
                }}
              >
                {busy ? '…' : 'Crear'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{
                background: '#E54B2A',
                color: 'white',
                border: 'none',
                padding: '13px 22px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(229, 75, 42, 0.35)',
                justifySelf: isMobile ? 'stretch' : 'end',
              }}
            >
              + Crear mi local
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean
  onClick: () => void
  label: string
  dot?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#1A1410' : 'white',
        color: active ? 'white' : '#1A1410',
        border: '1px solid ' + (active ? 'transparent' : 'rgba(26, 20, 16, 0.08)'),
        padding: '10px 12px',
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 12.5,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'all 140ms ease',
      }}
    >
      {dot ? (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: dot,
            display: 'inline-block',
          }}
        />
      ) : null}
      <span>{label}</span>
    </button>
  )
}
