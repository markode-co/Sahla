-- Setup avatars bucket and RLS policies

DO $$
BEGIN
  -- Create or update avatars bucket
  INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Avatars bucket already exists or error: %', SQLERRM;
END $$;

-- Note: RLS policies for storage.objects must be set via Supabase Dashboard
-- because the migration user doesn't have owner permissions on storage.objects.
-- Required policies for avatars bucket:
--
-- 1. "Authenticated users can upload avatars" ON storage.objects
--    FOR INSERT WITH CHECK (
--      bucket_id = 'avatars' AND
--      auth.uid() IS NOT NULL AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
-- 2. "Public can view avatars" ON storage.objects
--    FOR SELECT USING (bucket_id = 'avatars');
--
-- 3. "Users can update own avatars" ON storage.objects
--    FOR UPDATE USING (
--      bucket_id = 'avatars' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
-- 4. "Users can delete own avatars" ON storage.objects
--    FOR DELETE USING (
--      bucket_id = 'avatars' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );

NOTIFY pgrst, 'reload schema';
