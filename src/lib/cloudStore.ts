import {
  INITIAL_CATEGORIES,
  INITIAL_LOCAL,
  INITIAL_PAYMENTS,
  INITIAL_PRODUCTS,
  INITIAL_SCHEDULE,
  INITIAL_SHIPPING,
} from '../data'
import type { Category, LocaleStatus, Product, ScheduleDay } from '../types'
import { requireClient } from './supabase'
import { slugify } from './localStore'
import type { LocaleState, LocaleSummary } from './storeTypes'

interface DbLocaleRow {
  slug: string
  owner_id: string
  name: string
  slogan: string | null
  logo: string | null
  primary_color: string | null
  whatsapp: string | null
  phone: string | null
  email: string | null
  address: string | null
  local_open: boolean
  delivery_enabled: boolean
  pickup_enabled: boolean
  shipping_cost: number | null
  shipping_free_from: number | null
  shipping_zone: string | null
  eta_delivery: string | null
  eta_pickup: string | null
  cash_enabled: boolean
  transfer_enabled: boolean
  alias: string | null
  cbu: string | null
  holder: string | null
  payment_message: string | null
  payment_link: string | null
  schedule: ScheduleDay[] | null
  status: LocaleStatus | null
  created_at: string
  updated_at: string
}

interface DbCategoryRow {
  id: string
  locale_slug: string
  name: string
  emoji: string | null
  position: number | null
}

interface DbProductRow {
  id: string
  locale_slug: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  available: boolean
  position: number | null
}

function rowToLocaleState(
  row: DbLocaleRow,
  cats: DbCategoryRow[],
  prods: DbProductRow[],
): LocaleState {
  const categories: Category[] = cats
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji ?? '🍽',
    }))

  const products: Product[] = prods.map((p) => ({
    id: p.id,
    categoryId: p.category_id ?? '',
    name: p.name,
    desc: p.description ?? '',
    price: Number(p.price) || 0,
    img: p.image_url ?? '',
    available: p.available,
  }))

  return {
    slug: row.slug,
    categories,
    products,
    localOpen: row.local_open,
    local: {
      name: row.name,
      slogan: row.slogan ?? '',
      logo: row.logo ?? '🔥',
      primaryColor: row.primary_color ?? '#E54B2A',
      whatsapp: row.whatsapp ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      address: row.address ?? '',
    },
    status: row.status ?? 'pending_review',
    schedule:
      Array.isArray(row.schedule) && row.schedule.length > 0
        ? row.schedule
        : INITIAL_SCHEDULE,
    payments: {
      cashEnabled: row.cash_enabled,
      transferEnabled: row.transfer_enabled,
      alias: row.alias ?? '',
      cbu: row.cbu ?? '',
      holder: row.holder ?? '',
      message: row.payment_message ?? '',
      paymentLink: row.payment_link ?? '',
    },
    shipping: {
      deliveryEnabled: row.delivery_enabled,
      pickupEnabled: row.pickup_enabled,
      cost: row.shipping_cost === null ? 0 : Number(row.shipping_cost),
      freeFrom: row.shipping_free_from === null ? 0 : Number(row.shipping_free_from),
      zone: row.shipping_zone ?? '',
      etaDelivery: row.eta_delivery ?? '',
      etaPickup: row.eta_pickup ?? '',
    },
    createdAt: new Date(row.created_at).getTime(),
  }
}

export async function cloudListSummaries(): Promise<LocaleSummary[]> {
  const sb = requireClient()
  const { data: locales, error } = await sb
    .from('locales')
    .select(
      'slug,name,slogan,logo,primary_color,local_open,status',
    )
    .order('created_at', { ascending: true })
  if (error) throw error

  const slugs = (locales ?? []).map((l) => l.slug)
  let counts: Record<string, number> = {}
  if (slugs.length > 0) {
    const { data: prods, error: pe } = await sb
      .from('products')
      .select('locale_slug,available')
      .in('locale_slug', slugs)
    if (pe) throw pe
    counts = (prods ?? []).reduce<Record<string, number>>((acc, p) => {
      if (p.available) acc[p.locale_slug] = (acc[p.locale_slug] ?? 0) + 1
      return acc
    }, {})
  }

  return (locales ?? []).map((l) => ({
    slug: l.slug,
    name: l.name,
    slogan: l.slogan ?? '',
    logo: l.logo ?? '🔥',
    primaryColor: l.primary_color ?? '#E54B2A',
    localOpen: l.local_open,
    status: (l.status ?? 'pending_review') as LocaleStatus,
    productCount: counts[l.slug] ?? 0,
  }))
}

