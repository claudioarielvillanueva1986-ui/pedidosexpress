-- ===================================================================
-- Pedido Express · Storage bucket para imágenes de productos
-- ===================================================================
-- Crea un bucket público "product-images" donde los comerciantes
-- suben las fotos de sus productos y el logo de su local. La lectura
-- es pública (cualquier cliente puede ver las fotos) y la escritura
-- queda restringida a usuarios autenticados.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Las policies sobre storage.objects ya existen por defecto en
-- Supabase para algunos roles. Acá las re-creamos de forma idempotente
-- para garantizar el comportamiento que queremos.

drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read" on storage.objects
  for select
  using (bucket_id = 'product-images');

drop policy if exists "product-images auth insert" on storage.objects;
create policy "product-images auth insert" on storage.objects
  for insert
  with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
  );

drop policy if exists "product-images owner update" on storage.objects;
create policy "product-images owner update" on storage.objects
  for update
  using (
    bucket_id = 'product-images'
    and auth.uid() = owner
  );

drop policy if exists "product-images owner delete" on storage.objects;
create policy "product-images owner delete" on storage.objects
  for delete
  using (
    bucket_id = 'product-images'
    and auth.uid() = owner
  );
