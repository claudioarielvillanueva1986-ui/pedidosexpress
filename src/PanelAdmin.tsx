import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  LocalConfig,
  PaymentsConfig,
  ProductDraft,
  SectionId,
  ShippingConfig,
} from './types'
import { NAV } from './data'
import {
  createLocale,
  deleteLocale,
  ensureDefaultLocale,
  isCloudMode,
  saveLocale,
  useLocaleState,
  useLocaleSummaries,
} from './store'
import type { LocaleState } from './store'
import { useIsMobile } from './hooks/useMediaQuery'
import { useAuth } from './lib/auth'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Toast } from './components/Toast'
import { ProductDrawer } from './components/ProductDrawer'
import { AuthScreen } from './components/AuthScreen'
import { QrModal } from './components/QrModal'
import { InicioSection } from './sections/InicioSection'
import { MenuSection } from './sections/MenuSection'
import { LocalSection } from './sections/LocalSection'
import { PagosSection } from './sections/PagosSection'
import { EnvioSection } from './sections/EnvioSection'
import { PedidosSection } from './sections/PedidosSection'
import { ReportesSection } from './sections/ReportesSection'
import { useOrders } from './lib/ordersStore'
import { useOrderNotifications } from './hooks/useOrderNotifications'
import { loadNotificationPrefs } from './components/NotificationBanner'
import { buildUrl, navigate } from './router'

const EMPTY_DRAFT_IMG =
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&auto=format&fit=crop'

interface PanelAdminProps {
  slug: string | null
}

export function PanelAdmin({ slug }: PanelAdminProps) {
  const isMobile = useIsMobile()
  const auth = useAuth()

  // Auth gate in cloud mode
  if (auth.cloudEnabled && auth.loading) {
    return <FullScreenLoader text="Cargando…" />
  }
  if (auth.cloudEnabled && !auth.user) {
    return <AuthScreen />
  }

  return <PanelAdminResolver slug={slug} isMobile={isMobile} />
}

interface ResolverProps {
  slug: string | null
  isMobile: boolean
}

function PanelAdminResolver({ slug, isMobile }: ResolverProps) {
  const summaries = useLocaleSummaries()
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(slug)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    if (slug) {
      setResolvedSlug(slug)
      return
    }
    if (summaries.loading) return

    if (summaries.data.length > 0) {
      const first = summaries.data[0].slug
      setResolvedSlug(first)
      navigate({ kind: 'admin', slug: first })
    } else if (!isCloudMode) {
      ensureDefaultLocale().then((s) => {
        if (s) {
          setResolvedSlug(s)
          navigate({ kind: 'admin', slug: s })
        }
      })
    }
  }, [slug, summaries.loading, summaries.data])

  if (summaries.loading) {
    return <FullScreenLoader text="Cargando locales…" />
  }

  if (!resolvedSlug && summaries.data.length === 0) {
    return (
      <NoLocalesScreen
        isMobile={isMobile}
        seeding={seeding}
        onCreate={async (name) => {
          setSeeding(true)
          try {
            const created = await createLocale(name)
            navigate({ kind: 'admin', slug: created.slug })
          } catch (err) {
            window.alert(
              err instanceof Error ? err.message : 'No pudimos crear el local. Reintentá.',
            )
          } finally {
            setSeeding(false)
          }
        }}
      />
    )
  }

  if (!resolvedSlug) return <FullScreenLoader text="Resolviendo local…" />

  return <PanelAdminLoader slug={resolvedSlug} isMobile={isMobile} />
}

function PanelAdminLoader({ slug, isMobile }: { slug: string; isMobile: boolean }) {
  const localeQ = useLocaleState(slug)

  if (localeQ.loading) return <FullScreenLoader text="Cargando local…" />
  if (localeQ.error) return <FullScreenLoader text={`Error: ${localeQ.error}`} />
  if (!localeQ.data) return <MissingLocaleScreen slug={slug} />

  return <PanelAdminInner initialLocale={localeQ.data} isMobile={isMobile} />
}

