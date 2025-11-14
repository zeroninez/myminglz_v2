-- 인증 코드 테이블 생성
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이메일 인덱스 (빠른 검색)
CREATE INDEX IF NOT EXISTS idx_verification_codes_email 
ON verification_codes(email, used, expires_at);

-- 만료된 코드 자동 삭제 (optional)
-- 매일 자동 정리
CREATE OR REPLACE FUNCTION delete_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) 설정 - API에서 접근 가능하도록
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- anon/authenticated 키로 접근 가능하도록 설정
CREATE POLICY "Enable insert for anon" 
ON verification_codes 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for anon" 
ON verification_codes 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Enable update for anon" 
ON verification_codes 
FOR UPDATE 
TO anon, authenticated
USING (true);

COMMENT ON TABLE verification_codes IS '이메일 인증 코드 저장';
COMMENT ON COLUMN verification_codes.email IS '인증 요청 이메일';
COMMENT ON COLUMN verification_codes.code IS '6자리 인증 코드';
COMMENT ON COLUMN verification_codes.expires_at IS '만료 시간 (10분)';
COMMENT ON COLUMN verification_codes.used IS '사용 여부';

-- ============================================
-- 이벤트/프로젝트 관련 테이블 (기존 테이블과 독립적으로 추가)
-- ============================================

-- 이벤트/프로젝트 메인 테이블
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  domain_code VARCHAR(100) UNIQUE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  background_color VARCHAR(7) DEFAULT '#000000',
  description TEXT, -- 이벤트 설명 (일반 텍스트)
  content_html TEXT, -- 이벤트 상세 내용 (리치 텍스트/HTML, TinyMCE 에디터 콘텐츠)
  coupon_preview_image_url VARCHAR(500), -- 쿠폰 미리보기 이미지 URL
  mission_config JSONB, -- 이벤트 미션 설정 (JSON 형태로 저장)
  event_info_config JSONB, -- 이벤트 정보 설정 (사용처 등록 등 JSON 형태)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 도메인 코드 인덱스 (빠른 검색)
CREATE INDEX IF NOT EXISTS idx_events_domain_code ON events(domain_code);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

-- 랜딩 페이지 테이블
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  page_type VARCHAR(50) NOT NULL, -- '표지', '본문 1', '본문 2', '본문 3', '갤러리', '기타'
  template_type VARCHAR(50) NOT NULL, -- '유형1', '유형2'
  background_color VARCHAR(7) DEFAULT '#000000',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, page_number)
);

-- 이벤트별 페이지 인덱스
CREATE INDEX IF NOT EXISTS idx_landing_pages_event_id ON landing_pages(event_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_event_page ON landing_pages(event_id, page_number);

-- 페이지 콘텐츠 테이블 (텍스트, 색상, 표시 여부)
CREATE TABLE IF NOT EXISTS page_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE NOT NULL,
  field_id VARCHAR(50) NOT NULL, -- 'label', 'titlePrimary', 'titleSecondary', 'subtitle', 'body1', 'body2', 'body3'
  field_value TEXT, -- 일반 텍스트 또는 HTML 콘텐츠
  field_color VARCHAR(7),
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(landing_page_id, field_id)
);

-- 이벤트 이미지 테이블 (업로드된 이미지 관리)
CREATE TABLE IF NOT EXISTS event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  image_url VARCHAR(500) NOT NULL, -- Supabase Storage URL 또는 외부 URL
  image_path VARCHAR(500), -- Storage 내부 경로
  file_name VARCHAR(255),
  file_size INTEGER, -- 바이트 단위
  mime_type VARCHAR(100), -- 'image/jpeg', 'image/png' 등
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이벤트 이미지 인덱스
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_uploaded_by ON event_images(uploaded_by);

-- 페이지 콘텐츠 인덱스
CREATE INDEX IF NOT EXISTS idx_page_contents_landing_page_id ON page_contents(landing_page_id);

-- updated_at 자동 업데이트 함수 (기존 테이블과 공유)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 설정 (기존 트리거가 있으면 삭제 후 재생성)
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON landing_pages;
CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_page_contents_updated_at ON page_contents;
CREATE TRIGGER update_page_contents_updated_at
  BEFORE UPDATE ON page_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_images_updated_at ON event_images;
