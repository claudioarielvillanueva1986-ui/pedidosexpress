import {
  INITIAL_CATEGORIES,
  INITIAL_LOCAL,
  INITIAL_PAYMENTS,
  INITIAL_PRODUCTS,
  INITIAL_SCHEDULE,
  INITIAL_SHIPPING,
} from '../data'
import type { LocaleState, LocaleSummary } from './storeTypes'

const STORAGE_KEY = 'pedidoExpress.locales.v2'
const LEGACY_KEY = 'pedidoExpress.adminState.v1'
const DEFAULT_SLUG = 'laesquina'
export const CHANGED_EVENT = 'pedidoExpress.stateChanged'

interface StoreShape {
  locales: Record<string, LocaleState>
}

export function defaultLocaleState(slug: string, name?: string): LocaleState {
  return {
    slug,
    categories: INITIAL_CATEGORIES,
    products: INITIAL_PRODUCTS,
    local: { ...INITIAL_LOCAL, ...(name ? { name } : {}) },
    schedule: INITIAL_SCHEDULE,
    payments: INITIAL_PAYMENTS,
    shipping: INITIAL_SHIPPING,
    localOpen: true,
    createdAt: 1700000000000,
  }
}

function readStore(): StoreShape {
  if (typeof window === 'undefined') return { locales: {} }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoreShape
      if (parsed && typeof parsed === 'object' && parsed.locales) return parsed
    }
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY)
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw)
      const seeded: LocaleState = {
        ...defaultLocaleState(DEFAULT_SLUG),
        ...legacy,
        slug: DEFAULT_SLUG,
      }
      const store: StoreShape = { locales: { [DEFAULT_SLUG]: seeded } }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
      return store
    }
  } catch {
    /* ignore */
  }
  return { locales: { [DEFAULT_SLUG]: defaultLocaleState(DEFAULT_SLUG) } }
}

function writeStore(store: StoreShape): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    window.dispatchEvent(new Event(CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-') || 'local'
  )
}

function uniqueSlugLocal(base: string): string {
  const store = readStore()
  const candidate = slugify(base) || 'local'
  if (!store.locales[candidate]) return candidate
  for (let i = 2; i < 200; i++) {
    const tryIt = `${candidate}-${i}`
    if (!store.locales[tryIt]) return tryIt
  }
  return `${candidate}-${1700000000000}`
}

export function localLoadLocale(slug: string): LocaleState | null {
  return readStore().locales[slug] ?? null
}

export function localSaveLocale(state: LocaleState): void {
  const store = readStore()
  store.locales[state.slug] = state
  writeStore(store)
}

export function localDeleteLocale(slug: string): void {
  const store = readStore()
  delete store.locales[slug]
  writeStore(store)
}

export function localCreateLocale(name: string): LocaleState {
  const slug = uniqueSlugLocal(name)
  const state = defaultLocaleState(slug, name)
  localSaveLocale(state)
  return state
}

export function localListSummaries(): LocaleSummary[] {
  const store = readStore()
  return Object.values(store.locales).map((l) => ({
    slug: l.slug,
    name: l.local.name,
    slogan: l.local.slogan,
    logo: l.local.logo,
    primaryColor: l.local.primaryColor,
    localOpen: l.localOpen,
    productCount: l.products.filter((p) => p.available).length,
  }))
}

export function localEnsureDefault(): string {
  const store = readStore()
  const slugs = Object.keys(store.locales)
  if (slugs.length > 0) return slugs[0]
  const created = localCreateLocale('Hamburguesería La Esquina')
  return created.slug
}

export function localSubscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', cb)
  window.addEventListener(CHANGED_EVENT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(CHANGED_EVENT, cb)
  }
}
