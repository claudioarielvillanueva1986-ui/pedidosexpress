import { toggleBg, togglePos } from '../utils'

interface ToggleProps {
  on: boolean
  onClick: () => void
  size?: 'sm' | 'md'
  title?: string
}

export function Toggle({ on, onClick, size = 'sm', title }: ToggleProps) {
  const isMd = size === 'md'
  const w = isMd ? 42 : 38
  const h = isMd ? 24 : 22
  const knob = isMd ? 20 : 18
  const travel = isMd ? 20 : 18

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: toggleBg(on),
        border: 'none',
        width: w,
        height: h,
        borderRadius: 999,
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
        transition: 'background 200ms ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: togglePos(on, travel),
          width: knob,
          height: knob,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 200ms ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}
      />
    </button>
  )
}
