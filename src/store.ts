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

const STORAGE_KEY = 'pedidoExpress.adminState.v1'

export interface PersistedState {
  categories: Category[]
  products: Product[]
  local: LocalConfig
  schedule: ScheduleDay[]
  payments: PaymentsConfig
  shipping: ShippingConfig
  localOpen: boolean
}

export const DEFAULT_PERSISTED_STATE: PersistedState = {
  categories: INITIAL_CATEGORIES,
  products: INITIAL_PRODUCTS,
  local: INITIAL_LOCAL,
  schedule: INITIAL_SCHEDULE,
  payments: INITIAL_PAYMENTS,
  shipping: INITIAL_SHIPPING,
  localOpen: true,
}

export function loadPersistedState(): PersistedState {
  if (typeof window === 'undefined') return DEFAULT_PERSISTED_STATE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PERSISTED_STATE
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return { ...DEFAULT_PERSISTED_STATE, ...parsed }
  } catch {
    return DEFAULT_PERSISTED_STATE
  }
}

export function savePersistedState(state: PersistedState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    window.dispatchEvent(new Event('pedidoExpress.stateChanged'))
  } catch {
    /* ignore */
  }
}

export function usePersistedState(): PersistedState {
  const [state, setState] = useState<PersistedState>(loadPersistedState)
  useEffect(() => {
    const onChange = () => setState(loadPersistedState())
    window.addEventListener('storage', onChange)
    window.addEventListener('pedidoExpress.stateChanged', onChange)
    return () => {
      window.removeEventListener('storage', onChange)
      window.removeEventListener('pedidoExpress.stateChanged', onChange)
    }
  }, [])
  return state
}
