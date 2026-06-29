-- ===================================================================
-- Pedido Express · Tabla de pedidos
-- ===================================================================
-- Persistencia de cada pedido que el cliente confirma desde la vista
-- pública. Los pedidos los puede crear cualquiera (no requiere auth,
-- es el cliente final), pero solo el dueño del local puede leerlos
-- y cambiarles el estado.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  locale_slug text not null references public.locales(slug) on delete cascade,

  -- datos del cliente
  customer_name text not null,
  customer_phone text not null,
  customer_address text default '',
  customer_notes text default '',

  -- modalidad + pago
  delivery_method text not null default 'delivery',  -- 'delivery' | 'pickup'
  payment_method text not null default 'cash',       -- 'cash' | 'mp'

  -- montos
  subtotal numeric not null default 0,
  delivery_fee numeric not null default 0,
  total numeric not null default 0,

  -- detalle del pedido (snapshot, no FK a productos por si cambian)
  items jsonb not null default '[]'::jsonb,
  -- estructura esperada de items:
  -- [{ product_id, name, qty, unit_price, subtotal }]

  -- estado del pedido
  status text not null default 'pending',
  -- 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists orders_locale_idx on public.orders(locale_slug);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);

alter table public.orders enable row level security;

-- Cualquier visitante anónimo puede crear un pedido al local que sea.
drop policy if exists "Orders: anyone can create" on public.orders;
create policy "Orders: anyone can create" on public.orders
  for insert
  with check (true);

-- Solo el dueño del local puede ver los pedidos del local.
drop policy if exists "Orders: owner read" on public.orders;
create policy "Orders: owner read" on public.orders
  for select
  using (
    exists (
      select 1 from public.locales l
      where l.slug = orders.locale_slug
        and l.owner_id = auth.uid()
    )
  );

-- Solo el dueño del local puede cambiar estado / notas.
drop policy if exists "Orders: owner update" on public.orders;
create policy "Orders: owner update" on public.orders
  for update
  using (
    exists (
      select 1 from public.locales l
      where l.slug = orders.locale_slug
        and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.locales l
      where l.slug = orders.locale_slug
        and l.owner_id = auth.uid()
    )
  );

-- Borrado restringido al dueño también.
drop policy if exists "Orders: owner delete" on public.orders;
create policy "Orders: owner delete" on public.orders
  for delete
  using (
    exists (
      select 1 from public.locales l
      where l.slug = orders.locale_slug
        and l.owner_id = auth.uid()
    )
  );

-- Sumar a la publication de realtime para que el dashboard se vea
-- actualizarse cuando entra un pedido nuevo.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    execute 'alter publication supabase_realtime add table public.orders';
  end if;
end$$;
