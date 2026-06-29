import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QrModalProps {
  isOpen: boolean
  url: string
  localName: string
  onClose: () => void
}

export function QrModal({ isOpen, url, localName, onClose }: QrModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setCopied(false)
    let alive = true
    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 480,
      color: { dark: '#1A1410', light: '#FFFFFF' },
    })
      .then((d) => {
        if (alive) setDataUrl(d)
      })
      .catch(() => {
        if (alive) setDataUrl(null)
      })
    return () => {
      alive = false
    }
  }, [isOpen, url])

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Copialo manualmente:', url)
    }
  }

  const handleDownload = () => {
    if (!dataUrl) return
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `qr-${localName.replace(/\s+/g, '-').toLowerCase()}.png`
    link.click()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 20, 16, 0.55)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'white',
          borderRadius: 18,
          padding: 24,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              margin: 0,
              textAlign: 'left',
              flex: 1,
            }}
          >
            QR del local
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#F5F2EE',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#7A6E66', margin: '0 0 16px', lineHeight: 1.5 }}>
          Imprimilo y poné el cartel en el local. Los clientes lo escanean y abren tu menú.
        </p>

        <div
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            background: '#F5F2EE',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 14,
            marginBottom: 14,
          }}
        >
          {dataUrl ? (
            <img src={dataUrl} alt={`QR de ${localName}`} style={{ width: '100%', display: 'block' }} />
          ) : (
            <div style={{ color: '#7A6E66', fontSize: 13 }}>Generando QR…</div>
          )}
        </div>

        <div
          style={{
            background: '#F5F2EE',
            padding: '9px 12px',
            borderRadius: 10,
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 12,
            color: '#1A1410',
            marginBottom: 12,
            wordBreak: 'break-all',
            textAlign: 'left',
          }}
        >
          {url}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              background: 'white',
              border: '1px solid rgba(26, 20, 16, 0.1)',
              padding: '11px',
              borderRadius: 11,
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
              color: '#1A1410',
            }}
          >
            {copied ? '✓ Copiado' : '📋 Copiar link'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            style={{
              background: '#1A1410',
              color: 'white',
              border: 'none',
              padding: '11px',
              borderRadius: 11,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: dataUrl ? 'pointer' : 'wait',
            }}
          >
            ⬇ Descargar PNG
          </button>
        </div>
      </div>
    </div>
  )
}
