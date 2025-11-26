-- 현재 DB에 저장된 template_type 값 확인
-- 유형2로 저장된 페이지가 있는지 확인

SELECT 
  id,
  event_id,
  page_number,
  page_type,
  template_type,
  background_color
FROM landing_pages
WHERE template_type = '유형2'
ORDER BY event_id, page_number;

-- 모든 템플릿 유형 통계 확인
SELECT 
  template_type,
  COUNT(*) as count
FROM landing_pages
GROUP BY template_type
ORDER BY template_type;

-- 특정 이벤트의 템플릿 유형 확인 (이벤트 ID를 바꿔서 사용)
-- SELECT 
--   lp.id,
--   lp.page_number,
--   lp.page_type,
--   lp.template_type,
--   e.domain_code
-- FROM landing_pages lp
-- JOIN events e ON lp.event_id = e.id
-- WHERE e.domain_code = 'your-domain-code-here'
-- ORDER BY lp.page_number;

