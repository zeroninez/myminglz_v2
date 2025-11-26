-- 특정 이벤트의 페이지 1을 유형2로 업데이트하는 예제
-- 이벤트 ID나 domain_code를 실제 값으로 변경해서 사용하세요

-- 방법 1: 이벤트 ID로 업데이트
-- UPDATE landing_pages
-- SET template_type = '유형2',
--     updated_at = NOW()
-- WHERE event_id = 'your-event-id-here'
--   AND page_number = 1;

-- 방법 2: domain_code로 업데이트 (더 편리함)
UPDATE landing_pages
SET template_type = '유형2',
    updated_at = NOW()
WHERE event_id IN (
  SELECT id FROM events WHERE domain_code = 'your-domain-code-here'
)
AND page_number = 1;

-- 업데이트 확인
SELECT 
  lp.id,
  lp.page_number,
  lp.page_type,
  lp.template_type,
  e.domain_code
FROM landing_pages lp
JOIN events e ON lp.event_id = e.id
WHERE e.domain_code = 'your-domain-code-here'
ORDER BY lp.page_number;

