-- 공개 조회를 위한 RLS 정책 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. 이벤트 테이블 공개 조회 정책
CREATE POLICY IF NOT EXISTS "Public can view events by domain code"
  ON events FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. 랜딩 페이지 테이블 공개 조회 정책
CREATE POLICY IF NOT EXISTS "Public can view landing pages"
  ON landing_pages FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. 페이지 콘텐츠 테이블 공개 조회 정책
CREATE POLICY IF NOT EXISTS "Public can view page contents"
  ON page_contents FOR SELECT
  TO anon, authenticated
  USING (true);