function FullScreenLoader({ text }: { text: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F2EE',
        color: '#7A6E66',
        fontSize: 14,
      }}
    >
      {text}
    </div>
  )
}

function MissingLocaleScreen({ slug }: { slug: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F2EE',
        color: '#1A1410',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
      <h1
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: 24,
          margin: '0 0 8px',
        }}
      >
        Ese local no existe
      </h1>
      <p style={{ color: '#7A6E66', maxWidth: 380, margin: '0 0 18px', lineHeight: 1.5 }}>
        No encontramos un local con el identificador <code>{slug}</code>.
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
        Volver al inicio
      </button>
    </div>
  )
}

function NoLocalesScreen({
  isMobile,
  seeding,
  onCreate,
}: {
  isMobile: boolean
  seeding: boolean
  onCreate: (name: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const { signOut } = useAuth()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F2EE',
        color: '#1A1410',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'white',
          borderRadius: 18,
          padding: isMobile ? 22 : 32,
          boxShadow:
            '0 1px 2px rgba(26, 20, 16, 0.04), 0 20px 50px -20px rgba(26, 20, 16, 0.25)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 10 }}>🏪</div>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            margin: '0 0 6px',
            letterSpacing: '-0.015em',
          }}
        >
          Creá tu primer local
        </h1>
        <p style={{ fontSize: 13.5, color: '#7A6E66', margin: '0 0 18px', lineHeight: 1.5 }}>
          Poné el nombre del local para empezar. Después podés sumar más desde el panel.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = name.trim()
            if (!trimmed) return
            void onCreate(trimmed)
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="Ej: Hamburguesería La Esquina"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(26, 20, 16, 0.14)',
              fontSize: 14.5,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={seeding || !name.trim()}
            style={{
              background: seeding || !name.trim() ? 'rgba(26, 20, 16, 0.4)' : '#E54B2A',
              color: 'white',
              border: 'none',
              padding: 13,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: seeding || !name.trim() ? 'wait' : 'pointer',
              boxShadow: '0 8px 20px rgba(229, 75, 42, 0.25)',
            }}
          >
            {seeding ? 'Creando…' : '+ Crear local'}
          </button>
        </form>
        {isCloudMode ? (
          <button
            onClick={() => void signOut()}
            style={{
              marginTop: 14,
              background: 'none',
              border: 'none',
              color: '#7A6E66',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 12.5,
            }}
          >
            Cerrar sesión
          </button>
        ) : null}
      </div>
    </div>
  )
}

interface PanelAdminInnerProps {
  initialLocale: LocaleState
  isMobile: boolean
}

