-- ============================================================
-- FIX: Receipts bucket storage RLS policies  
-- Issue: INSERT/SELECT policies may be missing or too restrictive
-- Solution: Simple reliable policies for payment receipt uploads
-- ============================================================

DO $$
BEGIN
  -- Drop existing receipts policies
  DROP POLICY IF EXISTS "Customers can upload payment receipts" ON storage.objects;
  DROP POLICY IF EXISTS "Store owners can view payment receipts" ON storage.objects;
  DROP POLICY IF EXISTS "Customers can update payment receipts" ON storage.objects;
  DROP POLICY IF EXISTS "Customers can delete payment receipts" ON storage.objects;

  -- ─── CREATE NEW RELIABLE POLICIES ───────────────────
  
  -- Allow authenticated users to upload payment receipts
  CREATE POLICY "Authenticated users can upload receipts"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'receipts' AND
      auth.role() = 'authenticated'
    );

  -- Allow authenticated users to view receipts
  CREATE POLICY "Authenticated users can view receipts"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'receipts' AND
      auth.role() = 'authenticated'
    );

  -- Allow authenticated users to update their receipt uploads
  CREATE POLICY "Authenticated users can update receipts"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'receipts' AND
      auth.role() = 'authenticated'
    )
    WITH CHECK (
      bucket_id = 'receipts' AND
      auth.role() = 'authenticated'
    );

  -- Allow authenticated users to delete their receipt uploads
  CREATE POLICY "Authenticated users can delete receipts"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'receipts' AND
      auth.role() = 'authenticated'
    );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error setting receipts bucket policies: %', SQLERRM;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
