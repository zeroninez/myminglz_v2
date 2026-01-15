-- Store Images 업로드 정책 추가
-- event-images bucket의 store-images 폴더에 대한 업로드 권한 부여

-- 1. INSERT 정책 (업로드 허용)
CREATE POLICY "Allow authenticated users to upload to store-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' 
  AND (storage.foldername(name))[1] = 'store-images'
);

-- 2. SELECT 정책 (조회 허용)
CREATE POLICY "Allow public read access to store-images"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'event-images' 
  AND (storage.foldername(name))[1] = 'store-images'
);

-- 3. UPDATE 정책 (수정 허용 - 필요시)
CREATE POLICY "Allow authenticated users to update store-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images' 
  AND (storage.foldername(name))[1] = 'store-images'
)
WITH CHECK (
  bucket_id = 'event-images' 
  AND (storage.foldername(name))[1] = 'store-images'
);

-- 4. DELETE 정책 (삭제 허용 - 필요시)
CREATE POLICY "Allow authenticated users to delete store-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' 
  AND (storage.foldername(name))[1] = 'store-images'
);
