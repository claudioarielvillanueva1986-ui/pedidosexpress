import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './lib/auth'
import { useProfile } from './lib/profile'
import { isCloudMode } from './lib/supabase'
import {
  adminDeleteLocale,
  listAllUsersAdmin,
  setLocaleStatus,
  setUserRole,
  useAdminLocales,
} from './lib/admin'
import type { AdminLocaleRow, AdminUserRow } from './lib/admin'
import { AuthScreen } from './components/AuthScreen'
import { BrandLogo } from './components/BrandLogo'
import { navigate, buildUrl } from './router'
import { useIsMobile } from './hooks/useMediaQuery'
import type { LocaleStatus, UserRole } from './types'

type Tab = 'locales' | 'users'
type LocaleFilter = 'all' | LocaleStatus

export function SuperAdminPanel() {
  const auth = useAuth()
  const profileQ = useProfile()

  if (!isCloudMode) {
    return <CloudOnlyScreen />
  }
  if (auth.loading || profileQ.loading) {
    return <FullScreen text="Cargando…" />
  }
  if (!auth.user) {
    return <AuthScreen />
  }
  if (profileQ.profile?.role !== 'admin') {
    return <NotAuthorizedScreen email={auth.user.email ?? ''} />
  }

  return <SuperAdminInner />
}

function CloudOnlyScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F2EE',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        color: '#1A1410',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>☁️</div>
      <h1
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          margin: '0 0 8px',
        }}
      >
        Super admin disponible en modo cloud
      </h1>
      <p style={{ color: '#7A6E66', maxWidth: 400, margin: '0 0 16px', lineHeight: 1.5 }}>
        Esta pantalla maneja aprobaciones, roles de usuarios y configuración global. Necesita
        Supabase + auth real (modo cloud) para funcionar.
      </p>
      <button
        onClick={() => navigate({ kind: 'landing' })}
        style={{
          background: '#1A1410',
          color: 'white',
          border: 'none',
          padding: '11px 18px',
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 13.5,
          cursor: 'pointer',
        }}
      >
        Volver al marketplace
      </button>
    </div>
  )
}

