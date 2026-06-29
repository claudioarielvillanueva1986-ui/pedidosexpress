import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocaleState } from './store'
import type { LocaleState } from './store'
import { navigate } from './router'
import { formatPrice } from './utils'
import type { Product } from './types'

type ViewMode = 'cart' | 'checkout'
type DeliveryMethod = 'delivery' | 'pickup'
type PaymentMethod = 'cash' | 'mp'

interface CartState {
  [productId: string]: number
}

interface FormState {
  name: string
  phone: string
  address: string
  notes: string
  deliveryMethod: DeliveryMethod
  paymentMethod: PaymentMethod
}

interface FormErrors {
  name?: boolean
  phone?: boolean
  address?: boolean
}

interface CustomerViewProps {
  slug: string
}

export function CustomerView({ slug }: CustomerViewProps) {
  const store = useLocaleState(slug)
  if (!store) {
    return <MissingLocaleScreen slug={slug} />
  }
  return <CustomerViewInner store={store} />
}

function MissingLocaleScreen({ slug }: { slug: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF6F2',
        color: '#1A1410',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 56, marginBottom: 10 }}>🏪</div>
      <h1
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: 24,
          margin: '0 0 6px',
        }}
      >
        No encontramos ese local
      </h1>
      <p style={{ color: '#7A6E66', maxWidth: 380, margin: '0 0 18px', lineHeight: 1.5 }}>
        El link <code>/{slug}</code> no corresponde a ningún local cargado. Tal vez fue dado de
        baja o el link está mal escrito.
      </p>
      <button
        onClick={() => navigate({ kind: 'landing' })}
        style={{
          background: '#1A1410',
          color: 'white',
          border: 'none',
          padding: '11px 18px',
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 13.5,
          cursor: 'pointer',
        }}
      >
        Ver todos los locales
      </button>
    </div>
  )
}

