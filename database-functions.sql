-- 🚀 최적화된 방문 통계 함수
CREATE OR REPLACE FUNCTION get_visits_stats(
  event_ids UUID[],
  start_date TIMESTAMP DEFAULT NULL,
  end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
  event_id UUID,
  total_visits BIGINT,
  hourly_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.event_id,
    COUNT(*) as total_visits,
    jsonb_agg(
      jsonb_build_object(
        'hour', EXTRACT(HOUR FROM pv.visited_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') || '시',
        'inflow', hour_count.count
      ) ORDER BY EXTRACT(HOUR FROM pv.visited_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
    ) as hourly_data
  FROM page_visits pv
  LEFT JOIN (
    SELECT 
      event_id,
      EXTRACT(HOUR FROM visited_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as hour,
      COUNT(*) as count
    FROM page_visits
    WHERE event_id = ANY(event_ids)
      AND (start_date IS NULL OR visited_at >= start_date)
      AND (end_date IS NULL OR visited_at <= end_date)
    GROUP BY event_id, EXTRACT(HOUR FROM visited_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
  ) hour_count ON pv.event_id = hour_count.event_id
  WHERE pv.event_id = ANY(event_ids)
    AND (start_date IS NULL OR pv.visited_at >= start_date)
    AND (end_date IS NULL OR pv.visited_at <= end_date)
  GROUP BY pv.event_id;
END;
$$ LANGUAGE plpgsql;

-- 🚀 최적화된 쿠폰 통계 함수
CREATE OR REPLACE FUNCTION get_coupons_stats(
  location_ids UUID[],
  start_date TIMESTAMP DEFAULT NULL,
  end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
  location_id UUID,
  total_issued BIGINT,
  total_used BIGINT,
  hourly_issued JSONB,
  hourly_used JSONB,
  store_validations JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.location_id,
    COUNT(*) as total_issued,
    COUNT(*) FILTER (WHERE c.is_used = true) as total_used,
    
    -- 시간대별 발급 수 (한국 시간 기준)
    jsonb_agg(
      jsonb_build_object(
        'hour', EXTRACT(HOUR FROM c.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') || '시',
        'issuance', issued_by_hour.count
      ) ORDER BY EXTRACT(HOUR FROM c.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
    ) as hourly_issued,
    
    -- 시간대별 사용 수 (한국 시간 기준)
    jsonb_agg(
      jsonb_build_object(
        'hour', EXTRACT(HOUR FROM c.used_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') || '시',
        'usage', used_by_hour.count
      ) ORDER BY EXTRACT(HOUR FROM c.used_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
    ) FILTER (WHERE c.used_at IS NOT NULL) as hourly_used,
    
    -- 스토어별 검증 수
    jsonb_object_agg(
      c.validated_by_store_id::text,
      validation_counts.count
    ) as store_validations
    
  FROM coupons c
  LEFT JOIN (
    SELECT 
      location_id,
      EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as hour,
      COUNT(*) as count
    FROM coupons
    WHERE location_id = ANY(location_ids)
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date)
    GROUP BY location_id, EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
  ) issued_by_hour ON c.location_id = issued_by_hour.location_id
  
  LEFT JOIN (
    SELECT 
      location_id,
      EXTRACT(HOUR FROM used_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as hour,
      COUNT(*) as count
    FROM coupons
    WHERE location_id = ANY(location_ids)
      AND is_used = true
      AND used_at IS NOT NULL
      AND (start_date IS NULL OR used_at >= start_date)
      AND (end_date IS NULL OR used_at <= end_date)
    GROUP BY location_id, EXTRACT(HOUR FROM used_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
  ) used_by_hour ON c.location_id = used_by_hour.location_id
  
  LEFT JOIN (
    SELECT 
      location_id,
      validated_by_store_id,
      COUNT(*) as count
    FROM coupons
    WHERE location_id = ANY(location_ids)
      AND validated_by_store_id IS NOT NULL
      AND validated_at IS NOT NULL
      AND (start_date IS NULL OR validated_at >= start_date)
      AND (end_date IS NULL OR validated_at <= end_date)
    GROUP BY location_id, validated_by_store_id
  ) validation_counts ON c.location_id = validation_counts.location_id
  
  WHERE c.location_id = ANY(location_ids)
    AND (start_date IS NULL OR c.created_at >= start_date)
    AND (end_date IS NULL OR c.created_at <= end_date)
  GROUP BY c.location_id;
END;
$$ LANGUAGE plpgsql;

-- 🚀 인덱스 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_visits_event_visited_hour 
ON page_visits (event_id, visited_at, EXTRACT(HOUR FROM visited_at));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_location_created_hour 
ON coupons (location_id, created_at, EXTRACT(HOUR FROM created_at));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_location_used_hour 
ON coupons (location_id, used_at, EXTRACT(HOUR FROM used_at)) 
WHERE is_used = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_validation 
ON coupons (location_id, validated_by_store_id, validated_at) 
WHERE validated_by_store_id IS NOT NULL;