CREATE TRIGGER update_event_images_updated_at
  BEFORE UPDATE ON event_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 설정
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

-- 이벤트 테이블 정책: 사용자는 자신의 이벤트만 접근 가능
DROP POLICY IF EXISTS "Users can view their own events" ON events;
CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 공개 조회 정책: 도메인 코드로 이벤트 조회 (인증 불필요)
DROP POLICY IF EXISTS "Public can view events by domain code" ON events;
CREATE POLICY "Public can view events by domain code"
  ON events FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own events" ON events;
CREATE POLICY "Users can insert their own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own events" ON events;
CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own events" ON events;
CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 랜딩 페이지 테이블 정책: 이벤트 소유자만 접근 가능
DROP POLICY IF EXISTS "Users can manage landing pages for their events" ON landing_pages;
CREATE POLICY "Users can manage landing pages for their events"
  ON landing_pages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = landing_pages.event_id
      AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = landing_pages.event_id
      AND events.user_id = auth.uid()
    )
  );

-- 공개 조회 정책: 랜딩 페이지 조회 (인증 불필요)
DROP POLICY IF EXISTS "Public can view landing pages" ON landing_pages;
CREATE POLICY "Public can view landing pages"
  ON landing_pages FOR SELECT
  TO anon, authenticated
  USING (true);

-- 페이지 콘텐츠 테이블 정책: 랜딩 페이지 소유자만 접근 가능
DROP POLICY IF EXISTS "Users can manage page contents for their landing pages" ON page_contents;
CREATE POLICY "Users can manage page contents for their landing pages"
  ON page_contents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM landing_pages lp
      JOIN events e ON e.id = lp.event_id
      WHERE lp.id = page_contents.landing_page_id
      AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM landing_pages lp
      JOIN events e ON e.id = lp.event_id
      WHERE lp.id = page_contents.landing_page_id
      AND e.user_id = auth.uid()
    )
  );

-- 공개 조회 정책: 페이지 콘텐츠 조회 (인증 불필요)
DROP POLICY IF EXISTS "Public can view page contents" ON page_contents;
CREATE POLICY "Public can view page contents"
  ON page_contents FOR SELECT
  TO anon, authenticated
  USING (true);

-- 이벤트 이미지 테이블 정책: 이벤트 소유자만 접근 가능
DROP POLICY IF EXISTS "Users can manage images for their events" ON event_images;
CREATE POLICY "Users can manage images for their events"
  ON event_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_images.event_id
      AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_images.event_id
      AND events.user_id = auth.uid()
    )
  );

-- 코멘트 추가
COMMENT ON TABLE events IS '이벤트/프로젝트 메인 정보';
COMMENT ON COLUMN events.domain_code IS 'URL에 사용될 도메인 코드 (고유값)';
COMMENT ON COLUMN events.mission_config IS '이벤트 미션 설정 (JSON)';

COMMENT ON TABLE landing_pages IS '랜딩 페이지 정보';
COMMENT ON COLUMN landing_pages.page_type IS '페이지 유형: 표지, 본문 1, 본문 2, 본문 3, 갤러리, 기타';
COMMENT ON COLUMN landing_pages.template_type IS '템플릿 유형: 유형1, 유형2';

COMMENT ON TABLE page_contents IS '페이지별 콘텐츠 (텍스트, 색상, 표시 여부)';
COMMENT ON COLUMN page_contents.field_id IS '필드 ID: label, titlePrimary, titleSecondary, subtitle, body1, body2, body3';
COMMENT ON COLUMN page_contents.field_value IS '필드 값 (일반 텍스트 또는 HTML 콘텐츠)';

COMMENT ON TABLE event_images IS '이벤트에 업로드된 이미지 관리';
COMMENT ON COLUMN event_images.image_url IS '이미지 공개 URL';
COMMENT ON COLUMN event_images.image_path IS 'Supabase Storage 내부 경로';
COMMENT ON COLUMN events.content_html IS '이벤트 상세 내용 (TinyMCE 리치 텍스트 에디터 HTML 콘텐츠)';
COMMENT ON COLUMN events.event_info_config IS '이벤트 정보 설정 (사용처 등록 등 JSON 형태)';

