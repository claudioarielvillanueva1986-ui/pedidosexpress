# Activar modo cloud con Supabase

Esta guía te lleva paso a paso desde "app en localStorage" hasta
"app con auth real, base de datos en la nube y sincronización
multi-dispositivo". Una sola vez. Después la app se queda en modo
cloud para siempre.

## Cómo saber qué migraciones ya corriste

A partir de la migración 007, el proyecto registra cada migración
aplicada en una tabla `public.schema_migrations`. Para ver qué
está aplicado en este Supabase, ejecutá en SQL Editor:

```sql
select version, name, applied_at
from public.schema_migrations
order by version;
```

Lo que esté en la lista, **no lo corras de nuevo**. Lo que falte
respecto a `supabase/migrations/` en el repo, corrélo en orden
numérico ascendente.

> ⚠️ Si la tabla `schema_migrations` todavía no existe en tu
> Supabase (proyecto creado antes de la 007), correr la 007
> primero — su backfill se da cuenta solo qué migraciones ya
> aplicaste y registra todo.

**Las migraciones son acumulativas y deben correrse en orden.**
Saltearte una rompe las que dependen de ella (ej. la 006 necesita
la 005).

---

## Lo que vas a hacer

1. Crear un proyecto gratis en Supabase.
2. Pegar un script SQL para crear las tablas y permisos.
3. Copiar 2 valores (URL + anon key) y pegarlos en Vercel.
4. Redeploy desde Vercel.

Tiempo total: ~10 minutos.

---

## 1. Crear cuenta y proyecto en Supabase

1. Andá a https://supabase.com y tocá **"Start your project"** /
   **"Sign up"**. Podés usar tu cuenta de GitHub para entrar más rápido.
2. En el dashboard tocá **"New Project"**.
3. Completá:
   - **Name**: `pedido-express` (o lo que quieras)
   - **Database password**: una contraseña fuerte (guardala, no la
     usás todos los días pero te puede pedir para queries avanzadas)
   - **Region**: la más cercana — `South America (São Paulo)` para
     Argentina/Uruguay/Chile/Brasil
   - **Pricing plan**: **Free** (alcanza para empezar)
4. Tocá **"Create new project"**. Tarda ~1 minuto en provisionar.

---

## 2. Crear las tablas

1. En el menú izquierdo de Supabase, andá a **SQL Editor**.
2. Tocá **"+ New query"**.
3. Abrí `supabase/migrations/001_init.sql` de este repo, copiá
   **todo el contenido**, pegalo en el editor y tocá **"Run"**.
4. Tendría que devolver `Success. No rows returned.`.

Eso crea las tablas `locales`, `categories`, `products`, los
permisos de Row-Level Security (cada dueño ve sólo lo suyo, pero
los menús son públicos para los clientes), y activa Realtime para
que cuando edites un producto el cliente lo vea sin refrescar.

---

## 3. Copiar tus credenciales

1. En Supabase, ícono de engranaje (**Settings**) → **API**.
2. Vas a ver dos valores que necesitamos:
   - **Project URL** (algo tipo `https://abcd1234.supabase.co`)
   - **Project API keys → `anon` `public`** (una string larga
     que empieza con `eyJ...`)

⚠️ Importante: NO copies la clave `service_role`. Esa nunca debe ir
al frontend. Sólo la `anon`.

---

## 4. Configurar Vercel

1. Andá a https://vercel.com/dashboard → tu proyecto **pedidosexpress**.
2. Tab **Settings** → en la columna izquierda, **Environment Variables**.
3. Agregá dos variables:

| Name                       | Value                                 | Environments |
|----------------------------|---------------------------------------|--------------|
| `VITE_SUPABASE_URL`        | (la "Project URL" de Supabase)        | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY`   | (la `anon public key` de Supabase)    | Production, Preview, Development |

Tocá **Save** después de cada una.

4. Tab **Deployments** → último deploy → **"Redeploy"** (los dots de la derecha).
   Sin esto las variables no quedan aplicadas.

---

## 5. Probar

1. Esperá ~1 minuto que termine el deploy.
2. Abrí tu URL (la de Vercel o la de GitHub Pages, según donde lo tengas).
3. Andá a `/#/admin`. Tiene que mostrar la **pantalla de login**.
4. Tocá **"Crear una cuenta"**, poné tu email + contraseña, y registrate.
5. Vas a recibir un mail de confirmación de Supabase (revisá spam si
   no aparece). Tocá el link.
6. Volvé a la app, entrá con esas credenciales.
7. Vas a llegar a una pantalla **"Creá tu primer local"** — escribí
   el nombre y listo. La app ya está usando la DB de la nube.

Desde ahora podés entrar desde cualquier dispositivo con esas
credenciales y ver lo mismo. Los clientes acceden a `/<slug>` sin
auth (los menús son públicos).

---

## Errores comunes

**"La pantalla queda en blanco después de hacer login"**

Probablemente el SQL no corrió bien. Andá a Supabase → Table Editor
y verificá que existan las tablas `locales`, `categories`, `products`.
Si no, repetí el Paso 2.

**"Email not confirmed"**

Tenés que tocar el link del mail antes de hacer login. Si no llega
el mail, andá a Supabase → Authentication → Users, encontrá tu
usuario y tocá **"Send magic link"** o **"Confirm user"** a mano.

**"Failed to fetch" / errores de red**

Las env vars de Vercel no se aplicaron. Verificá que estén bien
escritas (sin espacios al final) y hacé Redeploy.

**"new row violates row-level security policy"**

Estás logueado pero algo del SQL no se aplicó bien. Volvé a correr
el script SQL — es idempotente (no rompe nada si lo repetís).

---

## Cómo volver a modo local (rollback)

Si querés desactivar Supabase temporalmente: borrá las dos env vars
de Vercel y redeploy. La app vuelve a usar localStorage. Tus datos
en la nube siguen ahí, no se borran.

---

## Próximos pasos

Una vez que esté esto funcionando, los siguientes pasos de la
hoja de ruta son:

- **Fase 3** — Pulir el marketplace (buscador, filtros, QR del link público)
- **Fase 4** — Mercado Pago Connect (OAuth + cobros automáticos)
- **Fase 5** — Notificaciones, dashboard de pedidos, analytics

Avisame cuando termines este setup y arrancamos con lo siguiente.
