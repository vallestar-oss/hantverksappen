-- Hardening found by auditing the live database (2026-09-19).
--
-- 1. Storage: any logged-in user could upload to, or overwrite, ANY path in the
--    "logos" bucket. Restrict writes to the user's own folder (<user_id>/...).
-- 2. Document numbers had no uniqueness guarantee; add per-user unique indexes.
-- 3. Drop two duplicate policies (identical copies exist for invoices and
--    invoice_items).

-- 1. logos bucket ------------------------------------------------------------
drop policy if exists "Authenticated users can upload logos" on storage.objects;
drop policy if exists "Users can update their own logos" on storage.objects;

create policy "Users upload to own logo folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own logos" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2. unique numbering --------------------------------------------------------
create unique index if not exists quotes_user_number_key on public.quotes (user_id, quote_number);
create unique index if not exists invoices_user_number_key on public.invoices (user_id, invoice_number);

-- 3. duplicate policies ------------------------------------------------------
drop policy if exists "Users manage own invoices" on public.invoices;
drop policy if exists "Users manage own invoice items" on public.invoice_items;
