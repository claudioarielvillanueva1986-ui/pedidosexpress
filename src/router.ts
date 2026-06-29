export type Route =
  | { kind: 'landing' }
  | { kind: 'admin'; slug: string | null }
  | { kind: 'customer'; slug: string }

export function parseHash(hash: string): Route {
  const cleaned = hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  if (!cleaned) return { kind: 'landing' }

  const parts = cleaned.split('/').filter(Boolean)

  if (parts[0] === 'admin') {
    const slug = parts[1] ?? null
    return { kind: 'admin', slug }
  }

  // Anything else is a customer slug.
  return { kind: 'customer', slug: parts[0] }
}

export function navigate(route: Route): void {
  const hash = buildHash(route)
  if (window.location.hash !== hash) {
    window.location.hash = hash
  }
}

export function buildHash(route: Route): string {
  switch (route.kind) {
    case 'landing':
      return ''
    case 'admin':
      return route.slug ? `#/admin/${route.slug}` : '#/admin'
    case 'customer':
      return `#/${route.slug}`
  }
}

export function buildUrl(route: Route): string {
  const base = window.location.origin + window.location.pathname
  return base + buildHash(route)
}
