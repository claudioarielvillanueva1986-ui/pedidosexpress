interface ToastProps {
  message: string | null
}

export function Toast({ message }: ToastProps) {
  if (!message) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1A1410',
        color: 'white',
        padding: '11px 18px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 100,
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
        animation: 'pa-toast-in 220ms ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 14 }}>✓</span>
      <span>{message}</span>
    </div>
  )
}
