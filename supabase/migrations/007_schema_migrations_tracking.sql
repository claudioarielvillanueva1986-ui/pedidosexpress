-- ===================================================================
-- Pedido Express · Tracking de migraciones aplicadas
-- ===================================================================
-- Una tabla simple que registra qué migraciones se corrieron en este
-- proyecto Supabase. Sirve para que cualquiera (o cualquier asistente)
-- pueda preguntar "¿qué migraciones faltan?" con un SELECT en vez de
-- chocar contra errores tipo `relation "public.profiles" does not exist`.
--
-- Convención: cada migración futura termina con un INSERT en esta tabla,
-- usando ON CONFLICT DO NOTHING para que sea idempotente.

create table if not exists public.schema_migrations (
  version text primary key,
  name text not null,
  applied_at timestamptz not null default now()
);

alter table public.schema_migrations enable row level security;

-- Solo el rol admin puede leer la tabla.
drop policy if exists "schema_migrations admin read" on public.schema_migrations;
create policy "schema_migrations admin read" on public.schema_migrations
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Backfill: registrar las migraciones que ya están corridas en este
-- proyecto al momento de aplicar esta. La detección es defensiva: solo
-- inserta si la tabla / columna / policy correspondiente ya existe.

do $$
begin
  -- 001_init.sql: tablas locales/categories/products + RLS base
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'locales')
     and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'categories')
     and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'products')
  then
    insert into public.schema_migrations (version, name)
    values ('001', 'init')
    on conflict (version) do nothing;
  end if;

  -- 002_payment_link.sql: columna payment_link en locales
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'locales' and column_name = 'payment_link'
  ) then
    insert into public.schema_migrations (version, name)
    values ('002', 'payment_link')
    on conflict (version) do nothing;
  end if;

  -- 003_orders.sql: tabla orders + RLS
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'orders') then
    insert into public.schema_migrations (version, name)
    values ('003', 'orders')
    on conflict (version) do nothing;
  end if;

  -- 004_storage.sql: bucket product-images
  if exists (select 1 from storage.buckets where id = 'product-images') then
    insert into public.schema_migrations (version, name)
    values ('004', 'storage')
    on conflict (version) do nothing;
  end if;

  -- 005_profiles_and_status.sql: tabla profiles
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    insert into public.schema_migrations (version, name)
    values ('005', 'profiles_and_status')
    on conflict (version) do nothing;
  end if;

  -- 006_admin_policies.sql: policy admin sobre locales
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'locales' and policyname = 'Locales: admin update all'
  ) then
    insert into public.schema_migrations (version, name)
    values ('006', 'admin_policies')
    on conflict (version) do nothing;
  end if;
end$$;

-- Registrar esta migración.
insert into public.schema_migrations (version, name)
values ('007', 'schema_migrations_tracking')
on conflict (version) do nothing;
