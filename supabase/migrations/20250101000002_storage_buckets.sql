-- =====================================================
-- HMAPP v5.0 - STORAGE BUCKETS & POLICIES
-- =====================================================

-- =====================================================
-- إنشاء الـ Buckets
-- =====================================================

-- Avatars bucket (public - for profile photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Job photos bucket (public - for job images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos', 
  'job-photos', 
  true, 
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Documents bucket (private - for company documents/CR)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false, 
  20971520,  -- 20MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- Storage Policies - Avatars
-- =====================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "avatars_user_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- Storage Policies - Job Photos
-- =====================================================

-- Anyone can view job photos (public bucket)
CREATE POLICY "job_photos_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'job-photos');

-- Authenticated users can upload job photos
CREATE POLICY "job_photos_user_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'job-photos' 
    AND auth.uid() IS NOT NULL
  );

-- Users can update their own job photos
CREATE POLICY "job_photos_user_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'job-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own job photos
CREATE POLICY "job_photos_user_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'job-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- Storage Policies - Documents (Private)
-- =====================================================

-- Only document owner can view
CREATE POLICY "documents_owner_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all documents
CREATE POLICY "documents_admin_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' 
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Authenticated users can upload documents
CREATE POLICY "documents_user_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own documents
CREATE POLICY "documents_user_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own documents
CREATE POLICY "documents_user_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
