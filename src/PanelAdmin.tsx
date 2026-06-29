import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  Category,
  LocalConfig,
  PaymentsConfig,
  Product,
  ProductDraft,
  ScheduleDay,
  SectionId,
  ShippingConfig,
} from './types'
import { NAV } from './data'
import { loadPersistedState, savePersistedState } from './store'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Toast } from './components/Toast'
import { ProductDrawer } from './components/ProductDrawer'
import { InicioSection } from './sections/InicioSection'
import { MenuSection } from './sections/MenuSection'
import { LocalSection } from './sections/LocalSection'
import { PagosSection } from './sections/PagosSection'
import { EnvioSection } from './sections/EnvioSection'

const EMPTY_DRAFT_IMG =
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&auto=format&fit=crop'

export function PanelAdmin() {
  const persisted = loadPersistedState()

  const [activeSection, setActiveSection] = useState<SectionId>('inicio')
  const [localOpen, setLocalOpen] = useState(persisted.localOpen)

  const [categories, setCategories] = useState<Category[]>(persisted.categories)
  const [products, setProducts] = useState<Product[]>(persisted.products)
  const [activeAdminCat, setActiveAdminCat] = useState<string | null>(
    persisted.categories[0]?.id ?? null,
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

  const [local, setLocal] = useState<LocalConfig>(persisted.local)
  const [schedule, setSchedule] = useState<ScheduleDay[]>(persisted.schedule)
  const [payments, setPayments] = useState<PaymentsConfig>(persisted.payments)
  const [shipping, setShipping] = useState<ShippingConfig>(persisted.shipping)

  useEffect(() => {
    savePersistedState({ categories, products, local, schedule, payments, shipping, localOpen })
  }, [categories, products, local, schedule, payments, shipping, localOpen])

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
    const id = 'cat_' + Date.now()
    setCategories((cs) => [...cs, { id, name, emoji: '🍽' }])
    setActiveAdminCat(id)
    setAddingCategory(false)
    setNewCategoryDraft('')
    showToast('Categoría creada')
  }
  const deleteCategory = (id: string) => {
    if (!window.confirm('¿Eliminar la categoría y todos sus productos?')) return
    setCategories((cs) => {
      const remaining = cs.filter((c) => c.id !== id)
      setProducts((ps) => ps.filter((p) => p.categoryId !== id))
      setActiveAdminCat(remaining.length ? remaining[0].id : null)
      return remaining
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
      const newP: Product = {
        id: 'p_' + Date.now(),
        name: f.name,
        desc: f.desc,
        price: Number(f.price),
        img: f.img,
        categoryId: f.categoryId,
        available: f.available,
      }
      setProducts((ps) => [...ps, newP])
      setActiveAdminCat(newP.categoryId)
      showToast('Producto creado')
    } else if (editing) {
      setProducts((ps) =>
        ps.map((p) =>
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
      )
      showToast('Producto actualizado')
    }
    setEditingProductId(null)
  }

  const toggleProductAvail = (id: string) =>
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, available: !p.available } : p)))

  const deleteProduct = (id: string) => {
    if (!window.confirm('¿Eliminar este producto?')) return
    setProducts((ps) => ps.filter((p) => p.id !== id))
    showToast('Producto eliminado')
  }

  // ---- Local
  const updateLocal = (patch: Partial<LocalConfig>) => setLocal((l) => ({ ...l, ...patch }))
  const setColor = (color: string) => setLocal((l) => ({ ...l, primaryColor: color }))

  // ---- Schedule
  const toggleScheduleDay = (idx: number) =>
    setSchedule((s) => s.map((d, i) => (i === idx ? { ...d, open: !d.open } : d)))
  const setScheduleField = (idx: number, field: 'from' | 'to', value: string) =>
    setSchedule((s) => s.map((d, i) => (i === idx ? { ...d, [field]: value } : d)))

  // ---- Payments
  const updatePayments = (patch: Partial<PaymentsConfig>) => setPayments((p) => ({ ...p, ...patch }))
  const toggleCash = () => setPayments((p) => ({ ...p, cashEnabled: !p.cashEnabled }))
  const toggleTransfer = () => setPayments((p) => ({ ...p, transferEnabled: !p.transferEnabled }))

  // ---- Shipping
  const updateShipping = (patch: Partial<ShippingConfig>) => setShipping((s) => ({ ...s, ...patch }))
  const toggleDelivery = () => setShipping((s) => ({ ...s, deliveryEnabled: !s.deliveryEnabled }))
  const togglePickup = () => setShipping((s) => ({ ...s, pickupEnabled: !s.pickupEnabled }))

  const toggleStatus = () => setLocalOpen((v) => !v)

  const onOpenCustomerView = () => {
    const url = window.location.origin + window.location.pathname + '#/pedido'
    window.open(url, '_blank', 'noopener,noreferrer')
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
        display: 'grid',
        gridTemplateColumns: '252px 1fr',
      }}
    >
      <Sidebar nav={NAV} active={activeSection} onNavigate={setActiveSection} />

      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          title={activeNav.title}
          subtitle={activeNav.subtitle}
          isOpen={localOpen}
          onToggleStatus={toggleStatus}
          onOpenCustomerView={onOpenCustomerView}
        />

        <div style={{ padding: '28px 32px 48px', flex: 1, minWidth: 0, maxWidth: 1200, width: '100%' }}>
          {activeSection === 'inicio' ? (
            <InicioSection
              isOpen={localOpen}
              productCount={products.length}
              availableCount={availableCount}
              categoryCount={categories.length}
              payments={payments}
              shipping={shipping}
              local={local}
              onToggleStatus={toggleStatus}
              onGoMenu={() => setActiveSection('menu')}
              onGoLocal={() => setActiveSection('local')}
              onGoPagos={() => setActiveSection('pagos')}
              onGoEnvio={() => setActiveSection('envio')}
            />
          ) : null}

          {activeSection === 'menu' ? (
            <MenuSection
              categories={categories}
              products={products}
              activeCategoryId={activeAdminCat}
              addingCategory={addingCategory}
              newCategoryDraft={newCategoryDraft}
              onSelectCategory={setActiveAdminCat}
              onStartAddCategory={startAddCategory}
              onCancelAddCategory={cancelAddCategory}
              onNewCategoryInput={setNewCategoryDraft}
              onConfirmAddCategory={confirmAddCategory}
              onDeleteCategory={deleteCategory}
              onStartNewProduct={startNewProduct}
              onEditProduct={editProduct}
              onDeleteProduct={deleteProduct}
              onToggleProductAvail={toggleProductAvail}
            />
          ) : null}

          {activeSection === 'local' ? (
            <LocalSection
              local={local}
              schedule={schedule}
              onLocalChange={updateLocal}
              onColorChange={setColor}
              onToggleDay={toggleScheduleDay}
              onScheduleFieldChange={setScheduleField}
            />
          ) : null}

          {activeSection === 'pagos' ? (
            <PagosSection
              payments={payments}
              onToggleCash={toggleCash}
              onToggleTransfer={toggleTransfer}
              onPaymentsChange={updatePayments}
            />
          ) : null}

          {activeSection === 'envio' ? (
            <EnvioSection
              shipping={shipping}
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
