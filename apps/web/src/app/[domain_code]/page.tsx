/**
 * 동적 라우트: /[domain_code]
 * 예: /event123 → 도메인 코드가 "event123"인 이벤트 랜딩 페이지
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CoverType01 from '@/components/templates/CoverType01';
import CoverType02 from '@/components/templates/CoverType02';
import Content1Type01 from '@/components/templates/Content1Type01';
import Content1Type02 from '@/components/templates/Content1Type02';
import Content2Type01 from '@/components/templates/Content2Type01';
import Content2Type02 from '@/components/templates/Content2Type02';
import { CouponService } from '@myminglz/core';

interface EventData {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  background_color: string;
  mission_config?: {
    type: string;
    hashtags: string[];
  } | null;
  event_info_config?: {
    coupon_usage?: 'immediate' | 'later';
    stores?: Array<{
      id?: string;
      name?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  } | null;
  stores?: Array<{
    id: string;
    name: string;
    slug: string;
    location_id: string;
    description?: string;
    is_active: boolean;
  }>;
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

  // 디버깅: containerBackgroundColor 확인
  console.log('🔍 convertPageContentsToTemplateData:', {
    contents,
    backgroundColor,
    resultData: data,
    hasContainerBg: data.containerBackgroundColor
  });

  return data;
}

// 템플릿 컴포넌트 매핑
const templateComponentMap: Record<string, Record<string, React.ComponentType<{ data: Record<string, string> }>>> = {
  표지: {
    유형1: CoverType01,
    유형2: CoverType02,
  },
  '본문 1': {
    유형1: Content1Type01,
    유형2: Content1Type02,
  },
  '본문 2': {
    유형1: Content2Type01,
    유형2: Content2Type02,
  },
  // TODO: 다른 템플릿 추가
};

// 디버깅: 템플릿 매핑 확인
console.log('🔍 템플릿 매핑 키들:', Object.keys(templateComponentMap));
console.log('🔍 본문 1 템플릿:', templateComponentMap['본문 1']);
console.log('🔍 Content1Type01 컴포넌트:', Content1Type01);
console.log('🔍 Content1Type02 컴포넌트:', Content1Type02);

export default function EventLandingPage() {
  const params = useParams();
  const router = useRouter();
  const domainCode = params.domain_code as string;
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);

  useEffect(() => {
    if (!domainCode) return;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        console.log('🚀 이벤트 조회 시작 - domain_code:', domainCode);
        
        const response = await fetch(`/api/events/${domainCode}`);
        
        console.log('📡 API 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API 오류 응답:', errorText);
          setError(`서버 오류 (${response.status}): 이벤트를 찾을 수 없습니다.`);
          return;
        }
        
        const result = await response.json();

        console.log('📥 API 응답:', result);
        console.log('📄 랜딩 페이지 데이터:', result.data?.landing_pages);

        if (!result.success) {
          setError(result.error || '이벤트를 찾을 수 없습니다.');
          return;
        }

        setEventData(result.data);

        // 방문 로그 기록 (비동기, 실패해도 페이지 로딩에 영향 없음)
        if (result.success && result.data) {
          fetch(`/api/events/${domainCode}/track-visit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }).catch((err) => {
            console.error('방문 로그 기록 실패:', err);
            // 방문 로그 실패는 무시
          });
        }
      } catch (err: any) {
        console.error('이벤트 로드 오류:', err);
        setError(`이벤트를 불러오는 중 오류가 발생했습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [domainCode]);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">이벤트를 찾을 수 없습니다</h1>
          <p className="text-gray-600">{error || '존재하지 않는 이벤트입니다.'}</p>
          <p className="text-sm text-gray-500 mt-2">도메인 코드: {domainCode}</p>
          {error && (
            <details className="mt-4 text-left max-w-md mx-auto">
              <summary className="cursor-pointer text-sm text-gray-500">상세 정보</summary>
              <pre className="mt-2 text-xs bg-gray-200 p-2 rounded overflow-auto">
                {error}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  // 참여하기 버튼 핸들러
  const handleParticipate = async () => {
    if (!eventData) return;

    try {
      setIsParticipating(true);

      // 모든 이벤트는 무조건 미션 페이지를 거치도록 함
      console.log('✅ 미션 페이지로 이동 (모든 이벤트 필수)');
      console.log('🔗 이동할 URL:', `/${domainCode}/mission`);
      
      // 강제로 페이지 이동 (캐시 방지)
      window.location.href = `/${domainCode}/mission`;
      return;
    } catch (error) {
      console.error('참여하기 에러:', error);
      alert('에러 발생: ' + (error instanceof Error ? error.message : '알 수 없는 에러'));
      setIsParticipating(false);
    }
  };

  // 마지막 페이지 번호 찾기
  const lastPageNumber = eventData?.landing_pages.length 
    ? Math.max(...eventData.landing_pages.map(p => p.page_number))
    : 0;

  // 디버깅: 마지막 페이지 정보
  console.log('🔍 페이지 정보:', {
    totalPages: eventData?.landing_pages.length,
    lastPageNumber,
    landingPages: eventData?.landing_pages.map(p => ({
      page_number: p.page_number,
      page_type: p.page_type,
      template_type: p.template_type,
      page_type_raw: JSON.stringify(p.page_type),
      template_type_raw: JSON.stringify(p.template_type),
    })),
  });

  // 스크롤 기반 페이지 네비게이션
  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory">
        {eventData.landing_pages.map((page) => {
        const pageData = eventData.landing_pages.find(
          (p) => p.page_number === page.page_number
        );
        
        if (!pageData) return null;

        // 디버깅: 실제 DB 값 확인
        console.log('페이지 데이터:', {
          page_number: pageData.page_number,
          page_type: pageData.page_type,
          template_type: pageData.template_type,
          page_type_length: pageData.page_type?.length,
          template_type_length: pageData.template_type?.length,
        });

        // page_type과 template_type 정규화 (공백 제거 및 trim)
        const normalizedPageType = pageData.page_type?.trim() || '';
        const normalizedTemplateType = pageData.template_type?.trim() || '';
        
        // 디버깅: 페이지 데이터 상세 확인
        console.log('🔍 페이지 데이터 상세:', {
          page_number: pageData.page_number,
          page_type: normalizedPageType,
          template_type: normalizedTemplateType,
          background_color: pageData.background_color,
          contents: pageData.contents,
          contentsLength: pageData.contents?.length || 0
        });

        const Component = templateComponentMap[normalizedPageType]?.[normalizedTemplateType];
        const data = convertPageContentsToTemplateData(
          pageData.contents,
          pageData.background_color
        );

        // 디버깅: 어떤 컴포넌트가 선택되었는지 확인
        console.log('선택된 컴포넌트:', {
          componentName: Component?.name || '없음',
          page_type: normalizedPageType,
          template_type: normalizedTemplateType,
          isType01: Component === templateComponentMap['표지']?.['유형1'],
          isType02: Component === templateComponentMap['표지']?.['유형2'],
          templateData: data
        });

        // 템플릿을 찾지 못한 경우 상세 로그
        if (!Component) {
          console.error('템플릿을 찾을 수 없습니다:', {
            original_page_type: pageData.page_type,
            original_template_type: pageData.template_type,
            normalized_page_type: normalizedPageType,
            normalized_template_type: normalizedTemplateType,
            available_page_types: Object.keys(templateComponentMap),
            available_templates: normalizedPageType ? Object.keys(templateComponentMap[normalizedPageType] || {}) : [],
            template_map_keys: Object.keys(templateComponentMap['표지'] || {}),
          });
        }

        const isLastPage = pageData.page_number === lastPageNumber;

        // 디버깅: 마지막 페이지 확인
        console.log('🔍 마지막 페이지 체크:', {
          pageNumber: pageData.page_number,
          lastPageNumber,
          isLastPage,
          willShowButton: isLastPage,
        });

        return (
          <div
            key={page.id}
            className="h-screen snap-start snap-always flex items-center justify-center relative"
            style={{ 
              backgroundColor: pageData.background_color || eventData.background_color,
              overflow: isLastPage ? 'visible' : 'hidden',
            }}
          >
            {Component ? (
              <div className="relative w-full h-full" style={{ zIndex: 1 }}>
                <Component data={data} />
              </div>
            ) : (
              <div className="text-center text-white">
                <p>템플릿을 찾을 수 없습니다.</p>
                <p className="text-sm text-white/60 mt-2">
                  {pageData.page_type} - {pageData.template_type}
                </p>
              </div>
            )}
            
            {/* 마지막 페이지에만 참여하기 버튼 표시 */}
            {isLastPage && (
              <>
                {console.log('✅ 버튼 렌더링 시작 - 마지막 페이지')}
                <div 
                  className="absolute bottom-8 left-0 right-0 flex justify-center"
                  style={{ 
                    zIndex: 10000,
                    pointerEvents: 'auto',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔴 버튼 클릭됨! 핸들러 실행 시작');
                      handleParticipate();
                    }}
                    disabled={isParticipating}
                    className="px-8 py-4 bg-red-500 text-white rounded-lg font-semibold text-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    style={{ 
                      pointerEvents: 'auto',
                    }}
                  >
                    {isParticipating ? '처리 중...' : '미션 시작하기'}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

