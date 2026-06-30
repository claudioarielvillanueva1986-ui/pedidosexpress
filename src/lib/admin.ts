import { useEffect, useState } from 'react'
import { requireClient, supabase } from './supabase'
import type { LocaleStatus, UserProfile, UserRole } from '../types'

export interface AdminLocaleRow {
  slug: string
  name: string
  logo: string
  primaryColor: string
  ownerId: string
  ownerEmail: string | null
  ownerName: string
  status: LocaleStatus
  whatsapp: string
  createdAt: number
  productCount: number
  orderCount: number
}

export interface AdminUserRow {
  id: string
  email: string | null
  role: UserRole
  fullName: string
  phone: string
  createdAt: number
  localeCount: number
}

interface DbLocaleAdmin {
  slug: string
  name: string
  logo: string | null
  primary_color: string | null
  owner_id: string
  status: LocaleStatus | null
  whatsapp: string | null
  created_at: string
}

interface DbProfileAdmin {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  created_at: string
}

export async function listAllLocalesAdmin(): Promise<AdminLocaleRow[]> {
  const sb = requireClient()

  // Get all locales (admin RLS lets us see everything)
  const { data: locales, error } = await sb
    .from('locales')
    .select('slug,name,logo,primary_color,owner_id,status,whatsapp,created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (locales ?? []) as DbLocaleAdmin[]
  if (rows.length === 0) return []

  const ownerIds = [...new Set(rows.map((r) => r.owner_id))]
  const slugs = rows.map((r) => r.slug)

  const [profilesQ, productCountsQ, orderCountsQ] = await Promise.all([
    sb.from('profiles').select('id,full_name,phone').in('id', ownerIds),
    sb.from('products').select('locale_slug').in('locale_slug', slugs),
    sb.from('orders').select('locale_slug').in('locale_slug', slugs),
  ])
  if (profilesQ.error) throw profilesQ.error
  if (productCountsQ.error) throw productCountsQ.error
  if (orderCountsQ.error) throw orderCountsQ.error

  const profileById = new Map<string, { full_name: string | null; phone: string | null }>()
  ;(profilesQ.data ?? []).forEach((p) => profileById.set(p.id as string, p as never))

  const productCount: Record<string, number> = {}
  for (const p of productCountsQ.data ?? []) {
    const k = (p as { locale_slug: string }).locale_slug
    productCount[k] = (productCount[k] ?? 0) + 1
  }
  const orderCount: Record<string, number> = {}
  for (const o of orderCountsQ.data ?? []) {
    const k = (o as { locale_slug: string }).locale_slug
    orderCount[k] = (orderCount[k] ?? 0) + 1
  }

  // Auth users emails are not directly readable; we leave email null
  // unless the profile keeps it (we don't store it today). Future: link.
  return rows.map((r) => {
    const prof = profileById.get(r.owner_id)
    return {
      slug: r.slug,
      name: r.name,
      logo: r.logo ?? '🔥',
      primaryColor: r.primary_color ?? '#E54B2A',
      ownerId: r.owner_id,
      ownerEmail: null,
      ownerName: prof?.full_name ?? '',
      status: (r.status ?? 'pending_review') as LocaleStatus,
      whatsapp: r.whatsapp ?? '',
      createdAt: new Date(r.created_at).getTime(),
      productCount: productCount[r.slug] ?? 0,
      orderCount: orderCount[r.slug] ?? 0,
    }
  })
}

export async function setLocaleStatus(slug: string, status: LocaleStatus): Promise<void> {
  const sb = requireClient()
  const { error } = await sb
    .from('locales')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('slug', slug)
  if (error) throw error
}

export async function adminDeleteLocale(slug: string): Promise<void> {
  const sb = requireClient()
  const { error } = await sb.from('locales').delete().eq('slug', slug)
  if (error) throw error
}

export async function listAllUsersAdmin(): Promise<AdminUserRow[]> {
  const sb = requireClient()
  const { data: profiles, error } = await sb
    .from('profiles')
    .select('id,role,full_name,phone,created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (profiles ?? []) as DbProfileAdmin[]
  if (rows.length === 0) return []

  const { data: localeCounts } = await sb.from('locales').select('owner_id')
  const countByOwner: Record<string, number> = {}
  for (const l of localeCounts ?? []) {
    const k = (l as { owner_id: string }).owner_id
    countByOwner[k] = (countByOwner[k] ?? 0) + 1
  }

  return rows.map((p) => ({
    id: p.id,
    email: null,
    role: p.role,
    fullName: p.full_name ?? '',
    phone: p.phone ?? '',
    createdAt: new Date(p.created_at).getTime(),
    localeCount: countByOwner[p.id] ?? 0,
  }))
}

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const sb = requireClient()
  const { error } = await sb
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

/**
 * Hook that returns true only when the current authenticated user has
 * the admin role.
 */
export function useIsAdmin(profile: UserProfile | null): boolean {
  return profile?.role === 'admin'
}

/**
 * Hook to subscribe to changes on the locales table so the admin panel
 * reflects new submissions in realtime.
 */
export function useAdminLocalesRealtime(onChange: () => void): void {
  useEffect(() => {
    if (!supabase) return
    const suffix = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`admin-locales-${suffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locales' },
        onChange,
      )
      .subscribe()
    return () => {
      supabase?.removeChannel(channel)
    }
  }, [onChange])
}

export function useAdminLocales(): {
  data: AdminLocaleRow[]
  loading: boolean
  error: string | null
  reload: () => void
} {
  const [state, setState] = useState<{
    data: AdminLocaleRow[]
    loading: boolean
    error: string | null
  }>({ data: [], loading: true, error: null })

  const reload = () => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    listAllLocalesAdmin()
      .then((rows) => {
        if (alive) setState({ data: rows, loading: false, error: null })
      })
      .catch((err) => {
        if (alive)
          setState({
            data: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Error',
          })
      })
    return () => {
      alive = false
    }
  }

  useEffect(() => {
    return reload()
  }, [])

  useAdminLocalesRealtime(reload)

  return { ...state, reload }
}
