import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isCloudMode, supabase } from './supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  cloudEnabled: boolean
}

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: isCloudMode,
    cloudEnabled: isCloudMode,
  })

  useEffect(() => {
    if (!supabase) {
      setState({ user: null, session: null, loading: false, cloudEnabled: false })
      return
    }

    let alive = true

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setState({
        user: data.session?.user ?? null,
        session: data.session ?? null,
        loading: false,
        cloudEnabled: true,
      })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
        cloudEnabled: true,
      })
    })

    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Modo cloud no configurado.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: 'Modo cloud no configurado.' }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { ...state, signIn, signUp, signOut }
}
