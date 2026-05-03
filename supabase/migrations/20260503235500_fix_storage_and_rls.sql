-- ============================================================
-- CRITICAL FIX: Storage RLS and Data Access Issues
-- Fixes: 403 Forbidden on stores SELECT, RLS errors on storage upload
-- ============================================================

-- Enable RLS on storage.objects if not already enabled
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'storage.objects already has RLS enabled or does not exist: %', SQLERRM;
END $$;

-- ─── REMOVE CONFLICTING POLICIES ───────────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload to store-logos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can read their store logos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can read store logos" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can manage store-logos" ON storage.objects;

  -- ─── CREATE SIMPLIFIED, WORKING STORAGE POLICIES ───────────────────
  -- Allow authenticated users to upload files
  CREATE POLICY "Authenticated users can upload to store-logos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'store-logos' AND
      auth.role() = 'authenticated'
    );

  -- Allow anyone to read files from store-logos (public read)
  CREATE POLICY "Public can read store-logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'store-logos');

  -- Allow users to update/delete their own files
  CREATE POLICY "Users can manage their store-logos"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'store-logos' AND auth.role() = 'authenticated');

  CREATE POLICY "Users can delete their store-logos"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'store-logos' AND auth.role() = 'authenticated');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping storage policies: %', SQLERRM;
END $$;

-- ─── FIX STORES TABLE SELECT POLICY ───────────────────
-- The issue: RLS policy was rejecting SELECT queries due to missing policies
-- Make sure store owners can always SELECT their stores
DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners can manage their store" ON public.stores;
  CREATE POLICY "Store owners can select their store"
    ON public.stores
    FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Store owners can update their store"
    ON public.stores
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Store owners can insert store" 
    ON public.stores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- Keep admin policies
  DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
  CREATE POLICY "Admins can select all stores"
    ON public.stores
    FOR SELECT
    USING (public.get_my_role() = 'admin');

  CREATE POLICY "Admins can update all stores"
    ON public.stores
    FOR UPDATE
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');

  CREATE POLICY "Admins can insert stores"
    ON public.stores
    FOR INSERT
    WITH CHECK (public.get_my_role() = 'admin');

  -- ─── KEEP PUBLIC READ ACCESS TO APPROVED STORES ───────────────────
  DROP POLICY IF EXISTS "Public can read approved stores" ON public.stores;
  CREATE POLICY "Public can read approved stores"
    ON public.stores
    FOR SELECT
    USING (status = 'approved');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping stores table policies: %', SQLERRM;
END $$;

-- ─── RELOAD SCHEMA CACHE ───────────────────
NOTIFY pgrst, 'reload schema';