function CustomerViewInner({ store }: { store: LocaleState }) {

  const availableProducts = useMemo(
    () => store.products.filter((p) => p.available),
    [store.products],
  )
  const categoriesWithItems = useMemo(
    () => store.categories.filter((c) => availableProducts.some((p) => p.categoryId === c.id)),
    [store.categories, availableProducts],
  )

  const [activeCategory, setActiveCategory] = useState<string>(
    categoriesWithItems[0]?.id ?? store.categories[0]?.id ?? '',
  )

  useEffect(() => {
    if (!categoriesWithItems.find((c) => c.id === activeCategory)) {
      setActiveCategory(categoriesWithItems[0]?.id ?? '')
    }
  }, [categoriesWithItems, activeCategory])

  const [cart, setCart] = useState<CartState>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [view, setView] = useState<ViewMode>('cart')
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    address: '',
    notes: '',
    deliveryMethod: store.shipping.deliveryEnabled ? 'delivery' : 'pickup',
    paymentMethod: store.payments.cashEnabled ? 'cash' : 'mp',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1600)
  }

  const findProduct = (id: string): Product | undefined =>
    store.products.find((p) => p.id === id)

  const addToCart = (id: string) => {
    const item = findProduct(id)
    if (!item) return
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
    showToast('Agregado: ' + item.name)
  }

  const setQty = (id: string, qty: number) => {
    setCart((c) => {
      const next = { ...c }
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })
  }

  const clearCart = () => setCart({})

  const updateForm = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }))
    setErrors({})
  }

  const cartEntries = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const p = findProduct(id)
      if (!p) return null
      return { id, name: p.name, img: p.img, price: p.price, qty }
    })
    .filter((x): x is { id: string; name: string; img: string; price: number; qty: number } =>
      Boolean(x),
    )

  const itemCount = cartEntries.reduce((a, e) => a + e.qty, 0)
  const subtotal = cartEntries.reduce((a, e) => a + e.price * e.qty, 0)
  const isDelivery = form.deliveryMethod === 'delivery'
  const deliveryFee =
    isDelivery && store.shipping.deliveryEnabled
      ? Number(store.shipping.cost) || 0
      : 0
  const freeFrom = Number(store.shipping.freeFrom) || 0
  const effectiveDeliveryFee = freeFrom > 0 && subtotal >= freeFrom ? 0 : deliveryFee
  const total = subtotal + effectiveDeliveryFee

  const isCart = view === 'cart'
  const isCheckout = view === 'checkout'
  const isCash = form.paymentMethod === 'cash'
  const isMP = form.paymentMethod === 'mp'

  const items = availableProducts.filter((p) => p.categoryId === activeCategory)

  const validate = (): FormErrors => {
    const e: FormErrors = {}
    if (!form.name.trim()) e.name = true
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 6) e.phone = true
    if (isDelivery && !form.address.trim()) e.address = true
    return e
  }

  const buildMessage = () => {
    const lines: string[] = []
    lines.push('🍔 *NUEVO PEDIDO*')
    lines.push('━━━━━━━━━━━━━━')
    lines.push('')
    lines.push('👤 *Cliente:* ' + form.name)
    lines.push('📞 *Teléfono:* ' + form.phone)
    if (isDelivery) {
      lines.push('🛵 *Modalidad:* Delivery')
      lines.push('📍 *Dirección:* ' + form.address)
    } else {
      lines.push('🏪 *Modalidad:* Retiro en local')
    }
    if (form.notes.trim()) lines.push('📝 *Notas:* ' + form.notes.trim())
    lines.push('')
    lines.push('🛒 *DETALLE DEL PEDIDO*')
    cartEntries.forEach((e) => {
      lines.push('• ' + e.qty + 'x ' + e.name + ' — ' + formatPrice(e.price * e.qty))
    })
    lines.push('')
    lines.push('💰 *Subtotal:* ' + formatPrice(subtotal))
    if (effectiveDeliveryFee > 0) {
      lines.push('🛵 *Envío:* ' + formatPrice(effectiveDeliveryFee))
    } else if (deliveryFee > 0 && isDelivery) {
      lines.push('🛵 *Envío:* Gratis')
    }
    lines.push('💵 *TOTAL: ' + formatPrice(total) + '*')
    lines.push('')
    if (isCash) {
      lines.push('💳 *Pago:* Efectivo (al recibir)')
    } else {
      lines.push('💳 *Pago:* Transferencia / Pago digital')
      if (store.payments.alias) lines.push('Alias: ' + store.payments.alias)
      if (store.payments.cbu) lines.push('CBU: ' + store.payments.cbu)
    }
    lines.push('')
    lines.push('¡Gracias! 🙌')
    return lines.join('\n')
  }

  const submitOrder = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      showToast('Completá los campos requeridos')
      return
    }
    const number = (store.local.whatsapp || '5491100000000').replace(/\D/g, '')
    const text = encodeURIComponent(buildMessage())
    window.open(`https://wa.me/${number}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  // ----- styles
  const catStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 14px',
    borderRadius: 999,
    border: '1px solid ' + (active ? 'transparent' : 'rgba(26, 20, 16, 0.1)'),
    background: active ? '#1A1410' : 'white',
    color: active ? 'white' : '#1A1410',
    fontWeight: 600,
    fontSize: 13.5,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 150ms ease',
  })

  const modeButtonStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'white' : 'rgba(255, 255, 255, 0.5)',
    border: '2px solid ' + (active ? '#E54B2A' : 'rgba(26, 20, 16, 0.08)'),
    borderRadius: 14,
    padding: '14px 10px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 160ms ease',
    boxShadow: active ? '0 6px 16px rgba(229, 75, 42, 0.18)' : 'none',
  })

  const payButtonStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'white' : 'rgba(255, 255, 255, 0.5)',
    border: '2px solid ' + (active ? '#E54B2A' : 'rgba(26, 20, 16, 0.08)'),
    borderRadius: 14,
    padding: '12px 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    transition: 'all 160ms ease',
    boxShadow: active ? '0 6px 16px rgba(229, 75, 42, 0.18)' : 'none',
  })

  const radioDotStyle = (active: boolean): React.CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '2px solid ' + (active ? '#E54B2A' : 'rgba(26, 20, 16, 0.2)'),
    background: active
      ? 'radial-gradient(circle, #E54B2A 0%, #E54B2A 50%, white 55%)'
      : 'white',
    flexShrink: 0,
    transition: 'all 150ms ease',
  })

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '11px 13px',
    borderRadius: 12,
    border: '1px solid ' + (hasError ? '#E54B2A' : 'rgba(26, 20, 16, 0.12)'),
    background: 'white',
    fontSize: 14,
    color: '#1A1410',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F2', color: '#1A1410' }}>
      {/* HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(250, 246, 242, 0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(26, 20, 16, 0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #E54B2A, #F0823A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                boxShadow: '0 6px 16px rgba(229, 75, 42, 0.32)',
              }}
            >
              {store.local.logo || '🔥'}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                Pedido Express
              </div>
              <div style={{ fontSize: 11, color: '#7A6E66', marginTop: 3, letterSpacing: '0.02em' }}>
                Pedí, recibí, disfrutá
              </div>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              position: 'relative',
              background: '#1A1410',
              color: 'white',
              border: 'none',
              padding: '9px 14px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'transform 150ms ease, background 150ms ease',
            }}
          >
            <span style={{ fontSize: 15 }}>🛒</span>
            <span>Carrito</span>
            {itemCount > 0 ? (
              <span
                style={{
                  background: '#E54B2A',
                  color: 'white',
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  padding: '0 6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 18px 8px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: store.localOpen ? 'rgba(229, 75, 42, 0.1)' : 'rgba(26, 20, 16, 0.06)',
            color: store.localOpen ? '#C03A1E' : '#7A6E66',
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: store.localOpen ? '#22C55E' : '#94918D',
            }}
          />
          <span>
            {store.localOpen
              ? `Abierto ahora · entrega en ${store.shipping.etaDelivery || '~25 min'}`
              : 'Cerrado · podés mirar el menú'}
          </span>
        </div>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(34px, 7vw, 60px)',
            lineHeight: 1,
            margin: '0 0 14px',
            letterSpacing: '-0.025em',
          }}
        >
          {store.local.slogan.split(',')[0]},
          <br />
          <span style={{ color: '#E54B2A', fontStyle: 'italic' }}>
            {store.local.slogan.split(',').slice(1).join(',').trim() || '¡llegamos rápido!'}
          </span>
        </h1>
        <p
          style={{
            fontSize: 15.5,
            color: '#7A6E66',
            maxWidth: 520,
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          Pedís desde acá y los pedidos llegan directo por WhatsApp a {store.local.name}.
        </p>
      </section>

      {/* CATEGORY TABS */}
      <nav
        style={{
          position: 'sticky',
          top: 67,
          zIndex: 40,
          background: 'rgba(250, 246, 242, 0.9)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          padding: '14px 0 12px',
          marginTop: 24,
        }}
      >
        <div
          className="pa-scroll-x"
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 18px',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
          }}
        >
          {categoriesWithItems.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={catStyle(cat.id === activeCategory)}
            >
              <span style={{ fontSize: 16 }}>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MENU GRID */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 18px 120px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: 12,
          }}
        >
          {items.map((item) => {
            const qty = cart[item.id] || 0
            return (
              <article
                key={item.id}
                style={{
                  background: 'white',
                  borderRadius: 20,
                  padding: 14,
                  display: 'grid',
                  gridTemplateColumns: '108px 1fr',
                  gap: 14,
                  alignItems: 'stretch',
                  boxShadow:
                    '0 1px 2px rgba(26, 20, 16, 0.04), 0 8px 24px -16px rgba(26, 20, 16, 0.1)',
                  transition: 'transform 200ms ease, box-shadow 200ms ease',
                }}
              >
                <div
                  style={{
                    width: 108,
                    height: 108,
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: '#EEE7E0',
                    position: 'relative',
                  }}
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {qty > 0 ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: '#E54B2A',
                        color: 'white',
                        minWidth: 24,
                        height: 24,
                        borderRadius: 12,
                        padding: '0 7px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: '0 4px 10px rgba(229, 75, 42, 0.4)',
                      }}
                    >
                      {qty}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <h3
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontWeight: 700,
                      fontSize: 16.5,
                      margin: 0,
                      lineHeight: 1.2,
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {item.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: '#7A6E66',
                      margin: 0,
                      lineHeight: 1.4,
                      flex: 1,
                    }}
                  >
                    {item.desc}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontWeight: 700,
                        fontSize: 17,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {formatPrice(item.price)}
                    </div>
                    <button
                      onClick={() => addToCart(item.id)}
                      disabled={!store.localOpen}
                      style={{
                        background: store.localOpen ? '#1A1410' : 'rgba(26, 20, 16, 0.3)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 13px',
                        borderRadius: 999,
                        fontWeight: 600,
                        fontSize: 12.5,
                        cursor: store.localOpen ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'transform 120ms ease, background 150ms ease',
                      }}
                    >
                      <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7A6E66' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🍽</div>
            <p>No hay productos disponibles en esta categoría.</p>
          </div>
        ) : null}
      </section>

      {/* FLOATING CART BAR */}
      {itemCount > 0 ? (
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            position: 'fixed',
            bottom: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#E54B2A',
            color: 'white',
            border: 'none',
            padding: '13px 18px 13px 22px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            boxShadow:
              '0 12px 32px rgba(229, 75, 42, 0.45), 0 4px 10px rgba(229, 75, 42, 0.25)',
            zIndex: 30,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.22)',
                minWidth: 24,
                height: 24,
                borderRadius: 12,
                padding: '0 7px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {itemCount}
            </span>
            <span>Ver carrito</span>
          </span>
          <span style={{ opacity: 0.7 }}>·</span>
          <span
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              lineHeight: 1.1,
            }}
          >
            <span
              style={{
                fontSize: 9.5,
                opacity: 0.75,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {effectiveDeliveryFee > 0 ? 'Total con envío' : 'Total'}
            </span>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700 }}>
              {formatPrice(total)}
            </span>
          </span>
          <span style={{ opacity: 0.8, fontSize: 16, marginLeft: 2 }}>→</span>
        </button>
      ) : null}

      {/* DRAWER OVERLAY */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26, 20, 16, 0.5)',
          zIndex: 60,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 260ms ease',
        }}
      />

      {/* DRAWER PANEL */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(440px, 100vw)',
          background: '#FAF6F2',
          zIndex: 70,
          display: 'flex',
          flexDirection: 'column',
          transform: `translateX(${drawerOpen ? '0%' : '100%'})`,
          transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px 14px',
            borderBottom: '1px solid rgba(26, 20, 16, 0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isCheckout ? (
              <button
                onClick={() => setView('cart')}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'white',
                  border: '1px solid rgba(26, 20, 16, 0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ←
              </button>
            ) : null}
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: 20,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {isCheckout ? 'Tu pedido' : 'Carrito'}
            </h2>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'white',
              border: '1px solid rgba(26, 20, 16, 0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
              color: '#1A1410',
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer body */}
        <div className="pa-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {/* CART VIEW */}
          {isCart ? (
            <div style={{ padding: '18px 20px 20px' }}>
              {itemCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px 32px' }}>
                  <div style={{ fontSize: 56, marginBottom: 10 }}>🛒</div>
                  <h3
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontWeight: 700,
                      fontSize: 20,
                      margin: '0 0 6px',
                    }}
                  >
                    Tu carrito está vacío
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#7A6E66',
                      margin: '0 0 20px',
                      lineHeight: 1.5,
                    }}
                  >
                    Sumá algo rico del menú y vení para acá.
                  </p>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      background: '#1A1410',
                      color: 'white',
                      border: 'none',
                      padding: '11px 18px',
                      borderRadius: 999,
                      fontWeight: 600,
                      fontSize: 13.5,
                      cursor: 'pointer',
                    }}
                  >
                    Ver el menú
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cartEntries.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          background: 'white',
                          borderRadius: 16,
                          padding: 12,
                          display: 'grid',
                          gridTemplateColumns: '64px 1fr auto',
                          gap: 12,
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 12,
                            overflow: 'hidden',
                            background: '#EEE7E0',
                          }}
                        >
                          <img
                            src={entry.img}
                            alt={entry.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "'Bricolage Grotesque', sans-serif",
                              fontWeight: 700,
                              fontSize: 14.5,
                              lineHeight: 1.2,
                              marginBottom: 4,
                            }}
                          >
                            {entry.name}
                          </div>
                          <div style={{ fontSize: 12.5, color: '#7A6E66', fontWeight: 500 }}>
                            {formatPrice(entry.price)} c/u
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0,
                              background: '#F0EAE3',
                              borderRadius: 999,
                              padding: 3,
                            }}
                          >
                            <button
                              onClick={() => setQty(entry.id, entry.qty - 1)}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 600,
                                color: '#1A1410',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                minWidth: 26,
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: 13.5,
                              }}
                            >
                              {entry.qty}
                            </span>
                            <button
                              onClick={() => setQty(entry.id, entry.qty + 1)}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 600,
                                color: '#1A1410',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              +
                            </button>
                          </div>
                          <div
                            style={{
                              fontFamily: "'Bricolage Grotesque', sans-serif",
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {formatPrice(entry.price * entry.qty)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={clearCart}
                    style={{
                      marginTop: 14,
                      background: 'none',
                      border: 'none',
                      color: '#7A6E66',
                      fontSize: 12.5,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: '4px 0',
                    }}
                  >
                    Vaciar carrito
                  </button>
                </>
              )}
            </div>
          ) : null}

          {/* CHECKOUT VIEW */}
          {isCheckout ? (
            <div
              style={{
                padding: '18px 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {/* Modalidad */}
              <div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#7A6E66',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 8,
                  }}
                >
                  Modalidad
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {store.shipping.deliveryEnabled ? (
                    <button
                      onClick={() => updateForm({ deliveryMethod: 'delivery' })}
                      style={modeButtonStyle(isDelivery)}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>🛵</div>
                      <div
                        style={{
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        Delivery
                      </div>
                      <div style={{ fontSize: 11, color: '#7A6E66', marginTop: 2 }}>
                        {store.shipping.etaDelivery}
                      </div>
                    </button>
                  ) : null}
                  {store.shipping.pickupEnabled ? (
                    <button
                      onClick={() => updateForm({ deliveryMethod: 'pickup' })}
                      style={modeButtonStyle(!isDelivery)}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>🏪</div>
                      <div
                        style={{
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        Retiro
                      </div>
                      <div style={{ fontSize: 11, color: '#7A6E66', marginTop: 2 }}>
                        {store.shipping.etaPickup}
                      </div>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Datos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#7A6E66',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Tus datos
                </div>

                <label style={{ display: 'block' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      fontWeight: 600,
                      marginBottom: 5,
                      color: '#1A1410',
                    }}
                  >
                    Nombre <span style={{ color: '#E54B2A' }}>*</span>
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    placeholder="Ej: Juliana Pérez"
                    style={inputStyle(!!errors.name)}
                  />
                  {errors.name ? (
                    <span
                      style={{
                        display: 'block',
                        color: '#C03A1E',
                        fontSize: 11.5,
                        marginTop: 4,
                      }}
                    >
                      Por favor, ingresá tu nombre.
                    </span>
                  ) : null}
                </label>

                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>
                    Teléfono <span style={{ color: '#E54B2A' }}>*</span>
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    placeholder="Ej: 11 5555 1234"
                    style={inputStyle(!!errors.phone)}
                  />
                  {errors.phone ? (
                    <span
                      style={{
                        display: 'block',
                        color: '#C03A1E',
                        fontSize: 11.5,
                        marginTop: 4,
                      }}
                    >
                      Necesitamos un teléfono válido.
                    </span>
                  ) : null}
                </label>

                {isDelivery ? (
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>
                      Dirección de entrega <span style={{ color: '#E54B2A' }}>*</span>
                    </span>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateForm({ address: e.target.value })}
                      placeholder="Calle, número, piso/depto, barrio"
                      style={inputStyle(!!errors.address)}
                    />
                    {errors.address ? (
                      <span
                        style={{
                          display: 'block',
                          color: '#C03A1E',
                          fontSize: 11.5,
                          marginTop: 4,
                        }}
                      >
                        Necesitamos una dirección para el envío.
                      </span>
                    ) : null}
                  </label>
                ) : null}

                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>
                    Notas adicionales
                  </span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateForm({ notes: e.target.value })}
                    placeholder="Ej: sin cebolla, timbre roto, dejar con el portero…"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      borderRadius: 12,
                      border: '1px solid rgba(26, 20, 16, 0.12)',
                      background: 'white',
                      fontSize: 14,
                      color: '#1A1410',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: 64,
                    }}
                  />
                </label>
              </div>

              {/* Pago */}
              <div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#7A6E66',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 8,
                  }}
                >
                  Método de pago
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {store.payments.cashEnabled ? (
                    <button
                      onClick={() => updateForm({ paymentMethod: 'cash' })}
                      style={payButtonStyle(isCash)}
                    >
                      <div style={{ fontSize: 22 }}>💵</div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div
                          style={{
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          Efectivo
                        </div>
                        <div style={{ fontSize: 11.5, color: '#7A6E66', marginTop: 1 }}>
                          Pagás al recibir el pedido
                        </div>
                      </div>
                      <div style={radioDotStyle(isCash)} />
                    </button>
                  ) : null}
                  {store.payments.transferEnabled ? (
                    <button
                      onClick={() => updateForm({ paymentMethod: 'mp' })}
                      style={payButtonStyle(isMP)}
                    >
                      <div style={{ fontSize: 22 }}>💳</div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div
                          style={{
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          Transferencia / Pago digital
                        </div>
                        <div style={{ fontSize: 11.5, color: '#7A6E66', marginTop: 1 }}>
                          Vía link o Alias/CBU
                        </div>
                      </div>
                      <div style={radioDotStyle(isMP)} />
                    </button>
                  ) : null}
                </div>

                {isMP ? (
                  <div
                    style={{
                      marginTop: 12,
                      background:
                        'linear-gradient(135deg, rgba(0, 158, 227, 0.08), rgba(0, 158, 227, 0.03))',
                      border: '1px solid rgba(0, 158, 227, 0.2)',
                      borderRadius: 14,
                      padding: 14,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ fontSize: 22, flexShrink: 0 }}>💬</div>
                    <div style={{ fontSize: 12.5, color: '#1A1410', lineHeight: 1.55 }}>
                      {store.payments.message ||
                        'Te enviaremos el link de pago o Alias/CBU por WhatsApp para que realices tu transferencia.'}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Resumen */}
              <div
                style={{
                  background: 'white',
                  borderRadius: 14,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#7A6E66',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 2,
                  }}
                >
                  Resumen
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#7A6E66' }}>Subtotal ({itemCount} items)</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span>
                </div>
                {isDelivery && deliveryFee > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#7A6E66' }}>Envío</span>
                    <span style={{ fontWeight: 600 }}>
                      {effectiveDeliveryFee === 0
                        ? 'Gratis 🎉'
                        : formatPrice(effectiveDeliveryFee)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Drawer footer */}
        {itemCount > 0 ? (
          <div
            style={{
              borderTop: '1px solid rgba(26, 20, 16, 0.06)',
              padding: '14px 20px 18px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 13, color: '#7A6E66', fontWeight: 600 }}>
                {effectiveDeliveryFee > 0 ? 'Total con envío' : 'Total'}
              </span>
              <span
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 800,
                  fontSize: 30,
                  letterSpacing: '-0.025em',
                  color: '#1A1410',
                }}
              >
                {formatPrice(total)}
              </span>
            </div>
            {isCheckout && effectiveDeliveryFee > 0 ? (
              <div style={{ fontSize: 11.5, color: '#7A6E66', marginBottom: 12, textAlign: 'right' }}>
                Subtotal {formatPrice(subtotal)} + envío {formatPrice(effectiveDeliveryFee)}
              </div>
            ) : (
              <div style={{ marginBottom: 12 }} />
            )}

            {isCart ? (
              <button
                onClick={() => setView('checkout')}
                disabled={!store.localOpen}
                style={{
                  width: '100%',
                  background: store.localOpen ? '#1A1410' : 'rgba(26, 20, 16, 0.3)',
                  color: 'white',
                  border: 'none',
                  padding: 14,
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14.5,
                  cursor: store.localOpen ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 150ms ease',
                }}
              >
                <span>
                  {store.localOpen ? 'Continuar al checkout' : 'Local cerrado'}
                </span>
                {store.localOpen ? <span>→</span> : null}
              </button>
            ) : null}

            {isCheckout ? (
              <>
                <button
                  onClick={submitOrder}
                  style={{
                    width: '100%',
                    background: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: 14,
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 14.5,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: '0 8px 20px rgba(37, 211, 102, 0.35)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.7-1.6-1.9-.2-.3 0-.4.1-.5.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.9-2.1-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.9L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
                  </svg>
                  <span>Confirmar pedido por WhatsApp</span>
                </button>
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 11,
                    color: '#7A6E66',
                    marginTop: 8,
                    lineHeight: 1.4,
                  }}
                >
                  Te abriremos WhatsApp con el pedido listo para enviar.
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </aside>

      {/* TOAST */}
      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1A1410',
            color: 'white',
            padding: '10px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 80,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            animation: 'pa-toast-in 220ms ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>✓</span>
          <span>{toast}</span>
        </div>
      ) : null}
    </div>
  )
}
