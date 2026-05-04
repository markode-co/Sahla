-- Fix private storage bucket update/delete policies for documents and receipts

DO $$
BEGIN
  -- Documents bucket: allow authenticated users to update/delete their own files
  DROP POLICY IF EXISTS "Document owners can update their documents" ON storage.objects;
  CREATE POLICY "Document owners can update their documents" ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'documents' AND
      auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'documents' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "Document owners can delete their documents" ON storage.objects;
  CREATE POLICY "Document owners can delete their documents" ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'documents' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Receipts bucket: allow authenticated users to update/delete their own receipt uploads
  DROP POLICY IF EXISTS "Customers can update payment receipts" ON storage.objects;
  CREATE POLICY "Customers can update payment receipts" ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'receipts' AND
      auth.uid() IS NOT NULL
    )
    WITH CHECK (
      bucket_id = 'receipts' AND
      auth.uid() IS NOT NULL
    );

  DROP POLICY IF EXISTS "Customers can delete payment receipts" ON storage.objects;
  CREATE POLICY "Customers can delete payment receipts" ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'receipts' AND
      auth.uid() IS NOT NULL
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping private storage policy migration: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