function PanelAdminInner({ initialLocale, isMobile }: PanelAdminInnerProps) {
  const auth = useAuth()
  const [activeSection, setActiveSection] = useState<SectionId>('inicio')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [locale, setLocale] = useState<LocaleState>(initialLocale)
  const skipSaveRef = useRef(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocale(initialLocale)
    skipSaveRef.current = true
  }, [initialLocale.slug])

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void saveLocale(locale).catch((err) => {
        console.error('saveLocale failed', err)
        showToast('No pudimos guardar los cambios.')
      })
    }, 350)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  const {
    slug,
    categories,
    products,
    local,
    schedule,
    payments,
    shipping,
    localOpen,
  } = locale

  const [activeAdminCat, setActiveAdminCat] = useState<string | null>(
    categories[0]?.id ?? null,
  )
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryDraft, setNewCategoryDraft] = useState('')

  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ProductDraft>({
    name: '',
    desc: '',
    price: '',
    img: EMPTY_DRAFT_IMG,
    categoryId: '',
    available: true,
  })

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [qrOpen, setQrOpen] = useState(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1800)
  }, [])

  // ---- Categories
  const startAddCategory = () => {
    setAddingCategory(true)
    setNewCategoryDraft('')
  }
  const cancelAddCategory = () => {
    setAddingCategory(false)
    setNewCategoryDraft('')
  }
  const confirmAddCategory = () => {
    const name = newCategoryDraft.trim()
    if (!name) {
      cancelAddCategory()
      return
    }
    const id = newClientId('cat')
    setLocale((s) => ({
      ...s,
      categories: [...s.categories, { id, name, emoji: '🍽' }],
    }))
    setActiveAdminCat(id)
    setAddingCategory(false)
    setNewCategoryDraft('')
    showToast('Categoría creada')
  }
  const handleDeleteCategory = (id: string) => {
    if (!window.confirm('¿Eliminar la categoría y todos sus productos?')) return
    setLocale((s) => {
      const cats = s.categories.filter((c) => c.id !== id)
      const prods = s.products.filter((p) => p.categoryId !== id)
      return { ...s, categories: cats, products: prods }
    })
    setActiveAdminCat((cur) => {
      if (cur !== id) return cur
      const next = categories.find((c) => c.id !== id)
      return next?.id ?? null
    })
    showToast('Categoría eliminada')
  }

  // ---- Products
  const startNewProduct = () => {
    const targetCat = activeAdminCat || categories[0]?.id || ''
    setEditingProductId('new')
    setEditForm({
      name: '',
      desc: '',
      price: '',
      img: EMPTY_DRAFT_IMG,
      categoryId: targetCat,
      available: true,
    })
  }
  const editProduct = (id: string) => {
    const p = products.find((x) => x.id === id)
    if (!p) return
    setEditingProductId(id)
    setEditForm({
      name: p.name,
      desc: p.desc,
      price: p.price,
      img: p.img,
      categoryId: p.categoryId,
      available: p.available,
    })
  }
  const closeEditDrawer = () => setEditingProductId(null)
  const onEditFormChange = (patch: Partial<ProductDraft>) =>
    setEditForm((f) => ({ ...f, ...patch }))

  const saveProduct = () => {
    const f = editForm
    if (!f.name.trim() || f.price === '' || isNaN(Number(f.price))) {
      showToast('Faltan datos: nombre y precio.')
      return
    }
    const editing = editingProductId
    if (editing === 'new') {
      const newId = newClientId('p')
      const newP = {
        id: newId,
        name: f.name,
        desc: f.desc,
        price: Number(f.price),
        img: f.img,
        categoryId: f.categoryId,
        available: f.available,
      }
      setLocale((s) => ({ ...s, products: [...s.products, newP] }))
      setActiveAdminCat(f.categoryId)
      showToast('Producto creado')
    } else if (editing) {
      setLocale((s) => ({
        ...s,
        products: s.products.map((p) =>
          p.id === editing
            ? {
                ...p,
                name: f.name,
                desc: f.desc,
                price: Number(f.price),
                img: f.img,
                categoryId: f.categoryId,
                available: f.available,
              }
            : p,
        ),
      }))
      showToast('Producto actualizado')
    }
    setEditingProductId(null)
  }

  const toggleProductAvail = (id: string) =>
    setLocale((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, available: !p.available } : p)),
    }))

  const handleDeleteProduct = (id: string) => {
    if (!window.confirm('¿Eliminar este producto?')) return
    setLocale((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }))
    showToast('Producto eliminado')
  }

  // ---- Local
  const updateLocal = (patch: Partial<LocalConfig>) =>
    setLocale((s) => ({ ...s, local: { ...s.local, ...patch } }))
  const setColor = (color: string) =>
    setLocale((s) => ({ ...s, local: { ...s.local, primaryColor: color } }))

  // ---- Schedule
  const toggleScheduleDay = (idx: number) =>
    setLocale((s) => ({
      ...s,
      schedule: s.schedule.map((d, i) => (i === idx ? { ...d, open: !d.open } : d)),
    }))
  const setScheduleField = (idx: number, field: 'from' | 'to', value: string) =>
    setLocale((s) => ({
      ...s,
      schedule: s.schedule.map((d, i) => (i === idx ? { ...d, [field]: value } : d)),
    }))

  // ---- Payments
  const updatePayments = (patch: Partial<PaymentsConfig>) =>
    setLocale((s) => ({ ...s, payments: { ...s.payments, ...patch } }))
  const toggleCash = () =>
    setLocale((s) => ({ ...s, payments: { ...s.payments, cashEnabled: !s.payments.cashEnabled } }))
  const toggleTransfer = () =>
    setLocale((s) => ({
      ...s,
      payments: { ...s.payments, transferEnabled: !s.payments.transferEnabled },
    }))

  // ---- Shipping
  const updateShipping = (patch: Partial<ShippingConfig>) =>
    setLocale((s) => ({ ...s, shipping: { ...s.shipping, ...patch } }))
  const toggleDelivery = () =>
    setLocale((s) => ({
      ...s,
      shipping: { ...s.shipping, deliveryEnabled: !s.shipping.deliveryEnabled },
    }))
  const togglePickup = () =>
    setLocale((s) => ({
      ...s,
      shipping: { ...s.shipping, pickupEnabled: !s.shipping.pickupEnabled },
    }))

  const toggleStatus = () => setLocale((s) => ({ ...s, localOpen: !s.localOpen }))

  const onOpenCustomerView = () => {
    const url = buildUrl({ kind: 'customer', slug })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleSwitchLocale = (nextSlug: string) => {
    navigate({ kind: 'admin', slug: nextSlug })
  }

  const handleCreateLocale = (name: string) => {
    void createLocale(name)
      .then((created) => {
        navigate({ kind: 'admin', slug: created.slug })
      })
      .catch((err) => {
        window.alert(
          err instanceof Error ? err.message : 'No pudimos crear el local. Reintentá.',
        )
      })
  }

  const handleDeleteThisLocale = () => {
    if (
      !window.confirm(
        `¿Eliminar el local "${local.name}" y todos sus datos? Esta acción no se puede deshacer.`,
      )
    )
      return
    void deleteLocale(slug)
      .then(() => {
        navigate({ kind: 'landing' })
      })
      .catch((err) => {
        window.alert(
          err instanceof Error ? err.message : 'No pudimos eliminar el local.',
        )
      })
  }

  const activeNav = NAV.find((n) => n.id === activeSection) ?? NAV[0]
  const availableCount = products.filter((p) => p.available).length

  const ordersQ = useOrders(slug)
  const activeOrders = ordersQ.data.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled',
  )

  const [notifPrefs, setNotifPrefs] = useState(() => loadNotificationPrefs())
  useEffect(() => {
    const onFocus = () => setNotifPrefs(loadNotificationPrefs())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useOrderNotifications(ordersQ.data, {
    enabled: notifPrefs.enabled,
    soundEnabled: notifPrefs.sound,
    localeName: local.name,
  })
  const navBadges: Partial<Record<SectionId, number>> = {
    pedidos: activeOrders.length,
  }

  const todayMs = (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  })()
  const ordersToday = ordersQ.data.filter((o) => o.createdAt >= todayMs)
  const revenueToday = ordersToday
    .filter((o) => o.status !== 'cancelled')
    .reduce((a, o) => a + o.total, 0)

  const isEditing = !!editingProductId
  const isNew = editingProductId === 'new'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F2EE',
        color: '#1A1410',
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? undefined : '252px 1fr',
      }}
    >
      <Sidebar
        nav={NAV}
        active={activeSection}
        onNavigate={setActiveSection}
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentSlug={slug}
        currentName={local.name}
        currentLogo={local.logo}
        localOpen={localOpen}
        navBadges={navBadges}
        onSwitchLocale={handleSwitchLocale}
        onCreateLocale={handleCreateLocale}
        onDeleteCurrentLocale={handleDeleteThisLocale}
        onGoLanding={() => navigate({ kind: 'landing' })}
        cloudEnabled={auth.cloudEnabled}
        userEmail={auth.user?.email ?? null}
        onSignOut={() => void auth.signOut()}
      />

      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          title={activeNav.title}
          subtitle={activeNav.subtitle}
          isOpen={localOpen}
          isMobile={isMobile}
          onToggleStatus={toggleStatus}
          onOpenCustomerView={onOpenCustomerView}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <div
          style={{
            padding: isMobile ? '20px 16px 48px' : '28px 32px 48px',
            flex: 1,
            minWidth: 0,
            maxWidth: 1200,
            width: '100%',
          }}
        >
          {activeSection === 'inicio' ? (
            <InicioSection
              isOpen={localOpen}
              productCount={products.length}
              availableCount={availableCount}
              categoryCount={categories.length}
              payments={payments}
              shipping={shipping}
              local={local}
              isMobile={isMobile}
              publicUrl={buildUrl({ kind: 'customer', slug })}
              ordersTodayCount={ordersToday.length}
              activeOrdersCount={activeOrders.length}
              revenueToday={revenueToday}
              onToggleStatus={toggleStatus}
              onGoMenu={() => setActiveSection('menu')}
              onGoLocal={() => setActiveSection('local')}
              onGoPagos={() => setActiveSection('pagos')}
              onGoEnvio={() => setActiveSection('envio')}
              onGoPedidos={() => setActiveSection('pedidos')}
              onOpenCustomerView={onOpenCustomerView}
              onShowQr={() => setQrOpen(true)}
            />
          ) : null}

          {activeSection === 'pedidos' ? (
            <PedidosSection slug={slug} isMobile={isMobile} whatsapp={local.whatsapp} />
          ) : null}

          {activeSection === 'reportes' ? (
            <ReportesSection slug={slug} isMobile={isMobile} />
          ) : null}

          {activeSection === 'menu' ? (
            <MenuSection
              categories={categories}
              products={products}
              activeCategoryId={activeAdminCat}
              addingCategory={addingCategory}
              newCategoryDraft={newCategoryDraft}
              isMobile={isMobile}
              onSelectCategory={setActiveAdminCat}
              onStartAddCategory={startAddCategory}
              onCancelAddCategory={cancelAddCategory}
              onNewCategoryInput={setNewCategoryDraft}
              onConfirmAddCategory={confirmAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onStartNewProduct={startNewProduct}
              onEditProduct={editProduct}
              onDeleteProduct={handleDeleteProduct}
              onToggleProductAvail={toggleProductAvail}
            />
          ) : null}

          {activeSection === 'local' ? (
            <LocalSection
              local={local}
              schedule={schedule}
              isMobile={isMobile}
              uploadScope={slug}
              onLocalChange={updateLocal}
              onColorChange={setColor}
              onToggleDay={toggleScheduleDay}
              onScheduleFieldChange={setScheduleField}
            />
          ) : null}

          {activeSection === 'pagos' ? (
            <PagosSection
              payments={payments}
              isMobile={isMobile}
              onToggleCash={toggleCash}
              onToggleTransfer={toggleTransfer}
              onPaymentsChange={updatePayments}
            />
          ) : null}

          {activeSection === 'envio' ? (
            <EnvioSection
              shipping={shipping}
              isMobile={isMobile}
              onToggleDelivery={toggleDelivery}
              onTogglePickup={togglePickup}
              onShippingChange={updateShipping}
            />
          ) : null}
        </div>
      </main>

      <ProductDrawer
        isOpen={isEditing}
        isNew={isNew}
        draft={editForm}
        categories={categories}
        uploadScope={slug}
        onClose={closeEditDrawer}
        onChange={onEditFormChange}
        onSave={saveProduct}
      />

      <QrModal
        isOpen={qrOpen}
        url={buildUrl({ kind: 'customer', slug })}
        localName={local.name}
        onClose={() => setQrOpen(false)}
      />

      <Toast message={toast} />
    </div>
  )
}

function newClientId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now()}`
}