function SuperAdminInner() {
  const isMobile = useIsMobile()
  const localesQ = useAdminLocales()
  const [tab, setTab] = useState<Tab>('locales')
  const [filter, setFilter] = useState<LocaleFilter>('pending_review')
  const [busy, setBusy] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    if (tab !== 'users') return
    setUsersLoading(true)
    listAllUsersAdmin()
      .then(setUsers)
      .catch((err) => window.alert(err instanceof Error ? err.message : 'Error'))
      .finally(() => setUsersLoading(false))
  }, [tab])

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: localesQ.data.length,
      pending_review: 0,
      active: 0,
      suspended: 0,
    }
    for (const l of localesQ.data) c[l.status] = (c[l.status] ?? 0) + 1
    return c
  }, [localesQ.data])

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? localesQ.data
        : localesQ.data.filter((l) => l.status === filter),
    [localesQ.data, filter],
  )

  const handleAction = async (slug: string, action: 'approve' | 'suspend' | 'reactivate' | 'delete') => {
    setBusy(slug)
    try {
      if (action === 'approve') await setLocaleStatus(slug, 'active')
      else if (action === 'suspend') await setLocaleStatus(slug, 'suspended')
      else if (action === 'reactivate') await setLocaleStatus(slug, 'active')
      else if (action === 'delete') {
        if (!window.confirm('Eliminar el local definitivamente?')) {
          setBusy(null)
          return
        }
        await adminDeleteLocale(slug)
      }
      localesQ.reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No pudimos aplicar la acción.')
    } finally {
      setBusy(null)
    }
  }

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setBusy(userId)
    try {
      await setUserRole(userId, role)
      const u = await listAllUsersAdmin()
      setUsers(u)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No pudimos cambiar el rol.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F2EE',
        color: '#1A1410',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          background: 'rgba(26, 20, 16, 0.96)',
          color: 'white',
          padding: isMobile ? '14px 16px' : '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate({ kind: 'landing' })}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: 34,
              height: 34,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
            aria-label="Volver"
          >
            ←
          </button>
          <div>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: '-0.01em',
              }}
            >
              Super Admin
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)', marginTop: 2 }}>
              Pedido Express · gestión global
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid rgba(26, 20, 16, 0.06)',
          padding: isMobile ? '0 16px' : '0 28px',
          display: 'flex',
          gap: 4,
        }}
      >
        <TabButton active={tab === 'locales'} onClick={() => setTab('locales')}>
          Locales{counts.pending_review > 0 ? ` · ${counts.pending_review}` : ''}
        </TabButton>
        <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
          Usuarios
        </TabButton>
      </div>

      <main
        style={{
          flex: 1,
          padding: isMobile ? '16px' : '24px 28px',
          maxWidth: 1100,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {tab === 'locales' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              className="pa-scroll-x"
              style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}
            >
              {(
                [
                  { key: 'pending_review', label: 'Pendientes' },
                  { key: 'active', label: 'Activos' },
                  { key: 'suspended', label: 'Suspendidos' },
                  { key: 'all', label: 'Todos' },
                ] as { key: LocaleFilter; label: string }[]
              ).map((f) => {
                const isActive = filter === f.key
                const count = counts[f.key] ?? 0
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 999,
                      background: isActive ? '#1A1410' : 'white',
                      color: isActive ? 'white' : '#1A1410',
                      border: '1px solid ' + (isActive ? 'transparent' : 'rgba(26, 20, 16, 0.08)'),
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <span>{f.label}</span>
                    <span
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.05)',
                        color: isActive ? 'white' : '#7A6E66',
                        padding: '1px 7px',
                        borderRadius: 999,
                        fontSize: 10.5,
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {localesQ.loading ? (
              <EmptyCard text="Cargando locales…" />
            ) : localesQ.error ? (
              <EmptyCard text={`Error: ${localesQ.error}`} />
            ) : filtered.length === 0 ? (
              <EmptyCard
                icon="📭"
                title="No hay locales en este filtro"
                subtitle="Cuando entre uno nuevo, va a aparecer acá."
              />
            ) : (
              filtered.map((l) => (
                <LocaleAdminCard
                  key={l.slug}
                  row={l}
                  isMobile={isMobile}
                  busy={busy === l.slug}
                  onAction={(action) => void handleAction(l.slug, action)}
                />
              ))
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {usersLoading ? (
              <EmptyCard text="Cargando usuarios…" />
            ) : users.length === 0 ? (
              <EmptyCard text="No hay usuarios todavía." />
            ) : (
              users.map((u) => (
                <UserAdminCard
                  key={u.id}
                  row={u}
                  isMobile={isMobile}
                  busy={busy === u.id}
                  onRoleChange={(role) => void handleRoleChange(u.id, role)}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// --------- subcomponents ----------

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: '14px 14px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 13.5,
        color: active ? '#1A1410' : '#7A6E66',
        borderBottom: '3px solid ' + (active ? '#E54B2A' : 'transparent'),
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  )
}

function LocaleAdminCard({
  row,
  isMobile,
  busy,
  onAction,
}: {
  row: AdminLocaleRow
  isMobile: boolean
  busy: boolean
  onAction: (action: 'approve' | 'suspend' | 'reactivate' | 'delete') => void
}) {
  const statusMeta = {
    pending_review: { label: '⏳ Pendiente', color: '#A85311', bg: 'rgba(240, 130, 58, 0.14)' },
    active: { label: '✅ Activo', color: '#157A40', bg: 'rgba(34, 197, 94, 0.14)' },
    suspended: { label: '🚫 Suspendido', color: '#C03A1E', bg: 'rgba(229, 75, 42, 0.14)' },
  }[row.status]

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid rgba(26, 20, 16, 0.06)',
        borderRadius: 14,
        padding: isMobile ? 14 : 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <BrandLogo
          logo={row.logo}
          fallback="🏪"
          size={48}
          borderRadius={12}
          background={`linear-gradient(135deg, ${row.primaryColor}, ${row.primaryColor}99)`}
          fontSize={22}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: 15.5,
              }}
            >
              {row.name}
            </span>
            <span
              style={{
                background: statusMeta.bg,
                color: statusMeta.color,
                padding: '2px 9px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {statusMeta.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#7A6E66', marginTop: 4, lineHeight: 1.4 }}>
            /{row.slug} · {row.ownerName || 'Sin nombre'} · {row.productCount} productos ·{' '}
            {row.orderCount} pedidos
          </div>
          {row.whatsapp ? (
            <div style={{ fontSize: 12, color: '#7A6E66', marginTop: 2 }}>
              📞 {row.whatsapp}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a
          href={buildUrl({ kind: 'customer', slug: row.slug })}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'white',
            border: '1px solid rgba(26, 20, 16, 0.1)',
            padding: '8px 12px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 12.5,
            cursor: 'pointer',
            color: '#1A1410',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          👁 Ver
        </a>
        {row.status === 'pending_review' ? (
          <button
            onClick={() => onAction('approve')}
            disabled={busy}
            style={{
              background: '#22C55E',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            ✓ Aprobar
          </button>
        ) : null}
        {row.status === 'active' ? (
          <button
            onClick={() => onAction('suspend')}
            disabled={busy}
            style={{
              background: 'white',
              color: '#C03A1E',
              border: '1px solid rgba(229, 75, 42, 0.3)',
              padding: '8px 14px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 12.5,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            🚫 Suspender
          </button>
        ) : null}
        {row.status === 'suspended' ? (
          <button
            onClick={() => onAction('reactivate')}
            disabled={busy}
            style={{
              background: '#1A1410',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            Reactivar
          </button>
        ) : null}
        <button
          onClick={() => onAction('delete')}
          disabled={busy}
          style={{
            background: 'white',
            color: '#7A6E66',
            border: '1px solid rgba(26, 20, 16, 0.08)',
            padding: '8px 14px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 12.5,
            cursor: busy ? 'wait' : 'pointer',
            marginLeft: 'auto',
          }}
        >
          🗑 Eliminar
        </button>
      </div>
    </div>
  )
}

function UserAdminCard({
  row,
  isMobile,
  busy,
  onRoleChange,
}: {
  row: AdminUserRow
  isMobile: boolean
  busy: boolean
  onRoleChange: (role: UserRole) => void
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid rgba(26, 20, 16, 0.06)',
        borderRadius: 14,
        padding: isMobile ? 14 : 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {(row.fullName || row.id).charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.fullName || row.id.slice(0, 8) + '…'}
        </div>
        <div style={{ fontSize: 11.5, color: '#7A6E66', marginTop: 2 }}>
          {row.phone || 'Sin teléfono'} · {row.localeCount}{' '}
          {row.localeCount === 1 ? 'local' : 'locales'}
        </div>
      </div>
      <select
        value={row.role}
        disabled={busy}
        onChange={(e) => onRoleChange(e.target.value as UserRole)}
        style={{
          background: 'white',
          border: '1px solid rgba(26, 20, 16, 0.12)',
          padding: '7px 10px',
          borderRadius: 9,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        <option value="customer">customer</option>
        <option value="merchant">merchant</option>
        <option value="admin">admin</option>
      </select>
    </div>
  )
}

function NotAuthorizedScreen({ email }: { email: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F2EE',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        color: '#1A1410',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
      <h1
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          margin: '0 0 8px',
        }}
      >
        Acceso restringido
      </h1>
      <p style={{ color: '#7A6E66', maxWidth: 380, margin: '0 0 16px', lineHeight: 1.5 }}>
        Estás logueado como <code>{email}</code> pero esa cuenta no tiene rol{' '}
        <strong>admin</strong>. Si tenés que tener acceso, pedile al administrador que te
        promueva.
      </p>
      <button
        onClick={() => navigate({ kind: 'landing' })}
        style={{
          background: '#1A1410',
          color: 'white',
          border: 'none',
          padding: '11px 18px',
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 13.5,
          cursor: 'pointer',
        }}
      >
        Volver al marketplace
      </button>
    </div>
  )
}

function FullScreen({ text }: { text: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F2EE',
        color: '#7A6E66',
        fontSize: 14,
      }}
    >
      {text}
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