export async function cloudLoadLocale(slug: string): Promise<LocaleState | null> {
  const sb = requireClient()
  const [{ data: row, error: le }, { data: cats, error: ce }, { data: prods, error: pe }] =
    await Promise.all([
      sb.from('locales').select('*').eq('slug', slug).maybeSingle(),
      sb.from('categories').select('*').eq('locale_slug', slug),
      sb.from('products').select('*').eq('locale_slug', slug),
    ])
  if (le) throw le
  if (ce) throw ce
  if (pe) throw pe
  if (!row) return null
  return rowToLocaleState(row as DbLocaleRow, (cats ?? []) as DbCategoryRow[], (prods ?? []) as DbProductRow[])
}

async function uniqueSlugCloud(base: string): Promise<string> {
  const sb = requireClient()
  const candidate = slugify(base) || 'local'
  for (let i = 0; i < 200; i++) {
    const tryIt = i === 0 ? candidate : `${candidate}-${i + 1}`
    const { data, error } = await sb.from('locales').select('slug').eq('slug', tryIt).maybeSingle()
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return tryIt
  }
  return `${candidate}-${Math.floor(Math.random() * 1000000)}`
}

export async function cloudCreateLocale(name: string, ownerId: string): Promise<LocaleState> {
  const sb = requireClient()
  const slug = await uniqueSlugCloud(name)
  const { error: insErr } = await sb.from('locales').insert({
    slug,
    owner_id: ownerId,
    name,
    slogan: INITIAL_LOCAL.slogan,
    logo: INITIAL_LOCAL.logo,
    primary_color: INITIAL_LOCAL.primaryColor,
    whatsapp: INITIAL_LOCAL.whatsapp,
    phone: INITIAL_LOCAL.phone,
    email: INITIAL_LOCAL.email,
    address: INITIAL_LOCAL.address,
    local_open: true,
    delivery_enabled: INITIAL_SHIPPING.deliveryEnabled,
    pickup_enabled: INITIAL_SHIPPING.pickupEnabled,
    shipping_cost: INITIAL_SHIPPING.cost === '' ? 0 : INITIAL_SHIPPING.cost,
    shipping_free_from: INITIAL_SHIPPING.freeFrom === '' ? 0 : INITIAL_SHIPPING.freeFrom,
    shipping_zone: INITIAL_SHIPPING.zone,
    eta_delivery: INITIAL_SHIPPING.etaDelivery,
    eta_pickup: INITIAL_SHIPPING.etaPickup,
    cash_enabled: INITIAL_PAYMENTS.cashEnabled,
    transfer_enabled: INITIAL_PAYMENTS.transferEnabled,
    alias: INITIAL_PAYMENTS.alias,
    cbu: INITIAL_PAYMENTS.cbu,
    holder: INITIAL_PAYMENTS.holder,
    payment_message: INITIAL_PAYMENTS.message,
    payment_link: INITIAL_PAYMENTS.paymentLink ?? '',
    schedule: INITIAL_SCHEDULE,
  })
  if (insErr) throw insErr

  // Seed categories
  const catRows = INITIAL_CATEGORIES.map((c, i) => ({
    locale_slug: slug,
    name: c.name,
    emoji: c.emoji,
    position: i,
  }))
  const { data: insertedCats, error: ce } = await sb
    .from('categories')
    .insert(catRows)
    .select()
  if (ce) throw ce

  const oldIdToNew: Record<string, string> = {}
  ;(insertedCats ?? []).forEach((row, i) => {
    const old = INITIAL_CATEGORIES[i].id
    oldIdToNew[old] = (row as DbCategoryRow).id
  })

  // Seed products
  const prodRows = INITIAL_PRODUCTS.map((p, i) => ({
    locale_slug: slug,
    category_id: oldIdToNew[p.categoryId] ?? null,
    name: p.name,
    description: p.desc,
    price: p.price,
    image_url: p.img,
    available: p.available,
    position: i,
  }))
  const { error: pe } = await sb.from('products').insert(prodRows)
  if (pe) throw pe

  const loaded = await cloudLoadLocale(slug)
  if (!loaded) throw new Error('Falló cargar el local recién creado.')
  return loaded
}

