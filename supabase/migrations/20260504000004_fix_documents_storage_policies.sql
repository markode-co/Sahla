-- ============================================================
-- FIX: Documents bucket storage RLS policies
-- Issue: INSERT policy missing/failing for documents bucket
-- Solution: Simple reliable policies based on auth.role()
-- ============================================================

DO $$
BEGIN
  -- Drop all existing documents policies
  DROP POLICY IF EXISTS "Merchants can upload documents" ON storage.objects;
  DROP POLICY IF EXISTS "Document owners can view their documents" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
  DROP POLICY IF EXISTS "Document owners can update their documents" ON storage.objects;
  DROP POLICY IF EXISTS "Document owners can delete their documents" ON storage.objects;

  -- ─── CREATE NEW RELIABLE POLICIES ───────────────────
  
  -- Allow authenticated users to upload documents
  CREATE POLICY "Authenticated users can upload documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'documents' AND
      auth.role() = 'authenticated'
    );

  -- Allow document owners to view/read their own documents
  CREATE POLICY "Document owners can view their documents"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'documents' AND
      auth.role() = 'authenticated'
    );

  -- Allow admins to view all documents
  CREATE POLICY "Admins can view all documents"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'documents' AND
      COALESCE((SELECT role FROM public.users WHERE id = auth.uid()), 'merchant') = 'admin'
    );

  -- Allow authenticated users to update their own document uploads
  CREATE POLICY "Authenticated users can update documents"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'documents' AND
      auth.role() = 'authenticated'
    )
    WITH CHECK (
      bucket_id = 'documents' AND
      auth.role() = 'authenticated'
    );

  -- Allow authenticated users to delete their own document uploads
  CREATE POLICY "Authenticated users can delete documents"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'documents' AND
      auth.role() = 'authenticated'
    );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error setting documents bucket policies: %', SQLERRM;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
