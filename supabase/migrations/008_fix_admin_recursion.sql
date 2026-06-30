-- ===================================================================
-- Pedido Express · Fix RLS infinite recursion en admin policies
-- ===================================================================
-- La migración 005 creó la policy "profile admin read all" sobre
-- public.profiles cuyo USING hace
--   exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
-- Es una subquery a la MISMA tabla sobre la que se evalúa RLS.
-- Postgres detecta la auto-referencia y aborta cada SELECT a profiles
-- vía PostgREST con error
--   42P17  infinite recursion detected in policy for relation "profiles"
-- Eso rompía la lectura del propio profile del usuario, así que el
-- frontend mostraba "Acceso restringido" incluso para el admin (cuya
-- fila en la DB tenía role='admin' y se veía bien desde el SQL Editor
-- porque el rol postgres del dashboard bypasea RLS).
--
-- Las policies admin de la 006 sobre locales/orders/categories/products
-- también hacen `exists (select 1 from profiles ...)`, pero por lo
-- general no causan recursión porque corren contra otra tabla. Aun así
-- las migramos al mismo helper para que la lógica de "soy admin" viva
-- en un único lugar y para evitar evaluar la subquery una vez por fila.
--
-- Fix: helper SECURITY DEFINER public.is_admin() que hace el lookup
-- saltando RLS (corre con privilegios del owner = postgres) y reemplazar
-- cada policy admin para llamarlo en vez de inline subquery sobre profiles.

-- -------------------------------------------------------------------
-- Helper: ¿el caller actual es admin?
-- -------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- -------------------------------------------------------------------
-- profiles: reemplazar la recursiva (FOR SELECT) y la de update
-- -------------------------------------------------------------------
drop policy if exists "profile admin read all" on public.profiles;
create policy "profile admin read all" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profile admin update" on public.profiles;
create policy "profile admin update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------------
-- locales: admin lectura / update / delete
-- -------------------------------------------------------------------
drop policy if exists "Locales: admin read all" on public.locales;
create policy "Locales: admin read all" on public.locales
  for select using (public.is_admin());

drop policy if exists "Locales: admin update all" on public.locales;
create policy "Locales: admin update all" on public.locales
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Locales: admin delete" on public.locales;
create policy "Locales: admin delete" on public.locales
  for delete using (public.is_admin());

-- -------------------------------------------------------------------
-- orders, categories, products: admin lectura
-- -------------------------------------------------------------------
drop policy if exists "Orders: admin read all" on public.orders;
create policy "Orders: admin read all" on public.orders
  for select using (public.is_admin());

drop policy if exists "Categories: admin read all" on public.categories;
create policy "Categories: admin read all" on public.categories
  for select using (public.is_admin());

drop policy if exists "Products: admin read all" on public.products;
create policy "Products: admin read all" on public.products
  for select using (public.is_admin());

-- -------------------------------------------------------------------
-- schema_migrations (007): si la tabla ya existe la migramos a is_admin()
-- también. Si todavía no existe (la 007 corre después de esta), la 007
-- la crea con su propia policy y queda con inline subquery — no es
-- recursiva (corre sobre schema_migrations) así que no rompe nada.
-- -------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'schema_migrations'
  ) then
    execute 'drop policy if exists "schema_migrations admin read" on public.schema_migrations';
    execute 'create policy "schema_migrations admin read" on public.schema_migrations '
         || 'for select using (public.is_admin())';
  end if;
end$$;

-- -------------------------------------------------------------------
-- Self-registro en schema_migrations (idempotente). Solo corre si la
-- 007 ya creó la tabla; si no, la 007 detectará esta migración por la
-- presencia de la función is_admin() en su backfill.
-- -------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'schema_migrations'
  ) then
    insert into public.schema_migrations (version, name)
    values ('008', 'fix_admin_recursion')
    on conflict (version) do nothing;
  end if;
end$$;
