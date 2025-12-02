-- 페이지 방문 로그 테이블 (유입 수 추적)
CREATE TABLE IF NOT EXISTS page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  domain_code VARCHAR(100) NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45), -- IPv6 지원을 위해 45자
  referer TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_page_visits_event_id ON page_visits(event_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_domain_code ON page_visits(domain_code);
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_event_visited ON page_visits(event_id, visited_at);

-- Row Level Security (RLS) 설정
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- 공개 삽입 정책: 누구나 방문 로그를 기록할 수 있음
DROP POLICY IF EXISTS "Public can insert page visits" ON page_visits;
CREATE POLICY "Public can insert page visits"
  ON page_visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 조회 정책: 이벤트 소유자만 자신의 이벤트 방문 로그 조회 가능
DROP POLICY IF EXISTS "Users can view their event visits" ON page_visits;
CREATE POLICY "Users can view their event visits"
  ON page_visits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = page_visits.event_id
      AND events.user_id = auth.uid()
    )
  );

-- 코멘트
COMMENT ON TABLE page_visits IS '이벤트 랜딩 페이지 방문 로그 (유입 수 추적)';
COMMENT ON COLUMN page_visits.event_id IS '방문한 이벤트 ID';
COMMENT ON COLUMN page_visits.domain_code IS '도메인 코드 (빠른 조회용)';
COMMENT ON COLUMN page_visits.visited_at IS '방문 시간';

