import { useEffect, useState } from 'react'
import { isCloudMode, supabase } from './lib/supabase'
import type { LocaleState, LocaleSummary } from './lib/storeTypes'
import {
  localCreateLocale,
  localDeleteLocale,
  localEnsureDefault,
  localListSummaries,
  localLoadLocale,
  localSaveLocale,
  localSubscribe,
  defaultLocaleState,
  slugify,
} from './lib/localStore'
import {
  cloudCreateLocale,
  cloudDeleteLocale,
  cloudListSummaries,
  cloudLoadLocale,
  cloudSaveLocale,
  cloudSubscribe,
} from './lib/cloudStore'

export { isCloudMode, slugify, defaultLocaleState }
export type { LocaleState, LocaleSummary }

interface AsyncResult<T> {
  data: T
  loading: boolean
  error: string | null
}

/**
 * Read all visible locales. In cloud mode this is the public listing
 * (anyone can read). In local mode this is the user's own browser-saved set.
 */
export function useLocaleSummaries(): AsyncResult<LocaleSummary[]> {
  const [state, setState] = useState<AsyncResult<LocaleSummary[]>>({
    data: isCloudMode ? [] : localListSummaries(),
    loading: isCloudMode,
    error: null,
  })

  useEffect(() => {
    if (!isCloudMode) {
      const refresh = () => setState({ data: localListSummaries(), loading: false, error: null })
      const unsub = localSubscribe(refresh)
      refresh()
      return unsub
    }

    let alive = true
    const refresh = async () => {
      try {
        const data = await cloudListSummaries()
        if (alive) setState({ data, loading: false, error: null })
      } catch (err) {
        if (alive) {
          setState({
            data: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Error de carga',
          })
        }
      }
    }
    refresh()
    const unsub = cloudSubscribe(refresh)
    return () => {
      alive = false
      unsub()
    }
  }, [])

  return state
}

/**
 * Load a specific locale by slug.
 */
export function useLocaleState(slug: string | null): AsyncResult<LocaleState | null> {
  const [state, setState] = useState<AsyncResult<LocaleState | null>>({
    data: !isCloudMode && slug ? localLoadLocale(slug) : null,
    loading: isCloudMode && !!slug,
    error: null,
  })

  useEffect(() => {
    if (!slug) {
      setState({ data: null, loading: false, error: null })
      return
    }

    if (!isCloudMode) {
      const refresh = () =>
        setState({ data: localLoadLocale(slug), loading: false, error: null })
      const unsub = localSubscribe(refresh)
      refresh()
      return unsub
    }

    let alive = true
    setState((s) => ({ ...s, loading: true }))
    const refresh = async () => {
      try {
        const data = await cloudLoadLocale(slug)
        if (alive) setState({ data, loading: false, error: null })
      } catch (err) {
        if (alive) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Error de carga',
          })
        }
      }
    }
    refresh()
    const unsub = cloudSubscribe(refresh, { slug })
    return () => {
      alive = false
      unsub()
    }
  }, [slug])

  return state
}

export async function createLocale(name: string): Promise<LocaleState> {
  if (!isCloudMode) return localCreateLocale(name)
  if (!supabase) throw new Error('Supabase no está configurado.')
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Hay que iniciar sesión para crear un local.')
  return cloudCreateLocale(name, data.user.id)
}

export async function saveLocale(state: LocaleState): Promise<void> {
  if (!isCloudMode) {
    localSaveLocale(state)
    return
  }
  await cloudSaveLocale(state)
}

export async function deleteLocale(slug: string): Promise<void> {
  if (!isCloudMode) {
    localDeleteLocale(slug)
    return
  }
  await cloudDeleteLocale(slug)
}

export async function ensureDefaultLocale(): Promise<string | null> {
  if (!isCloudMode) return localEnsureDefault()
  // In cloud mode we don't auto-seed — the user picks or creates from the panel.
  const list = await cloudListSummaries()
  return list[0]?.slug ?? null
}

export function loadLocaleSync(slug: string): LocaleState | null {
  if (isCloudMode) return null
  return localLoadLocale(slug)
}

export function ensureDefaultLocaleSync(): string | null {
  if (isCloudMode) return null
  return localEnsureDefault()
}

export function listLocaleSummariesSync(): LocaleSummary[] {
  if (isCloudMode) return []
  return localListSummaries()
}
