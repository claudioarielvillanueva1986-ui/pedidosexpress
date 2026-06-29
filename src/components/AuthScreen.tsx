import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { navigate } from '../router'

type Mode = 'signin' | 'signup'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

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
        'Te enviamos un email para confirmar la cuenta. Revisalo y volvé a entrar.',
      )
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F2EE',
        color: '#1A1410',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'white',
          borderRadius: 18,
          padding: 28,
          boxShadow:
            '0 1px 2px rgba(26, 20, 16, 0.04), 0 20px 50px -20px rgba(26, 20, 16, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: 'linear-gradient(135deg, #E54B2A, #F0823A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
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
                fontSize: 18,
                lineHeight: 1,
                letterSpacing: '-0.01em',
              }}
            >
              Pedido Express
            </div>
            <div style={{ fontSize: 12, color: '#7A6E66', marginTop: 3 }}>
              Panel del comerciante
            </div>
          </div>
        </div>

        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            margin: '0 0 6px',
            letterSpacing: '-0.015em',
          }}
        >
          {mode === 'signin' ? 'Entrar a tu cuenta' : 'Crear cuenta'}
        </h1>
        <p style={{ fontSize: 13.5, color: '#7A6E66', margin: '0 0 18px', lineHeight: 1.5 }}>
          {mode === 'signin'
            ? 'Accedé al panel para administrar tus locales.'
            : 'Creá una cuenta para sumar tu primer local.'}
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
                background: 'white',
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
                background: 'white',
              }}
            />
            {mode === 'signup' ? (
              <span style={{ display: 'block', fontSize: 11, color: '#7A6E66', marginTop: 4 }}>
                Mínimo 6 caracteres.
              </span>
            ) : null}
          </label>

          {error ? (
            <div
              style={{
                background: 'rgba(229, 75, 42, 0.08)',
                color: '#C03A1E',
                padding: '9px 12px',
                borderRadius: 10,
                fontSize: 12.5,
                lineHeight: 1.4,
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
              background: busy ? 'rgba(26, 20, 16, 0.5)' : '#E54B2A',
              color: 'white',
              border: 'none',
              padding: 13,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: busy ? 'wait' : 'pointer',
              marginTop: 4,
              boxShadow: '0 8px 20px rgba(229, 75, 42, 0.25)',
            }}
          >
            {busy
              ? 'Procesando…'
              : mode === 'signin'
                ? 'Entrar'
                : 'Crear cuenta'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#7A6E66',
            marginTop: 16,
          }}
        >
          {mode === 'signin' ? (
            <>
              ¿No tenés cuenta?{' '}
              <button
                onClick={() => {
                  setMode('signup')
                  setError(null)
                  setNotice(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E54B2A',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  font: 'inherit',
                }}
              >
                Crear una
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
                  color: '#E54B2A',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  font: 'inherit',
                }}
              >
                Entrá
              </button>
            </>
          )}
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#7A6E66',
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid rgba(26, 20, 16, 0.05)',
          }}
        >
          <button
            onClick={() => navigate({ kind: 'landing' })}
            style={{
              background: 'none',
              border: 'none',
              color: '#7A6E66',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            ← Volver al marketplace
          </button>
        </div>
      </div>
    </div>
  )
}
