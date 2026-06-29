-- ===================================================================
-- Sumar columna payment_link a la tabla locales
-- ===================================================================
-- Si ya corriste 001_init.sql y estás trabajando en una DB ya creada,
-- pegá este SQL en Supabase → SQL Editor → New query → Run.
-- Si todavía no corriste 001_init.sql, ignorá esto: la columna ya
-- viene incluida en migrations futuras.

alter table public.locales
  add column if not exists payment_link text default '';
