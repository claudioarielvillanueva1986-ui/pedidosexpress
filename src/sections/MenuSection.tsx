import type { Category, Product } from '../types'
import { Toggle } from '../components/Toggle'
import { formatPrice } from '../utils'

interface MenuSectionProps {
  categories: Category[]
  products: Product[]
  activeCategoryId: string | null
  addingCategory: boolean
  newCategoryDraft: string
  onSelectCategory: (id: string) => void
  onStartAddCategory: () => void
  onCancelAddCategory: () => void
  onNewCategoryInput: (value: string) => void
  onConfirmAddCategory: () => void
  onDeleteCategory: (id: string) => void
  onStartNewProduct: () => void
  onEditProduct: (id: string) => void
  onDeleteProduct: (id: string) => void
  onToggleProductAvail: (id: string) => void
}

function catChipStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 7px 7px 12px',
    borderRadius: 999,
    background: active ? '#1A1410' : 'white',
    color: active ? 'white' : '#1A1410',
    border: '1px solid ' + (active ? 'transparent' : 'rgba(26, 20, 16, 0.08)'),
    flexShrink: 0,
    whiteSpace: 'nowrap',
    transition: 'all 140ms ease',
  }
}

function catCountStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.05)',
    color: active ? 'white' : '#7A6E66',
    padding: '1px 7px',
    borderRadius: 999,
    fontSize: 10.5,
    fontWeight: 700,
    marginLeft: 4,
  }
}

export function MenuSection({
  categories,
  products,
  activeCategoryId,
  addingCategory,
  newCategoryDraft,
  onSelectCategory,
  onStartAddCategory,
  onCancelAddCategory,
  onNewCategoryInput,
  onConfirmAddCategory,
  onDeleteCategory,
  onStartNewProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleProductAvail,
}: MenuSectionProps) {
  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? categories[0] ?? null
  const activeProducts = activeCategory ? products.filter((p) => p.categoryId === activeCategory.id) : []
  const activeProductsAvail = activeProducts.filter((p) => p.available).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Category tabs */}
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 16,
          border: '1px solid rgba(26, 20, 16, 0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, margin: 0 }}>
              Categorías
            </h3>
            <p style={{ fontSize: 12, color: '#7A6E66', margin: '3px 0 0' }}>
              {categories.length} categorías · {products.length} productos
            </p>
          </div>
          <button
            onClick={onStartAddCategory}
            style={{
              background: '#1A1410',
              color: 'white',
              border: 'none',
              padding: '8px 13px',
              borderRadius: 9,
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
            <span>Categoría</span>
          </button>
        </div>

        <div
          className="pa-scroll-x"
          style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}
        >
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length
            const active = cat.id === activeCategory?.id
            return (
              <div key={cat.id} style={catChipStyle(active)}>
                <button
                  onClick={() => onSelectCategory(cat.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    font: 'inherit',
                    fontWeight: 600,
                    fontSize: 13,
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                  <span style={catCountStyle(active)}>{count}</span>
                </button>
                {active ? (
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    title="Eliminar categoría"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'inherit',
                      opacity: 0.6,
                      fontSize: 13,
                      lineHeight: 1,
                      padding: 2,
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            )
          })}

          {addingCategory ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'white',
                border: '1.5px dashed #E54B2A',
                borderRadius: 999,
                padding: '5px 8px 5px 12px',
              }}
            >
              <input
                type="text"
                value={newCategoryDraft}
                onChange={(e) => onNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfirmAddCategory()
                  if (e.key === 'Escape') onCancelAddCategory()
                }}
                autoFocus
                placeholder="Nombre…"
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  width: 110,
                }}
              />
              <button
                onClick={onConfirmAddCategory}
                style={{
                  background: '#E54B2A',
                  color: 'white',
                  border: 'none',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 13,
                  lineHeight: 1,
                }}
              >
                ✓
              </button>
              <button
                onClick={onCancelAddCategory}
                style={{
                  background: 'rgba(0,0,0,0.06)',
                  color: '#1A1410',
                  border: 'none',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 13,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Products list */}
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(26, 20, 16, 0.05)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(26, 20, 16, 0.05)',
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, margin: 0 }}>
              Productos en {activeCategory?.name ?? '—'}
            </h3>
            <p style={{ fontSize: 12, color: '#7A6E66', margin: '3px 0 0' }}>
              {activeProducts.length} productos · {activeProductsAvail} disponibles
            </p>
          </div>
          <button
            onClick={onStartNewProduct}
            className="pa-btn-orange"
            style={{
              background: '#E54B2A',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 9,
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 4px 12px rgba(229, 75, 42, 0.3)',
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
            <span>Nuevo producto</span>
          </button>
        </div>

        {activeProducts.length > 0 ? (
          <div>
            {activeProducts.map((item) => (
              <div
                key={item.id}
                className="pa-hoverable"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr 110px 80px auto',
                  gap: 14,
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(26, 20, 16, 0.04)',
                  transition: 'background 120ms ease',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: '#EEE7E0',
                    opacity: item.available ? 1 : 0.55,
                  }}
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                    <span
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontWeight: 700,
                        fontSize: 14.5,
                        color: item.available ? '#1A1410' : '#94918D',
                      }}
                    >
                      {item.name}
                    </span>
                    {!item.available ? (
                      <span
                        style={{
                          background: 'rgba(0,0,0,0.06)',
                          color: '#7A6E66',
                          padding: '1px 7px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Pausado
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#7A6E66',
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    color: item.available ? '#1A1410' : '#94918D',
                  }}
                >
                  {formatPrice(item.price)}
                </div>
                <div style={{ justifySelf: 'center' }}>
                  <Toggle on={item.available} onClick={() => onToggleProductAvail(item.id)} title="Disponibilidad" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => onEditProduct(item.id)}
                    title="Editar"
                    className="pa-btn-light"
                    style={{
                      background: 'white',
                      border: '1px solid rgba(26, 20, 16, 0.08)',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onDeleteProduct(item.id)}
                    title="Eliminar"
                    className="pa-btn-trash"
                    style={{
                      background: 'white',
                      border: '1px solid rgba(26, 20, 16, 0.08)',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#C03A1E',
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🍽</div>
            <h4
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                margin: '0 0 4px',
              }}
            >
              Esta categoría está vacía
            </h4>
            <p style={{ fontSize: 13, color: '#7A6E66', margin: '0 0 16px' }}>
              Agregá tu primer producto para que aparezca en el menú.
            </p>
            <button
              onClick={onStartNewProduct}
              style={{
                background: '#E54B2A',
                color: 'white',
                border: 'none',
                padding: '9px 16px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              + Crear producto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
