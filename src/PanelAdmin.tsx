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
  listLocaleSummaries,
  loadLocale,
  saveLocale,
} from './store'
import type { LocaleState } from './store'
import { useIsMobile } from './hooks/useMediaQuery'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Toast } from './components/Toast'
import { ProductDrawer } from './components/ProductDrawer'
import { InicioSection } from './sections/InicioSection'
import { MenuSection } from './sections/MenuSection'
import { LocalSection } from './sections/LocalSection'
import { PagosSection } from './sections/PagosSection'
import { EnvioSection } from './sections/EnvioSection'
import { buildUrl, navigate } from './router'

const EMPTY_DRAFT_IMG =
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&auto=format&fit=crop'

interface PanelAdminProps {
  slug: string | null
}

export function PanelAdmin({ slug }: PanelAdminProps) {
  const isMobile = useIsMobile()

  const resolvedSlug = slug ?? ensureDefaultLocale()
  useEffect(() => {
    if (!slug) {
      navigate({ kind: 'admin', slug: resolvedSlug })
    }
  }, [slug, resolvedSlug])

  const initial = loadLocale(resolvedSlug)
  if (!initial) {
    return <MissingLocaleScreen slug={resolvedSlug} />
  }

  return <PanelAdminInner initialLocale={initial} isMobile={isMobile} />
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
        No encontramos un local con el identificador <code>{slug}</code>. Tal vez fue borrado o
        nunca existió en este navegador.
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

interface PanelAdminInnerProps {
  initialLocale: LocaleState
  isMobile: boolean
}

function PanelAdminInner({ initialLocale, isMobile }: PanelAdminInnerProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('inicio')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [locale, setLocale] = useState<LocaleState>(initialLocale)
  useEffect(() => {
    setLocale(initialLocale)
  }, [initialLocale.slug])

  useEffect(() => {
    saveLocale(locale)
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
    const id = 'cat_' + (categories.length + 1) + '_' + name.replace(/\s+/g, '').toLowerCase()
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
      const newId = 'p_' + (products.length + 1) + '_' + f.name.replace(/\s+/g, '').toLowerCase().slice(0, 12)
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
    const created = createLocale(name)
    navigate({ kind: 'admin', slug: created.slug })
  }

  const handleDeleteThisLocale = () => {
    if (
      !window.confirm(
        `¿Eliminar el local "${local.name}" y todos sus datos? Esta acción no se puede deshacer.`,
      )
    )
      return
    const remaining = listLocaleSummaries().filter((s) => s.slug !== slug)
    deleteLocale(slug)
    if (remaining.length > 0) {
      navigate({ kind: 'admin', slug: remaining[0].slug })
    } else {
      navigate({ kind: 'landing' })
    }
  }

  const activeNav = NAV.find((n) => n.id === activeSection) ?? NAV[0]
  const availableCount = products.filter((p) => p.available).length

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
        onSwitchLocale={handleSwitchLocale}
        onCreateLocale={handleCreateLocale}
        onDeleteCurrentLocale={handleDeleteThisLocale}
        onGoLanding={() => navigate({ kind: 'landing' })}
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
              onToggleStatus={toggleStatus}
              onGoMenu={() => setActiveSection('menu')}
              onGoLocal={() => setActiveSection('local')}
              onGoPagos={() => setActiveSection('pagos')}
              onGoEnvio={() => setActiveSection('envio')}
              onOpenCustomerView={onOpenCustomerView}
            />
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
        onClose={closeEditDrawer}
        onChange={onEditFormChange}
        onSave={saveProduct}
      />

      <Toast message={toast} />
    </div>
  )
}
