import { useEffect, useState } from 'react'

interface Preferences {
  enabled: boolean
  sound: boolean
}

const STORAGE_KEY = 'pedidoExpress.notifications.v1'

export function loadNotificationPrefs(): Preferences {
  if (typeof window === 'undefined') return { enabled: false, sound: true }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Preferences>
      return { enabled: !!parsed.enabled, sound: parsed.sound !== false }
    }
  } catch {
    /* ignore */
  }
  return { enabled: false, sound: true }
}

function savePrefs(prefs: Preferences): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

interface NotificationBannerProps {
  prefs: Preferences
  onPrefsChange: (next: Preferences) => void
  isMobile?: boolean
}

export function NotificationBanner({ prefs, onPrefsChange, isMobile = false }: NotificationBannerProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    setPermission(Notification.permission)
  }, [])

  const update = (next: Preferences) => {
    savePrefs(next)
    onPrefsChange(next)
  }

  const askPermission = async () => {
    if (typeof Notification === 'undefined') return
    try {
      const p = await Notification.requestPermission()
      setPermission(p)
      if (p === 'granted') {
        update({ enabled: true, sound: prefs.sound })
      }
    } catch {
      /* user dismissed */
    }
  }

  if (permission === 'unsupported') {
    return (
      <BannerShell tone="info" isMobile={isMobile}>
        <div style={{ fontSize: 12.5, color: '#7A6E66' }}>
          Tu navegador no soporta notificaciones del sistema. Igual escuchá el sonido cuando
          tengas la pestaña abierta.
        </div>
        <SoundToggle prefs={prefs} onChange={update} />
      </BannerShell>
    )
  }

  if (permission === 'default') {
    return (
      <BannerShell tone="warning" isMobile={isMobile}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>
            🔔 Activá las notificaciones
          </div>
          <div style={{ fontSize: 12.5, color: '#7A6E66', lineHeight: 1.4 }}>
            Te avisamos en el momento cuando entra un pedido, aunque no tengas la pestaña
            activa.
          </div>
        </div>
        <button
          onClick={() => void askPermission()}
          style={{
            background: '#1A1410',
            color: 'white',
            border: 'none',
            padding: '10px 14px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 12.5,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Activar
        </button>
      </BannerShell>
    )
  }

  if (permission === 'denied') {
    return (
      <BannerShell tone="error" isMobile={isMobile}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>
            🔕 Notificaciones bloqueadas
          </div>
          <div style={{ fontSize: 12.5, color: '#7A6E66', lineHeight: 1.4 }}>
            Activalas desde el candado de la URL del navegador para enterarte de los pedidos al
            instante.
          </div>
        </div>
        <SoundToggle prefs={prefs} onChange={update} />
      </BannerShell>
    )
  }

  // granted
  return (
    <BannerShell tone="success" isMobile={isMobile}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>
          ✅ Notificaciones activas
        </div>
        <div style={{ fontSize: 12.5, color: '#7A6E66', lineHeight: 1.4 }}>
          Te avisamos cuando entra un pedido nuevo.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <SoundToggle prefs={prefs} onChange={update} />
        <PillToggle
          label={prefs.enabled ? 'On' : 'Off'}
          on={prefs.enabled}
          onClick={() => update({ ...prefs, enabled: !prefs.enabled })}
        />
      </div>
    </BannerShell>
  )
}

function SoundToggle({
  prefs,
  onChange,
}: {
  prefs: Preferences
  onChange: (next: Preferences) => void
}) {
  return (
    <button
      onClick={() => onChange({ ...prefs, sound: !prefs.sound })}
      title={prefs.sound ? 'Silenciar' : 'Activar sonido'}
      style={{
        background: prefs.sound ? '#1A1410' : 'rgba(26, 20, 16, 0.08)',
        color: prefs.sound ? 'white' : '#7A6E66',
        border: 'none',
        width: 36,
        height: 36,
        borderRadius: 10,
        cursor: 'pointer',
        fontSize: 14,
      }}
    >
      {prefs.sound ? '🔊' : '🔇'}
    </button>
  )
}

function PillToggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: on ? '#22C55E' : 'rgba(26, 20, 16, 0.18)',
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 12,
        cursor: 'pointer',
        minWidth: 50,
      }}
    >
      {label}
    </button>
  )
}

function BannerShell({
  tone,
  isMobile,
  children,
}: {
  tone: 'info' | 'warning' | 'error' | 'success'
  isMobile: boolean
  children: React.ReactNode
}) {
  const bg = {
    info: 'white',
    warning: '#FFF7ED',
    error: 'rgba(229, 75, 42, 0.06)',
    success: 'rgba(34, 197, 94, 0.06)',
  }[tone]
  const border = {
    info: 'rgba(26, 20, 16, 0.08)',
    warning: 'rgba(240, 130, 58, 0.3)',
    error: 'rgba(229, 75, 42, 0.25)',
    success: 'rgba(34, 197, 94, 0.25)',
  }[tone]
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: isMobile ? 12 : 14,
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 12,
      }}
    >
      {children}
    </div>
  )
}
