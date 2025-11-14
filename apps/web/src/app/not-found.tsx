'use client';

import { useEffect, useState, useMemo } from 'react';
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
  const [currentPage, setCurrentPage] = useState(1);

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
          if (result.data.landing_pages && result.data.landing_pages.length > 0) {
            setCurrentPage(result.data.landing_pages[0].page_number);
          }
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

  // 현재 페이지 데이터 및 템플릿 컴포넌트
  type PageData = EventData['landing_pages'][0];
  type TemplateComponentType = React.ComponentType<{ data: Record<string, string> }>;
  
  const { currentPageData, TemplateComponent, templateData } = useMemo<{
    currentPageData: PageData | null;
    TemplateComponent: TemplateComponentType | null;
    templateData: Record<string, string>;
  }>(() => {
    if (!eventData) {
      return { 
        currentPageData: null, 
        TemplateComponent: null, 
        templateData: {}
      };
    }

    const pageData = eventData.landing_pages.find(
      (page) => page.page_number === currentPage
    );

    if (!pageData) {
      return { 
        currentPageData: null, 
        TemplateComponent: null, 
        templateData: {}
      };
    }

    const Component = templateComponentMap[pageData.page_type]?.[pageData.template_type];
    const data = convertPageContentsToTemplateData(
      pageData.contents,
      pageData.background_color
    );

    return {
      currentPageData: pageData,
      TemplateComponent: Component || null,
      templateData: data,
    };
  }, [eventData, currentPage]);

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

  // 페이지별 배경색
  const backgroundColor = currentPageData?.background_color || eventData.background_color;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor }}
    >
      {/* 페이지 네비게이션 */}
      {eventData.landing_pages.length > 1 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
          {eventData.landing_pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setCurrentPage(page.page_number)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentPage === page.page_number
                  ? 'bg-white'
                  : 'bg-white/50'
              }`}
              aria-label={`페이지 ${page.page_number}`}
            />
          ))}
        </div>
      )}

      {/* 템플릿 렌더링 */}
      {TemplateComponent && currentPageData ? (
        <TemplateComponent data={templateData} />
      ) : currentPageData ? (
        <div className="text-center text-white">
          <p>템플릿을 찾을 수 없습니다.</p>
          <p className="text-sm text-white/60 mt-2">
            {currentPageData.page_type} - {currentPageData.template_type}
          </p>
        </div>
      ) : (
        <div className="text-center text-white">
          <p>페이지를 찾을 수 없습니다.</p>
        </div>
      )}
    </div>
  );
}