export async function cloudSaveLocale(state: LocaleState): Promise<void> {
  const sb = requireClient()

  // Update the locales row (everything except categories/products)
  const { error: ue } = await sb
    .from('locales')
    .update({
      name: state.local.name,
      slogan: state.local.slogan,
      logo: state.local.logo,
      primary_color: state.local.primaryColor,
      whatsapp: state.local.whatsapp,
      phone: state.local.phone,
      email: state.local.email,
      address: state.local.address,
      local_open: state.localOpen,
      delivery_enabled: state.shipping.deliveryEnabled,
      pickup_enabled: state.shipping.pickupEnabled,
      shipping_cost: state.shipping.cost === '' ? 0 : state.shipping.cost,
      shipping_free_from: state.shipping.freeFrom === '' ? 0 : state.shipping.freeFrom,
      shipping_zone: state.shipping.zone,
      eta_delivery: state.shipping.etaDelivery,
      eta_pickup: state.shipping.etaPickup,
      cash_enabled: state.payments.cashEnabled,
      transfer_enabled: state.payments.transferEnabled,
      alias: state.payments.alias,
      cbu: state.payments.cbu,
      holder: state.payments.holder,
      payment_message: state.payments.message,
      payment_link: state.payments.paymentLink ?? '',
      schedule: state.schedule,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', state.slug)
  if (ue) throw ue

  // For categories/products we re-sync naively: upsert by id (which we control client-side
  // by reusing the row UUIDs returned at creation). Items removed locally get deleted in DB.
  const { data: dbCats, error: ce } = await sb
    .from('categories')
    .select('id')
    .eq('locale_slug', state.slug)
  if (ce) throw ce

  const dbCatIds = new Set((dbCats ?? []).map((c) => (c as { id: string }).id))
  const localCatIds = new Set(state.categories.map((c) => c.id))
  const catsToDelete = [...dbCatIds].filter((id) => !localCatIds.has(id))
  if (catsToDelete.length > 0) {
    const { error } = await sb.from('categories').delete().in('id', catsToDelete)
    if (error) throw error
  }
  if (state.categories.length > 0) {
    const catRows = state.categories.map((c, i) => ({
      id: c.id,
      locale_slug: state.slug,
      name: c.name,
      emoji: c.emoji,
      position: i,
    }))
    const { error } = await sb.from('categories').upsert(catRows, { onConflict: 'id' })
    if (error) throw error
  }

  const { data: dbProds, error: pe } = await sb
    .from('products')
    .select('id')
    .eq('locale_slug', state.slug)
  if (pe) throw pe

  const dbProdIds = new Set((dbProds ?? []).map((p) => (p as { id: string }).id))
  const localProdIds = new Set(state.products.map((p) => p.id))
  const prodsToDelete = [...dbProdIds].filter((id) => !localProdIds.has(id))
  if (prodsToDelete.length > 0) {
    const { error } = await sb.from('products').delete().in('id', prodsToDelete)
    if (error) throw error
  }
  if (state.products.length > 0) {
    const prodRows = state.products.map((p, i) => ({
      id: p.id,
      locale_slug: state.slug,
      category_id: p.categoryId || null,
      name: p.name,
      description: p.desc,
      price: p.price,
      image_url: p.img,
      available: p.available,
      position: i,
    }))
    const { error } = await sb.from('products').upsert(prodRows, { onConflict: 'id' })
    if (error) throw error
  }
}

export async function cloudDeleteLocale(slug: string): Promise<void> {
  const sb = requireClient()
  const { error } = await sb.from('locales').delete().eq('slug', slug)
  if (error) throw error
}

export function cloudSubscribe(cb: () => void, opts?: { slug?: string }): () => void {
  const sb = requireClient()
  const slug = opts?.slug
  // Each subscriber gets its own channel — Supabase reuses channels by name and
  // disallows .on() after .subscribe(), so two components subscribing to the same
  // logical scope would crash without a unique suffix.
  const suffix = Math.random().toString(36).slice(2, 10)
  const baseName = slug ? `locale-${slug}` : 'locales-all'
  const channel = sb
    .channel(`${baseName}-${suffix}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'locales', filter: slug ? `slug=eq.${slug}` : undefined },
      cb,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories', filter: slug ? `locale_slug=eq.${slug}` : undefined },
      cb,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products', filter: slug ? `locale_slug=eq.${slug}` : undefined },
      cb,
    )
    .subscribe()
  return () => {
    sb.removeChannel(channel)
  }
}
