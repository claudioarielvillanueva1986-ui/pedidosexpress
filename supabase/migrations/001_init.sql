-- ===================================================================
-- Pedido Express · Schema inicial
-- ===================================================================
-- Pegá este archivo entero en Supabase → SQL Editor → New query → Run.
-- Después en API → copiá la URL y la anon key a las variables
-- VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY de Vercel.

-- -------------------------------------------------------------------
-- Tablas
-- -------------------------------------------------------------------

create table if not exists public.locales (
  slug text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slogan text default '',
  logo text default '🔥',
  primary_color text default '#E54B2A',
  whatsapp text default '',
  phone text default '',
  email text default '',
  address text default '',
  local_open boolean default true,

  -- shipping
  delivery_enabled boolean default true,
  pickup_enabled boolean default true,
  shipping_cost numeric default 800,
  shipping_free_from numeric default 12000,
  shipping_zone text default '',
  eta_delivery text default '25-35 min',
  eta_pickup text default '15 min',

  -- payments
  cash_enabled boolean default true,
  transfer_enabled boolean default true,
  alias text default '',
  cbu text default '',
  holder text default '',
  payment_message text default '',

  -- schedule (array de { day, open, from, to })
  schedule jsonb default '[]'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  locale_slug text not null references public.locales(slug) on delete cascade,
  name text not null,
  emoji text default '🍽',
  position int default 0,
  created_at timestamptz default now()
);

create index if not exists categories_locale_idx on public.categories(locale_slug);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  locale_slug text not null references public.locales(slug) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text default '',
  price numeric not null default 0,
  image_url text default '',
  available boolean default true,
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists products_locale_idx on public.products(locale_slug);
create index if not exists products_category_idx on public.products(category_id);

-- -------------------------------------------------------------------
-- Row-Level Security
-- -------------------------------------------------------------------

alter table public.locales enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "Locales: public read" on public.locales;
create policy "Locales: public read" on public.locales for select using (true);

drop policy if exists "Locales: owner insert" on public.locales;
create policy "Locales: owner insert" on public.locales for insert with check (owner_id = auth.uid());

drop policy if exists "Locales: owner update" on public.locales;
create policy "Locales: owner update" on public.locales for update using (owner_id = auth.uid());

drop policy if exists "Locales: owner delete" on public.locales;
create policy "Locales: owner delete" on public.locales for delete using (owner_id = auth.uid());

drop policy if exists "Categories: public read" on public.categories;
create policy "Categories: public read" on public.categories for select using (true);

drop policy if exists "Categories: owner write" on public.categories;
create policy "Categories: owner write" on public.categories
  for all
  using (
    exists (
      select 1 from public.locales l
      where l.slug = categories.locale_slug
        and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.locales l
      where l.slug = categories.locale_slug
        and l.owner_id = auth.uid()
    )
  );

drop policy if exists "Products: public read" on public.products;
create policy "Products: public read" on public.products for select using (true);

drop policy if exists "Products: owner write" on public.products;
create policy "Products: owner write" on public.products
  for all
  using (
    exists (
      select 1 from public.locales l
      where l.slug = products.locale_slug
        and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.locales l
      where l.slug = products.locale_slug
        and l.owner_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------
-- Realtime: dejá que los cambios se vean en vivo en el menú del cliente
-- -------------------------------------------------------------------

alter publication supabase_realtime add table public.locales;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.products;
