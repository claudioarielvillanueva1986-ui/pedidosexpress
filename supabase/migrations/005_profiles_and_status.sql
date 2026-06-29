-- ===================================================================
-- Pedido Express · Profiles, customer addresses, locale status
-- ===================================================================
-- - profiles: una fila por usuario auth con su rol (customer, merchant, admin)
-- - customer_addresses: direcciones guardadas del cliente
-- - locales.status: pending_review | active | suspended
-- - orders.customer_id: link opcional a auth.users del cliente

-- -------------------------------------------------------------------
-- Profiles
-- -------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','merchant','admin')),
  full_name text default '',
  phone text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profile self read" on public.profiles;
create policy "profile self read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profile self upsert" on public.profiles;
create policy "profile self upsert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profile admin read all" on public.profiles;
create policy "profile admin read all" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Auto-crear profile cuando se crea un usuario auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Crear profile para usuarios que ya existían antes de esta migración
insert into public.profiles (id, role)
select id, 'customer' from auth.users
where not exists (select 1 from public.profiles p where p.id = auth.users.id)
on conflict (id) do nothing;

-- Los users que ya tienen locales son merchants
update public.profiles p
  set role = 'merchant'
  where role = 'customer'
  and exists (select 1 from public.locales l where l.owner_id = p.id);

-- -------------------------------------------------------------------
-- Customer addresses
-- -------------------------------------------------------------------

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text default '',
  address text not null,
  notes text default '',
  is_default boolean default false,
  created_at timestamptz default now()
);

create index if not exists customer_addresses_owner_idx on public.customer_addresses(owner_id);

alter table public.customer_addresses enable row level security;

drop policy if exists "address self all" on public.customer_addresses;
create policy "address self all" on public.customer_addresses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- -------------------------------------------------------------------
-- Locale status (aprobación manual del admin)
-- -------------------------------------------------------------------

alter table public.locales
  add column if not exists status text default 'pending_review'
  check (status in ('pending_review','active','suspended'));

-- Los locales que ya existían antes los marcamos como activos.
update public.locales set status = 'active' where status is null;

-- Filtrar lectura pública para que solo vean los activos.
-- Los dueños siguen viendo el suyo (independientemente del status).
drop policy if exists "Locales: public read" on public.locales;
create policy "Locales: public read active" on public.locales
  for select
  using (status = 'active' or owner_id = auth.uid());

-- -------------------------------------------------------------------
-- Order owner link (opcional, para historial del cliente)
-- -------------------------------------------------------------------

alter table public.orders
  add column if not exists customer_id uuid references auth.users(id) on delete set null;

create index if not exists orders_customer_idx on public.orders(customer_id);

-- Permitir al cliente leer sus propios pedidos (no solo el merchant).
drop policy if exists "Orders: customer self read" on public.orders;
create policy "Orders: customer self read" on public.orders
  for select using (customer_id = auth.uid());
