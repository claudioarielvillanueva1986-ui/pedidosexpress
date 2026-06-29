export function formatPrice(n: number | '' | null | undefined): string {
  if (n === '' || n == null || isNaN(Number(n))) return '$ —'
  return '$ ' + Math.round(Number(n)).toLocaleString('es-AR')
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(26, 20, 16, 0.12)',
  background: 'white',
  fontSize: 13.5,
  outline: 'none',
  color: '#1A1410',
  transition: 'border-color 150ms ease',
}

export function toggleBg(on: boolean): string {
  return on ? '#22C55E' : 'rgba(26, 20, 16, 0.18)'
}

export function togglePos(on: boolean, w: number): string {
  return on ? `${w}px` : '2px'
}
