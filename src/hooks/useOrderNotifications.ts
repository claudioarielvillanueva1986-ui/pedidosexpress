import { useEffect, useRef } from 'react'
import type { Order } from '../types'
import { formatPrice } from '../utils'

interface Options {
  enabled: boolean
  soundEnabled: boolean
  localeName: string
}

/**
 * Watches the orders list and fires a browser notification + a short
 * beep whenever a NEW order appears. The very first run doesn't notify
 * (it would spam on every page load with the existing history).
 */
export function useOrderNotifications(orders: Order[], opts: Options): void {
  const { enabled, soundEnabled, localeName } = opts
  const seenRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!orders) return

    // Bootstrap: first time we see this list, just remember the IDs.
    if (seenRef.current === null) {
      seenRef.current = new Set(orders.map((o) => o.id))
      return
    }

    if (!enabled) {
      // Even if disabled, keep the "seen" set in sync so when the user
      // re-enables we don't fire a flood of notifications for old orders.
      seenRef.current = new Set(orders.map((o) => o.id))
      return
    }

    const seen = seenRef.current
    const fresh = orders.filter((o) => !seen.has(o.id))

    if (fresh.length === 0) {
      return
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      for (const o of fresh) {
        const itemsLine = o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')
        try {
          const n = new Notification(
            `Nuevo pedido · ${formatPrice(o.total)}${localeName ? ' · ' + localeName : ''}`,
            {
              body: `${o.customerName} · ${itemsLine}`,
              tag: o.id,
              renotify: false,
            } as NotificationOptions,
          )
          n.onclick = () => {
            window.focus()
            n.close()
          }
        } catch {
          /* notifications might fail silently on iOS Safari etc. */
        }
      }
    }

    if (soundEnabled) {
      playBeep()
    }

    seenRef.current = new Set(orders.map((o) => o.id))
  }, [orders, enabled, soundEnabled, localeName])
}

function playBeep(): void {
  if (typeof window === 'undefined') return
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  try {
    const ctx = new Ctor()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1175, ctx.currentTime + 0.09)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.start()
    osc.stop(ctx.currentTime + 0.36)
    osc.onended = () => {
      void ctx.close()
    }
  } catch {
    /* AudioContext can fail until user gesture — silent fallback */
  }
}
