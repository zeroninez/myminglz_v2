'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import CoverType01 from '@/components/templates/CoverType01';

interface EventData {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  background_color: string;
  landing_pages: Array<{
    id: string;
    page_number: number;
    page_type: string;
    template_type: string;
    background_color: string;
    contents: Array<{
      field_id: string;
      field_value: string | null;
      field_color: string | null;
      is_visible: boolean;
    }>;
  }>;
}

// DB 데이터를 템플릿 데이터 형식으로 변환
function convertPageContentsToTemplateData(
  contents: Array<{
    field_id: string;
    field_value: string | null;
    field_color: string | null;
    is_visible: boolean;
  }>,
  backgroundColor: string
): Record<string, string> {
  const data: Record<string, string> = {
    backgroundColor,
  };

  contents.forEach((content) => {
    if (content.field_value !== null) {
      data[content.field_id] = content.field_value;
    }
    if (content.field_color !== null) {
      data[`${content.field_id}Color`] = content.field_color;
    }
    data[`${content.field_id}Visible`] = content.is_visible ? 'true' : 'false';
  });

  return data;
}

// 템플릿 컴포넌트 매핑
const templateComponentMap: Record<string, Record<string, React.ComponentType<{ data: Record<string, string> }>>> = {
  표지: {
    유형1: CoverType01,
  },
};

export default function NotFound() {
  const pathname = usePathname();
  const [domainCode, setDomainCode] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 경로에서 도메인 코드 추출 (예: /sdsd → sdsd)
    const code = pathname?.replace(/^\//, '').split('/')[0];
    
    // API 경로나 다른 경로는 제외
    if (code && code !== '' && !code.startsWith('api') && !code.startsWith('_next') && !code.startsWith('favicon') && code !== 'store' && code !== 'coupon' && code !== 'test') {
      setDomainCode(code);
      
      // API로 이벤트 조회
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/events/${code}`);
          
          if (!response.ok) {
            setError('이벤트를 찾을 수 없습니다.');
            setLoading(false);
            return;
          }
          
          const result = await response.json();

          if (!result.success) {
            setError(result.error || '이벤트를 찾을 수 없습니다.');
            setLoading(false);
            return;
          }

          setEventData(result.data);
        } catch (err: any) {
          console.error('이벤트 로드 오류:', err);
          setError('이벤트를 불러오는 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchEvent();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  // useMemo 제거 - 스크롤 기반으로 모든 페이지를 렌더링

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-600">{error || '이벤트를 찾을 수 없습니다.'}</p>
          <p className="text-sm text-gray-500 mt-2">경로: {pathname}</p>
        </div>
      </div>
    );
  }

  // 스크롤 기반 페이지 네비게이션
  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory">
      {eventData.landing_pages.map((page) => {
        const pageData = eventData.landing_pages.find(
          (p) => p.page_number === page.page_number
        );
        
        if (!pageData) return null;

        const Component = templateComponentMap[pageData.page_type]?.[pageData.template_type];
        const data = convertPageContentsToTemplateData(
          pageData.contents,
          pageData.background_color
        );

        return (
          <div
            key={page.id}
            className="h-screen snap-start snap-always flex items-center justify-center"
            style={{ backgroundColor: pageData.background_color || eventData.background_color }}
          >
            {Component ? (
              <Component data={data} />
            ) : (
              <div className="text-center text-white">
                <p>템플릿을 찾을 수 없습니다.</p>
                <p className="text-sm text-white/60 mt-2">
                  {pageData.page_type} - {pageData.template_type}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
