# Roadmap · Pedido Express

Estado de las fases del producto. Actualizado al 29/06/2026.

## Entregado ✅

- **Fase 1** — Multi-local en localStorage
- **Fase 2** — Backend con Supabase + Auth real + Multi-dispositivo
- **Fase 3** — Buscador + filtros + QR del link público
- **Fase 4B** — Link de pago manual de Mercado Pago (sin OAuth)
- **Fase 5A** — Persistencia de pedidos + Dashboard de Pedidos
- **Fase 5B parte 1** — Notificaciones del navegador + beep

## Pendiente, por prioridad sugerida

### 🟡 Fase 5B parte 2 — Notificaciones por email / WhatsApp al merchant
**Por qué:** la notificación del navegador solo funciona mientras tenés alguna pestaña abierta. Para enterarte de un pedido cuando no estás en la compu, hace falta otro canal.

**Necesita:**
- Cuenta en Resend (free tier 100 emails/día, sin tarjeta)
- Una Edge Function en Supabase que reciba el webhook de INSERT en `orders` y mande el email
- Database webhook configurado en Supabase para llamar a la function
- Toggle en el panel para activarlo + campo "email de notificación"

**Esfuerzo:** ~3-4 horas + setup del user en Resend.

---

### 🟠 Fase 4C — Mercado Pago Connect real (OAuth + cobros automáticos)
**Por qué:** que cada comerciante conecte su cuenta MP con un click, y los pedidos generen automáticamente un link de pago a su nombre. Cuando el cliente paga, MP avisa por webhook y marcamos el pedido como `paid`.

**Necesita:**
- App registrada en developers.mercadopago.com (lo hace el user)
- Tabla `merchant_payment_connections` en Supabase con el access_token cifrado
- Edge Functions: callback OAuth, creación de preference, webhook receiver
- UI en el panel: botón "Conectar Mercado Pago" + estado de la conexión
- Refresh tokens, manejo de errores

**Esfuerzo:** 2-4 días. Es la fase más compleja.

---

### 🟢 Fase 6 — Analytics y reportes
**Por qué:** dashboard de métricas del comerciante. Ventas por día/semana/mes, top productos, ticket promedio, gráficos.

**Necesita:**
- Solo queries sobre la tabla `orders` que ya existe
- Una librería liviana de charts (Recharts o similar)
- Nueva sección "Reportes" en el panel

**Esfuerzo:** 1-2 días.

---

### 🟢 Fase 7 — Imágenes propias de productos
**Por qué:** hoy el comerciante pega URLs de Unsplash. Lo natural sería subir fotos desde el celular.

**Necesita:**
- Bucket en Supabase Storage con policy de "owner write, public read"
- Input de upload en el drawer de producto
- Redimensionar al subir (cliente o function) para que no pese 5MB cada foto

**Esfuerzo:** 1 día.

---

### 🟢 Fase 8 — Dominio propio + email con dominio
**Por qué:** que en vez de `pedidosexpress-jade.vercel.app` los clientes vean `pedidoexpress.com.ar` y los mails de confirmación de Supabase no lleguen como `noreply@mail.app.supabase.io`.

**Necesita:**
- Comprar dominio (NIC.ar para .com.ar)
- Conectar el dominio en Vercel (apuntar DNS)
- Configurar custom SMTP en Supabase con Resend o SendGrid

**Esfuerzo:** medio día técnico + tiempo de propagación DNS.

---

### 🟢 Fase 9 — Multi-currency / multi-región
**Por qué:** soportar pesos uruguayos, chilenos, dólares, etc.

**Necesita:**
- Campo `currency` en `locales` con default ARS
- Formateo según la moneda
- Selector en el panel de configuración

**Esfuerzo:** 1-2 días.

---

### 🟢 Fase 10 — App nativa con Capacitor
**Por qué:** que el comerciante tenga un icono en su celular en vez de abrir el browser cada vez. Notif push reales (no las del navegador).

**Necesita:**
- Setup de Capacitor sobre el proyecto Vite
- Cuenta Apple Developer (USD 99/año) para iOS
- Cuenta Google Play Console (USD 25 una vez) para Android

**Esfuerzo:** 2-3 días + setup de cuentas.

---

## Notas técnicas pendientes

- Bundle pesa 520kB sin code-splitting. Cuando esté más grande conviene hacer `import()` por sección.
- `qrcode` lib agrega ~50kB, podría lazy-loadearse solo cuando se abre el modal QR.
- `service_role` key de Supabase no se está usando. Solo serviría para una function que necesite bypass de RLS — por ej. la que envía emails.
