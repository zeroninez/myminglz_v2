-- 이벤트 'ddd'에 대한 기본 랜딩 페이지 생성
-- 이벤트 ID: e5008cb6-32f9-4030-851c-74a075be4792

-- 1. 랜딩 페이지 생성 (5개 페이지) - 기존 데이터가 있으면 건너뜀
-- 이벤트의 background_color를 사용
INSERT INTO "public"."landing_pages" 
  ("id", "event_id", "page_number", "page_type", "template_type", "background_color", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  'e5008cb6-32f9-4030-851c-74a075be4792',
  page_num,
  CASE WHEN page_num = 1 THEN '표지' ELSE '기타' END,
  '유형1',
  COALESCE(e.background_color, '#000000'),
  NOW(),
  NOW()
FROM generate_series(1, 5) AS page_num
CROSS JOIN (SELECT background_color FROM events WHERE id = 'e5008cb6-32f9-4030-851c-74a075be4792') AS e
WHERE NOT EXISTS (
  SELECT 1 FROM landing_pages
  WHERE event_id = 'e5008cb6-32f9-4030-851c-74a075be4792'
    AND page_number = page_num
)
RETURNING id, page_number;

-- 2. 페이지 1 (표지)의 기본 콘텐츠 생성 - 기존 데이터가 있으면 건너뜀
DO $$
DECLARE
  landing_page_1_id UUID;
BEGIN
  SELECT id INTO landing_page_1_id
  FROM landing_pages
  WHERE event_id = 'e5008cb6-32f9-4030-851c-74a075be4792'
    AND page_number = 1
  LIMIT 1;

  IF landing_page_1_id IS NOT NULL THEN
    -- 페이지 1 기본 콘텐츠 생성 (기존 데이터가 없을 때만)
    INSERT INTO "public"."page_contents" 
      ("landing_page_id", "field_id", "field_value", "field_color", "is_visible", "created_at", "updated_at")
    SELECT
      landing_page_1_id,
      field_id_val,
      field_value_val,
      field_color_val,
      true,
      NOW(),
      NOW()
    FROM (VALUES
      ('label', '라벨영역', '#FFFFFF'),
      ('titlePrimary', '타이틀영역', '#FFFFFF'),
      ('titleSecondary', '타이틀영역', '#FFFFFF'),
      ('subtitle', '서브타이틀영역', '#D1D5DB'),
      ('body1', '본문영역', '#E5E7EB'),
      ('body2', '본문영역', '#E5E7EB'),
      ('body3', '본문영역', '#E5E7EB')
    ) AS t(field_id_val, field_value_val, field_color_val)
    WHERE NOT EXISTS (
      SELECT 1 FROM page_contents
      WHERE landing_page_id = landing_page_1_id
        AND field_id = t.field_id_val
    );
  END IF;
END $$;

-- 이벤트 'zeroninez'에 대한 기본 랜딩 페이지 생성
-- 이벤트 ID: a116f8c4-af0f-442c-9b5a-c2e9555d2165

-- 1. 랜딩 페이지 생성 (5개 페이지) - 기존 데이터가 있으면 건너뜀
-- 이벤트의 background_color를 사용
INSERT INTO "public"."landing_pages" 
  ("id", "event_id", "page_number", "page_type", "template_type", "background_color", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  'a116f8c4-af0f-442c-9b5a-c2e9555d2165',
  page_num,
  CASE WHEN page_num = 1 THEN '표지' ELSE '기타' END,
  '유형1',
  COALESCE(e.background_color, '#000000'),
  NOW(),
  NOW()
FROM generate_series(1, 5) AS page_num
CROSS JOIN (SELECT background_color FROM events WHERE id = 'a116f8c4-af0f-442c-9b5a-c2e9555d2165') AS e
WHERE NOT EXISTS (
  SELECT 1 FROM landing_pages
  WHERE event_id = 'a116f8c4-af0f-442c-9b5a-c2e9555d2165'
    AND page_number = page_num
)
RETURNING id, page_number;

-- 2. 페이지 1 (표지)의 기본 콘텐츠 생성 - 기존 데이터가 있으면 건너뜀
DO $$
DECLARE
  landing_page_1_id UUID;
BEGIN
  SELECT id INTO landing_page_1_id
  FROM landing_pages
  WHERE event_id = 'a116f8c4-af0f-442c-9b5a-c2e9555d2165'
    AND page_number = 1
  LIMIT 1;

  IF landing_page_1_id IS NOT NULL THEN
    -- 페이지 1 기본 콘텐츠 생성 (기존 데이터가 없을 때만)
    INSERT INTO "public"."page_contents" 
      ("landing_page_id", "field_id", "field_value", "field_color", "is_visible", "created_at", "updated_at")
    SELECT
      landing_page_1_id,
      field_id_val,
      field_value_val,
      field_color_val,
      true,
      NOW(),
      NOW()
    FROM (VALUES
      ('label', '라벨영역', '#FFFFFF'),
      ('titlePrimary', '타이틀영역', '#FFFFFF'),
      ('titleSecondary', '타이틀영역', '#FFFFFF'),
      ('subtitle', '서브타이틀영역', '#D1D5DB'),
      ('body1', '본문영역', '#E5E7EB'),
      ('body2', '본문영역', '#E5E7EB'),
      ('body3', '본문영역', '#E5E7EB')
    ) AS t(field_id_val, field_value_val, field_color_val)
    WHERE NOT EXISTS (
      SELECT 1 FROM page_contents
      WHERE landing_page_id = landing_page_1_id
        AND field_id = t.field_id_val
    );
  END IF;
END $$;

