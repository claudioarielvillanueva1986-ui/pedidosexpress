import type { Category, ProductDraft } from '../types'
import { Toggle } from './Toggle'
import { inputStyle } from '../utils'
import { ImageUploadButton } from './ImageUploadButton'

interface ProductDrawerProps {
  isOpen: boolean
  isNew: boolean
  draft: ProductDraft
  categories: Category[]
  uploadScope: string
  onClose: () => void
  onChange: (patch: Partial<ProductDraft>) => void
  onSave: () => void
}

export function ProductDrawer({
  isOpen,
  isNew,
  draft,
  categories,
  uploadScope,
  onClose,
  onChange,
  onSave,
}: ProductDrawerProps) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26, 20, 16, 0.45)',
          zIndex: 80,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 240ms ease',
        }}
      />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(460px, 100vw)',
          background: 'white',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          transform: `translateX(${isOpen ? '0%' : '100%'})`,
          transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.25)',
        }}
      >
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
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: 19,
              margin: 0,
            }}
          >
            {isNew ? 'Nuevo producto' : 'Editar producto'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#F5F2EE',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        <div
          className="pa-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Imagen del producto
              </span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '92px 1fr',
                  gap: 12,
                  alignItems: 'stretch',
                }}
              >
                <div
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#EEE7E0',
                  }}
                >
                  {draft.img ? (
                    <img
                      src={draft.img}
                      alt="preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : null}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <ImageUploadButton
                    scope={uploadScope}
                    hint={draft.name || 'producto'}
                    label="Subir foto del producto"
                    onUploaded={(url) => onChange({ img: url })}
                  />
                  <input
                    type="text"
                    value={draft.img}
                    onChange={(e) => onChange({ img: e.target.value })}
                    placeholder="o pegá una URL"
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid rgba(26, 20, 16, 0.12)',
                      background: 'white',
                      fontSize: 12,
                      outline: 'none',
                      fontFamily: 'ui-monospace, Menlo, monospace',
                    }}
                  />
                </div>
              </div>
            </div>

            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Nombre <span style={{ color: '#E54B2A' }}>*</span>
              </span>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Ej: Clásica del Barrio"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Descripción
              </span>
              <textarea
                value={draft.desc}
                onChange={(e) => onChange({ desc: e.target.value })}
                rows={2}
                placeholder="Smash 150g, cheddar, lechuga..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(26, 20, 16, 0.12)',
                  background: 'white',
                  fontSize: 13.5,
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: 60,
                }}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                  Precio <span style={{ color: '#E54B2A' }}>*</span>
                </span>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 13,
                      color: '#7A6E66',
                    }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    value={draft.price}
                    onChange={(e) =>
                      onChange({ price: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 24px',
                      borderRadius: 10,
                      border: '1px solid rgba(26, 20, 16, 0.12)',
                      background: 'white',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                  />
                </div>
              </label>

              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                  Categoría
                </span>
                <select
                  value={draft.categoryId}
                  onChange={(e) => onChange({ categoryId: e.target.value })}
                  style={inputStyle}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                background: '#F5F2EE',
                borderRadius: 11,
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Disponible</div>
                <div style={{ fontSize: 11.5, color: '#7A6E66', marginTop: 1 }}>
                  Si está pausado, no aparece en el menú.
                </div>
              </div>
              <Toggle on={draft.available} onClick={() => onChange({ available: !draft.available })} size="md" />
            </label>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(26, 20, 16, 0.06)',
            padding: '14px 20px',
            display: 'flex',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'white',
              color: '#1A1410',
              border: '1px solid rgba(26, 20, 16, 0.1)',
              padding: 11,
              borderRadius: 11,
              fontWeight: 600,
              fontSize: 13.5,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="pa-btn-orange"
            style={{
              flex: 2,
              background: '#E54B2A',
              color: 'white',
              border: 'none',
              padding: 11,
              borderRadius: 11,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(229, 75, 42, 0.32)',
            }}
          >
            {isNew ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </div>
      </aside>
    </>
  )
}
