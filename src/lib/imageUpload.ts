import { isCloudMode, supabase } from './supabase'

const BUCKET = 'product-images'
const MAX_DIM = 960
const JPEG_QUALITY = 0.85

export interface UploadOptions {
  /** Used to namespace files inside the bucket (e.g. local slug). */
  scope: string
  /** Optional file name hint. A timestamp + random suffix is always appended. */
  hint?: string
}

/**
 * Resize an image to a max dimension (longest side) and re-encode as JPEG.
 * Returns a Blob. Throws on unsupported file types.
 */
export async function resizeImage(file: File, maxDim = MAX_DIM): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Image load failed'))
      el.src = objectUrl
    })
    let { width, height } = img
    const scale = Math.min(1, maxDim / Math.max(width, height))
    width = Math.round(width * scale)
    height = Math.round(height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas no soportado en este navegador.')
    ctx.drawImage(img, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    if (!blob) throw new Error('No pudimos procesar la imagen.')
    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/** Convert a Blob to a base64 data URL. */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No pudimos leer la imagen.'))
    reader.readAsDataURL(blob)
  })
}

function buildPath(opts: UploadOptions, ext = 'jpg'): string {
  const safeScope = opts.scope.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'misc'
  const safeHint = (opts.hint ?? '').replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 24)
  const stamp = Date.now().toString(36)
  const rnd = Math.random().toString(36).slice(2, 8)
  const stem = safeHint ? `${safeHint}-${stamp}-${rnd}` : `${stamp}-${rnd}`
  return `${safeScope}/${stem}.${ext}`
}

/**
 * Upload an image. In cloud mode the file goes to Supabase Storage and we
 * return the public URL; in local mode we return a base64 data URL the
 * panel can store inline (no server involved).
 */
export async function uploadImage(file: File, opts: UploadOptions): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Tiene que ser una imagen (JPG, PNG, WebP).')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('La imagen pesa demasiado (más de 12 MB).')
  }

  const blob = await resizeImage(file)

  if (!isCloudMode) {
    return blobToDataUrl(blob)
  }

  if (!supabase) {
    throw new Error('Supabase no está configurado.')
  }

  const path = buildPath(opts)
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
    cacheControl: '31536000',
  })
  if (error) {
    if (/Bucket not found|404/i.test(error.message)) {
      throw new Error(
        'El bucket "product-images" no existe en Supabase todavía. Corré la migración 004_storage.sql.',
      )
    }
    throw new Error(error.message)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return publicUrl
}
