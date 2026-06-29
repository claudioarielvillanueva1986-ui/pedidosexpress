import { useRef, useState } from 'react'
import { uploadImage } from '../lib/imageUpload'

interface ImageUploadButtonProps {
  scope: string
  hint?: string
  label?: string
  onUploaded: (url: string) => void
  onError?: (message: string) => void
}

export function ImageUploadButton({
  scope,
  hint,
  label,
  onUploaded,
  onError,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  const handlePick = () => {
    if (busy) return
    inputRef.current?.click()
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = '' // allow re-uploading same file
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadImage(file, { scope, hint })
      onUploaded(url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falló la subida'
      if (onError) onError(msg)
      else window.alert(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handlePick}
        disabled={busy}
        style={{
          background: busy ? 'rgba(26, 20, 16, 0.4)' : '#1A1410',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: 9,
          fontWeight: 600,
          fontSize: 12.5,
          cursor: busy ? 'wait' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        <span>📷</span>
        <span>{busy ? 'Subiendo…' : label ?? 'Subir foto'}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </>
  )
}
