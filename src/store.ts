import { useEffect, useState } from 'react'
import type {
  Category,
  LocalConfig,
  PaymentsConfig,
  Product,
  ScheduleDay,
  ShippingConfig,
} from './types'
import {
  INITIAL_CATEGORIES,
  INITIAL_LOCAL,
  INITIAL_PAYMENTS,
  INITIAL_PRODUCTS,
  INITIAL_SCHEDULE,
  INITIAL_SHIPPING,
} from './data'

const STORAGE_KEY = 'pedidoExpress.locales.v2'
const LEGACY_KEY = 'pedidoExpress.adminState.v1'
const DEFAULT_SLUG = 'laesquina'
const CHANGED_EVENT = 'pedidoExpress.stateChanged'

export interface LocaleState {
  slug: string
  categories: Category[]
  products: Product[]
  local: LocalConfig
  schedule: ScheduleDay[]
  payments: PaymentsConfig
  shipping: ShippingConfig
  localOpen: boolean
  createdAt: number
}

export interface LocaleSummary {
  slug: string
  name: string
  slogan: string
  logo: string
  primaryColor: string
  localOpen: boolean
  productCount: number
}

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
  const seedStore: StoreShape = {
    locales: { [DEFAULT_SLUG]: defaultLocaleState(DEFAULT_SLUG) },
  }
  return seedStore
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

export function uniqueSlug(base: string): string {
  const store = readStore()
  let candidate = slugify(base) || 'local'
  if (!store.locales[candidate]) return candidate
  for (let i = 2; i < 200; i++) {
    const tryIt = `${candidate}-${i}`
    if (!store.locales[tryIt]) return tryIt
  }
  return `${candidate}-${1700000000000}`
}

export function loadLocale(slug: string): LocaleState | null {
  const store = readStore()
  return store.locales[slug] ?? null
}

export function saveLocale(state: LocaleState): void {
  const store = readStore()
  store.locales[state.slug] = state
  writeStore(store)
}

export function deleteLocale(slug: string): void {
  const store = readStore()
  delete store.locales[slug]
  writeStore(store)
}

export function createLocale(name: string): LocaleState {
  const slug = uniqueSlug(name)
  const state = defaultLocaleState(slug, name)
  saveLocale(state)
  return state
}

export function listLocaleSummaries(): LocaleSummary[] {
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

export function ensureDefaultLocale(): string {
  const store = readStore()
  const slugs = Object.keys(store.locales)
  if (slugs.length > 0) return slugs[0]
  const created = createLocale('Hamburguesería La Esquina')
  return created.slug
}

export function useLocaleSummaries(): LocaleSummary[] {
  const [list, setList] = useState<LocaleSummary[]>(() => listLocaleSummaries())
  useEffect(() => {
    const onChange = () => setList(listLocaleSummaries())
    window.addEventListener('storage', onChange)
    window.addEventListener(CHANGED_EVENT, onChange)
    return () => {
      window.removeEventListener('storage', onChange)
      window.removeEventListener(CHANGED_EVENT, onChange)
    }
  }, [])
  return list
}

export function useLocaleState(slug: string | null): LocaleState | null {
  const [state, setState] = useState<LocaleState | null>(() =>
    slug ? loadLocale(slug) : null,
  )
  useEffect(() => {
    setState(slug ? loadLocale(slug) : null)
    if (!slug) return
    const onChange = () => setState(loadLocale(slug))
    window.addEventListener('storage', onChange)
    window.addEventListener(CHANGED_EVENT, onChange)
    return () => {
      window.removeEventListener('storage', onChange)
      window.removeEventListener(CHANGED_EVENT, onChange)
    }
  }, [slug])
  return state
}
