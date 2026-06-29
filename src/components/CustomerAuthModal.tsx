import { useState } from 'react'
import { useAuth } from '../lib/auth'

type Mode = 'signin' | 'signup'

interface CustomerAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthenticated: () => void
  primaryColor?: string
  localName?: string
}

export function CustomerAuthModal({
  isOpen,
  onClose,
  onAuthenticated,
  primaryColor = '#E54B2A',
  localName,
}: CustomerAuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (!isOpen) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Completá email y contraseña.')
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    const fn = mode === 'signin' ? signIn : signUp
    const { error: err } = await fn(email, password)
    setBusy(false)
    if (err) {
      setError(err)
    } else if (mode === 'signup') {
      setNotice(
        'Te enviamos un email para confirmar la cuenta. Después de confirmarlo, volvé y entrá con tus credenciales.',
      )
    } else {
      onAuthenticated()
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 20, 16, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'white',
          borderRadius: 18,
          padding: 24,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: 19,
              margin: 0,
            }}
          >
            {mode === 'signin' ? 'Entrá a tu cuenta' : 'Creá tu cuenta'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#F5F2EE',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 13.5, color: '#7A6E66', margin: '0 0 16px', lineHeight: 1.5 }}>
          {mode === 'signin'
            ? 'Para confirmar tu pedido necesitamos identificarte.'
            : `Te identificás una vez y guardás tu dirección${
                localName ? ` para pedir más rápido en ${localName}` : ''
              }.`}
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Email
            </span>
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '11px 13px',
                borderRadius: 11,
                border: '1px solid rgba(26, 20, 16, 0.14)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Contraseña
            </span>
            <input
              type="password"
              value={password}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '11px 13px',
                borderRadius: 11,
                border: '1px solid rgba(26, 20, 16, 0.14)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </label>

          {error ? (
            <div
              style={{
                background: 'rgba(229, 75, 42, 0.08)',
                color: '#C03A1E',
                padding: '9px 12px',
                borderRadius: 10,
                fontSize: 12.5,
              }}
            >
              {error}
            </div>
          ) : null}
          {notice ? (
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#157A40',
                padding: '9px 12px',
                borderRadius: 10,
                fontSize: 12.5,
                lineHeight: 1.4,
              }}
            >
              {notice}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            style={{
              background: busy ? 'rgba(26, 20, 16, 0.5)' : primaryColor,
              color: 'white',
              border: 'none',
              padding: 13,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: busy ? 'wait' : 'pointer',
              marginTop: 4,
            }}
          >
            {busy
              ? 'Procesando…'
              : mode === 'signin'
                ? 'Entrar'
                : 'Crear cuenta y continuar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#7A6E66', marginTop: 14 }}>
          {mode === 'signin' ? (
            <>
              ¿Primera vez?{' '}
              <button
                onClick={() => {
                  setMode('signup')
                  setError(null)
                  setNotice(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: primaryColor,
                  fontWeight: 700,
                  cursor: 'pointer',
                  font: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Crear cuenta
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{' '}
              <button
                onClick={() => {
                  setMode('signin')
                  setError(null)
                  setNotice(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: primaryColor,
                  fontWeight: 700,
                  cursor: 'pointer',
                  font: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Entrá
              </button>
            </>
          )}
        </div>

        <div
          style={{
            fontSize: 11,
            color: '#7A6E66',
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid rgba(26, 20, 16, 0.05)',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          Al crear tu cuenta aceptás los Términos y Condiciones de Pedido Express.
        </div>
      </div>
    </div>
  )
}
