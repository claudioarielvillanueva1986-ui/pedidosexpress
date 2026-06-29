import { useEffect, useState } from 'react'
import { isCloudMode, supabase } from './supabase'
import { useAuth } from './auth'
import type { CustomerAddress, UserProfile, UserRole } from '../types'

export interface ProfileResult {
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

function rowToProfile(row: {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  created_at: string
}): UserProfile {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name ?? '',
    phone: row.phone ?? '',
    createdAt: new Date(row.created_at).getTime(),
  }
}

function rowToAddress(row: {
  id: string
  owner_id: string
  label: string | null
  address: string
  notes: string | null
  is_default: boolean
}): CustomerAddress {
  return {
    id: row.id,
    ownerId: row.owner_id,
    label: row.label ?? '',
    address: row.address,
    notes: row.notes ?? '',
    isDefault: row.is_default,
  }
}

export function useProfile(): ProfileResult {
  const auth = useAuth()
  const [state, setState] = useState<ProfileResult>({
    profile: null,
    loading: auth.loading,
    error: null,
  })

  useEffect(() => {
    if (!isCloudMode || !supabase) {
      setState({ profile: null, loading: false, error: null })
      return
    }
    if (auth.loading) {
      setState((s) => ({ ...s, loading: true }))
      return
    }
    if (!auth.user) {
      setState({ profile: null, loading: false, error: null })
      return
    }

    let alive = true
    const load = async () => {
      const { data, error } = await supabase!
        .from('profiles')
        .select('id, role, full_name, phone, created_at')
        .eq('id', auth.user!.id)
        .maybeSingle()

      if (!alive) return
      if (error) {
        setState({ profile: null, loading: false, error: error.message })
        return
      }
      setState({
        profile: data ? rowToProfile(data) : null,
        loading: false,
        error: null,
      })
    }
    void load()
    return () => {
      alive = false
    }
  }, [auth.user?.id, auth.loading])

  return state
}

export async function updateProfile(patch: Partial<UserProfile>): Promise<void> {
  if (!supabase) throw new Error('Cloud no configurado')
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('No hay sesión')
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userData.user.id,
      role: patch.role,
      full_name: patch.fullName,
      phone: patch.phone,
      updated_at: new Date().toISOString(),
    })
  if (error) throw error
}

export async function promoteToMerchant(): Promise<void> {
  if (!supabase) return
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('No hay sesión')
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'merchant', updated_at: new Date().toISOString() })
    .eq('id', userData.user.id)
  if (error) throw error
}

export function useCustomerAddresses(): {
  addresses: CustomerAddress[]
  loading: boolean
} {
  const auth = useAuth()
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isCloudMode || !supabase || !auth.user) {
      setAddresses([])
      setLoading(false)
      return
    }
    let alive = true
    const load = async () => {
      const { data, error } = await supabase!
        .from('customer_addresses')
        .select('id, owner_id, label, address, notes, is_default')
        .eq('owner_id', auth.user!.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
      if (!alive) return
      if (error) {
        setAddresses([])
      } else {
        setAddresses((data ?? []).map(rowToAddress))
      }
      setLoading(false)
    }
    void load()
    return () => {
      alive = false
    }
  }, [auth.user?.id])

  return { addresses, loading }
}

export async function saveCustomerAddress(
  patch: Omit<CustomerAddress, 'id' | 'ownerId'> & { id?: string },
): Promise<CustomerAddress> {
  if (!supabase) throw new Error('Cloud no configurado')
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('No hay sesión')
  const ownerId = userData.user.id

  if (patch.isDefault) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('owner_id', ownerId)
  }

  if (patch.id) {
    const { data, error } = await supabase
      .from('customer_addresses')
      .update({
        label: patch.label,
        address: patch.address,
        notes: patch.notes,
        is_default: patch.isDefault,
      })
      .eq('id', patch.id)
      .select()
      .single()
    if (error) throw error
    return rowToAddress(data)
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({
      owner_id: ownerId,
      label: patch.label,
      address: patch.address,
      notes: patch.notes,
      is_default: patch.isDefault,
    })
    .select()
    .single()
  if (error) throw error
  return rowToAddress(data)
}
