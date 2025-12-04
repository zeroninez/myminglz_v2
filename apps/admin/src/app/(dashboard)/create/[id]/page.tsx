'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EventInfoSection, { type EventInfoSectionRef } from '../components/EventInfoSection';
import EventMissionSection from '../components/EventMissionSection';
import LandingPageSection, { type LandingPageSectionRef } from '../components/LandingPageSection';
import { convertPageBuilderToDB, convertDBToPageBuilder } from '../utils/dataConverter';

// 각 섹션의 데이터 타입
interface EventInfoData {
  name?: string;
  domain_code?: string;
  start_date?: string;
  end_date?: string;
  background_color?: string;
  description?: string;
  content_html?: string;
  coupon_preview_image_url?: string;
  event_info_config?: any;
}

interface EventMissionData {
  mission_config?: any;
}

interface LandingPageData {
  pageSelections: Record<number, { pageType: string; templateType: string }>;
  pageBackgroundColors: Record<number, string>;
  designValues: Record<number, Record<string, string>>;
}

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const steps = [
    { number: 1, title: '이벤트 정보' },
    { number: 2, title: '이벤트 미션' },
    { number: 3, title: '랜딩 페이지' },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 각 섹션의 데이터를 저장할 ref
  const eventInfoDataRef = useRef<EventInfoData>({});
  const eventInfoSectionRef = useRef<EventInfoSectionRef>(null);
  const eventMissionDataRef = useRef<EventMissionData>({});
  const landingPageDataRef = useRef<LandingPageData>({
    pageSelections: {},
    pageBackgroundColors: {},
    designValues: {},
  });
  const landingPageSectionRef = useRef<LandingPageSectionRef>(null);

  // 초기값 저장
  const [initialEventInfo, setInitialEventInfo] = useState<EventInfoData | null>(null);
  const [initialEventMission, setInitialEventMission] = useState<EventMissionData | null>(null);
  const [initialLandingPage, setInitialLandingPage] = useState<LandingPageData | null>(null);

  // 기존 이벤트 데이터 불러오기
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${eventId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '이벤트를 불러올 수 없습니다.');
        }

        const eventData = result.data;

        // 날짜 형식 변환 함수 (ISO 형식을 YYYY-MM-DD로 변환)
        const formatDateForInput = (dateString: string | null | undefined): string => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          } catch {
            // 이미 YYYY-MM-DD 형식이거나 다른 형식인 경우
            if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
              return dateString.substring(0, 10);
            }
            return '';
          }
        };

        // EventInfoSection 초기값 설정
        // DB에서 가져온 stores 데이터를 event_info_config.stores에 매핑
        const storesFromDB = eventData.stores || [];
        const eventInfoConfig = eventData.event_info_config || {};
        const mappedStores = storesFromDB.map((store: any) => {
          // description에서 tempId 추출 (JSON 형태로 저장되어 있을 수 있음)
          let tempId = null;
          let benefit = store.description || '';
          try {
            const parsed = JSON.parse(store.description || '{}');
            if (parsed.tempId) {
              tempId = parsed.tempId;
              benefit = parsed.description || '';
            }
          } catch {
            // JSON이 아니면 그대로 사용
          }
          
          return {
            id: tempId || store.id, // 임시 ID가 있으면 사용, 없으면 DB ID
            name: store.name,
            benefit: benefit,
            usage_period: '',
            use_event_period: true,
            slug: store.slug, // DB에서 가져온 slug 포함
          };
        });

        const eventInfo: EventInfoData = {
          name: eventData.name || '',
          domain_code: eventData.domain_code || '',
          start_date: formatDateForInput(eventData.start_date),
          end_date: formatDateForInput(eventData.end_date),
          background_color: eventData.background_color || '#000000',
          description: eventData.description || '',
          content_html: eventData.content_html || '',
          coupon_preview_image_url: eventData.coupon_preview_image_url || '',
          event_info_config: {
            ...eventInfoConfig,
            stores: mappedStores.length > 0 ? mappedStores : (eventInfoConfig.stores || []),
          },
        };
        setInitialEventInfo(eventInfo);
        eventInfoDataRef.current = eventInfo;

        // EventMissionSection 초기값 설정
        const eventMission: EventMissionData = {
          mission_config: eventData.mission_config || null,
        };
        setInitialEventMission(eventMission);
        eventMissionDataRef.current = eventMission;

        // LandingPageSection 초기값 설정
        if (eventData.landing_pages && eventData.landing_pages.length > 0) {
          const landingPageData = convertDBToPageBuilder(eventData.landing_pages);
          setInitialLandingPage(landingPageData);
          landingPageDataRef.current = landingPageData;
        }
      } catch (err: any) {
        console.error('이벤트 데이터 로드 오류:', err);
        setError(err.message || '이벤트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNext = async () => {
    // 스텝 1에서 다음으로 넘어가기 전 검증
    if (currentStep === 0) {
      if (eventInfoSectionRef.current) {
        const validation = eventInfoSectionRef.current.validate();
        if (!validation.isValid) {
          alert(validation.error || '입력한 정보를 확인해주세요.');
          return;
        }
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // 최종 제출
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 1. 필수 데이터 검증
      const eventInfo = eventInfoDataRef.current;
      if (!eventInfo.name || !eventInfo.domain_code) {
        alert('이벤트 이름과 도메인 코드는 필수입니다.');
        setCurrentStep(0); // 첫 번째 스텝으로 이동
        return;
      }

      // 1.5. 랜딩 페이지의 대기 중인 이미지들을 Storage에 업로드
      let finalLandingPageData = landingPageDataRef.current;
      if (landingPageSectionRef.current) {
        const uploadResult = await landingPageSectionRef.current.uploadPendingImages();
        if (!uploadResult.success) {
          alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
          setIsSubmitting(false);
          return;
        }
        // 업로드된 최신 데이터 사용
        if (uploadResult.updatedData) {
          finalLandingPageData = uploadResult.updatedData;
          landingPageDataRef.current = uploadResult.updatedData;
        }
      }

      // 2. 랜딩 페이지 데이터 변환 (최신 업로드된 이미지 URL 포함)
      const landingPagesData = convertPageBuilderToDB(finalLandingPageData);

      // 3. API 호출 (PUT)
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: eventInfo.name,
          domain_code: eventInfo.domain_code,
          start_date: eventInfo.start_date || null,
          end_date: eventInfo.end_date || null,
          background_color: eventInfo.background_color || '#000000',
          description: eventInfo.description || null,
          content_html: eventInfo.content_html || null,
          coupon_preview_image_url: eventInfo.coupon_preview_image_url || null,
          mission_config: eventMissionDataRef.current.mission_config || null,
          event_info_config: eventInfo.event_info_config || null,
          landing_pages: landingPagesData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '이벤트 수정에 실패했습니다.');
      }

      // 4. 성공 시 관리 페이지로 이동
      alert('이벤트가 성공적으로 수정되었습니다!');
      router.push('/manage');
    } catch (error: any) {
      console.error('이벤트 수정 오류:', error);
      alert(error.message || '이벤트 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextLabel = currentStep === steps.length - 1 ? '수정 완료' : '다음';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.push('/manage')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          관리 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-blue-200 bg-blue-50 px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.number} className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                      isActive
                        ? 'border-blue-500 bg-white font-semibold text-blue-600'
                        : isCompleted
                        ? 'border-blue-500 bg-blue-500 font-semibold text-white'
                        : 'border-gray-300 bg-white text-gray-600'
                    }`}
                  >
                    {step.number}
                  </div>
                  <span
                    className={
                      isActive
                        ? 'text-blue-600'
                        : isCompleted
                        ? 'text-gray-500'
                        : 'text-gray-600'
                    }
                  >
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <span className="text-gray-300">{'>'}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
            )}
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center rounded-lg bg-blue-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : nextLabel}
          </button>
          </div>
        </div>
      </section>

      {currentStep === 0 && initialEventInfo && (
        <EventInfoSection
          ref={eventInfoSectionRef}
          initialData={Object.keys(eventInfoDataRef.current).length > 0 ? eventInfoDataRef.current : initialEventInfo}
          onDataChange={(data) => {
            eventInfoDataRef.current = { ...eventInfoDataRef.current, ...data };
          }}
        />
      )}
      {currentStep === 1 && initialEventMission && (
        <EventMissionSection
          initialData={Object.keys(eventMissionDataRef.current).length > 0 ? eventMissionDataRef.current : initialEventMission}
          onDataChange={(data) => {
            eventMissionDataRef.current = { ...eventMissionDataRef.current, ...data };
          }}
        />
      )}
      {currentStep === 2 && initialLandingPage && (
        <LandingPageSection
          ref={landingPageSectionRef}
          initialData={Object.keys(landingPageDataRef.current.pageSelections).length > 0 || Object.keys(landingPageDataRef.current.designValues).length > 0 
            ? landingPageDataRef.current 
            : initialLandingPage}
          onDataChange={(data) => {
            landingPageDataRef.current = data;
          }}
        />
      )}
    </div>
  );
}

