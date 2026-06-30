-- ===================================================================
-- Pedido Express · Policies para el rol admin
-- ===================================================================
-- El admin puede:
-- - Leer y actualizar todos los locales (aprobar / suspender).
-- - Leer todos los profiles (saber quién es el dueño de cada local).
-- - Leer todos los orders y categories/products (auditoría).
-- - Actualizar el role de cualquier profile (promover/demover).

-- Locales: admin puede leer y actualizar todos
drop policy if exists "Locales: admin read all" on public.locales;
create policy "Locales: admin read all" on public.locales
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Locales: admin update all" on public.locales;
create policy "Locales: admin update all" on public.locales
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Locales: admin delete" on public.locales;
create policy "Locales: admin delete" on public.locales
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Profiles: admin puede actualizar roles
drop policy if exists "profile admin update" on public.profiles;
create policy "profile admin update" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Orders: admin puede leer todos
drop policy if exists "Orders: admin read all" on public.orders;
create policy "Orders: admin read all" on public.orders
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Categories: admin puede leer todas
drop policy if exists "Categories: admin read all" on public.categories;
create policy "Categories: admin read all" on public.categories
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Products: admin puede leer todos
drop policy if exists "Products: admin read all" on public.products;
create policy "Products: admin read all" on public.products
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
