-- ============================================================
-- FIX: Products bucket storage RLS policies
-- Issue: Using unreliable storage.foldername() checks
-- Solution: Simple reliable policies based on auth.role()
-- ============================================================

DO $$
BEGIN
  -- Drop existing products policies that use unreliable foldername()
  DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
  DROP POLICY IF EXISTS "Store owners can update product images" ON storage.objects;
  DROP POLICY IF EXISTS "Store owners can delete product images" ON storage.objects;

  -- ─── CREATE NEW RELIABLE POLICIES ───────────────────
  
  -- Allow authenticated users (merchants) to upload product images
  CREATE POLICY "Authenticated users can upload product images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'products' AND
      auth.role() = 'authenticated'
    );

  -- Allow public to view product images (they're in a public bucket)
  CREATE POLICY "Public can read product images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'products');

  -- Allow authenticated users to update product images
  CREATE POLICY "Authenticated users can update product images"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'products' AND
      auth.role() = 'authenticated'
    )
    WITH CHECK (
      bucket_id = 'products' AND
      auth.role() = 'authenticated'
    );

  -- Allow authenticated users to delete product images
  CREATE POLICY "Authenticated users can delete product images"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'products' AND
      auth.role() = 'authenticated'
    );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error setting products bucket policies: %', SQLERRM;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
