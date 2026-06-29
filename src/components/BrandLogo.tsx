interface BrandLogoProps {
  logo: string | undefined | null
  fallback: string
  size: number
  borderRadius?: number
  fontSize?: number
  background?: string
  color?: string
}

/**
 * Renders a local's logo as an image when it looks like a URL or data URL,
 * as the literal string when it's a short emoji / few chars, or falls back
 * to a provided string (typically an emoji or initials).
 */
export function BrandLogo({
  logo,
  fallback,
  size,
  borderRadius = 10,
  fontSize,
  background = '#F5F2EE',
  color,
}: BrandLogoProps) {
  const isUrl = typeof logo === 'string' && /^(https?:|data:)/i.test(logo)
  const content = isUrl ? (
    <img
      src={logo!}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  ) : (
    logo || fallback
  )
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        background,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        fontSize: fontSize ?? Math.round(size * 0.55),
        lineHeight: 1,
      }}
    >
      {content}
    </div>
  )
}
