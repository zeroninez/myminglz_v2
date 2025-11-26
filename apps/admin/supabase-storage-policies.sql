-- 기존 정책 삭제 (있으면)
DROP POLICY IF EXISTS "Users can upload images to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read images from their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete images from their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can read images" ON storage.objects;

-- 인증된 사용자는 landing-pages 폴더 안의 자신의 폴더에 업로드 가능
CREATE POLICY "Users can upload images to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = 'landing-pages' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 인증된 사용자는 landing-pages 폴더 안의 자신의 폴더에서 파일 읽기 가능
CREATE POLICY "Users can read images from their own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = 'landing-pages' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 인증된 사용자는 landing-pages 폴더 안의 자신의 폴더에서 파일 삭제 가능
CREATE POLICY "Users can delete images from their own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = 'landing-pages' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 공개 읽기 (Public bucket인 경우)
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'event-images');