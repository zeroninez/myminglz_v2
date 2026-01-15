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
    { number: 1, title: '기본정보' },
    { number: 2, title: '쿠폰 설정' },
    { number: 3, title: '미션 설정' },
    { number: 4, title: '랜딩 페이지' },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeStepLeft, setActiveStepLeft] = useState(0);
  const [activeStepWidth, setActiveStepWidth] = useState(0);
  
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
        
        console.log('🔵 [수정] 이벤트 데이터 로드:', {
          hasStores: !!eventData.stores,
          storesCount: eventData.stores?.length || 0,
          hasEventInfoConfig: !!eventData.event_info_config,
          hasEventInfoConfigStores: !!eventData.event_info_config?.stores,
          eventInfoConfigStoresCount: eventData.event_info_config?.stores?.length || 0,
        });

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
        // API에서 이미 포맷팅된 stores를 event_info_config.stores에 포함시켜주므로 그대로 사용
        const eventInfoConfig = eventData.event_info_config || {};
        
        // event_info_config.stores가 있으면 사용, 없으면 eventData.stores에서 매핑
        let stores = eventInfoConfig.stores || [];
        
        console.log('🔵 [수정] stores 초기 상태:', {
          eventInfoConfigStores: eventInfoConfig.stores?.length || 0,
          eventDataStores: eventData.stores?.length || 0,
          storesLength: stores.length,
        });
        
        // event_info_config.stores가 없고 eventData.stores가 있으면 매핑
        if (stores.length === 0 && eventData.stores && eventData.stores.length > 0) {
          console.log('🔵 [수정] eventData.stores에서 매핑 시작:', eventData.stores);
          stores = eventData.stores.map((store: any) => {
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
              location: store.location || '',
              benefit: benefit,
              usage_period: store.usage_period || '',
              use_event_period: store.use_event_period !== undefined ? store.use_event_period : true,
              slug: store.slug, // DB에서 가져온 slug 포함
              image_url: store.image_url || null, // 이미지 URL 포함
            };
          });
          console.log('🔵 [수정] 매핑된 stores:', stores);
        }
        
        console.log('🔵 [수정] 최종 stores:', stores);

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
            stores: stores,
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
    // 스텝 0, 1(기본정보, 사용처등록)에서 다음으로 넘어가기 전 검증
    if (currentStep === 0 || currentStep === 1) {
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
      const finalEventInfo = eventInfoDataRef.current; // 업로드 후 최신 데이터 사용
      console.log('🔵 [수정] API 호출 전 최종 eventInfo:', finalEventInfo);
      console.log('🔵 [수정] stores:', finalEventInfo.event_info_config?.stores);
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: finalEventInfo.name,
          domain_code: finalEventInfo.domain_code,
          start_date: finalEventInfo.start_date || null,
          end_date: finalEventInfo.end_date || null,
          background_color: finalEventInfo.background_color || '#000000',
          description: finalEventInfo.description || null,
          content_html: finalEventInfo.content_html || null,
          coupon_preview_image_url: finalEventInfo.coupon_preview_image_url || null,
          mission_config: eventMissionDataRef.current.mission_config || null,
          event_info_config: finalEventInfo.event_info_config || null,
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

  // 활성 스텝 위치 계산
  useEffect(() => {
    const activeStepRef = stepRefs.current[currentStep];
    if (activeStepRef) {
      const container = activeStepRef.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const stepRect = activeStepRef.getBoundingClientRect();
        const padding = 8; // 좌우 각각 8px 확장
        setActiveStepLeft((stepRect.left - containerRect.left) - padding);
        setActiveStepWidth(stepRect.width + (padding * 2));
      }
    }
  }, [currentStep]);

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
    <div className="flex flex-col h-screen">
      <div className="px-6">
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-5">이벤트 수정</h2>
      </div>
      <section className="border-t border-x border-b border-gray-200 bg-white px-6 pt-5 pb-0 shadow-sm relative">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium pb-4 relative">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div 
                  key={step.number} 
                  ref={(el) => { stepRefs.current[index] = el; }}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-white`}
                      style={isActive ? { backgroundColor: '#4D82F3' } : isCompleted ? { backgroundColor: '#32373D' } : { backgroundColor: '#888888' }}
                    >
                      {isCompleted ? (
                        <svg width="20" height="20" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M16.0747 23.1733L25.2413 12.1733L22.4253 9.82667L14.542 19.2848L10.4628 15.2038L7.8705 17.7962L13.3705 23.2962L14.7895 24.7152L16.0747 23.1733Z" fill="white"/>
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`font-bold ${
                        isActive
                          ? 'text-[#4D82F3]'
                          : isCompleted
                          ? 'text-[#32373D]'
                          : 'text-[#888888]'
                      }`}
                    >
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <span className={`text-lg font-bold ${isActive ? 'text-[#4D82F3]' : isCompleted ? 'text-[#32373D]' : 'text-[#888888]'}`}>{'>'}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* 활성 스텝 아래 파란색 구분선 */}
            {activeStepWidth > 0 && (
              <div
                className="absolute bottom-0 h-0.5 bg-[#4D82F3]"
                style={{ 
                  left: `${activeStepLeft}px`,
                  width: `${activeStepWidth}px`
                }}
              ></div>
            )}
          </div>

        </div>
      </section>

      {currentStep === 0 && initialEventInfo && (
        <>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <EventInfoSection
              ref={eventInfoSectionRef}
              mode="basicInfo"
              isEditMode={true}
              initialData={Object.keys(eventInfoDataRef.current).length > 0 ? eventInfoDataRef.current : initialEventInfo}
              onDataChange={(data) => {
                eventInfoDataRef.current = { ...eventInfoDataRef.current, ...data };
                // 데이터 변경 시 검증
                if (eventInfoSectionRef.current) {
                  const isValid = eventInfoSectionRef.current.isValid();
                  setIsFormValid(isValid);
                }
              }}
            />
          </div>
          {/* 하단 고정 버튼 */}
          <div className="fixed bottom-0 left-[240px] right-0 bg-white z-10 border-t border-gray-200">
            <div className="p-4 flex justify-end">
              <button
                onClick={handleNext}
                disabled={isSubmitting || !isFormValid}
                className="inline-flex h-10 items-center rounded px-5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isFormValid ? '#414B55' : '#C3C3C3',
                }}
                onMouseEnter={(e) => {
                  if (isFormValid && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#32373D';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isFormValid && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#414B55';
                  }
                }}
              >
                {isSubmitting ? '저장 중...' : nextLabel}
              </button>
            </div>
          </div>
        </>
      )}
      {currentStep === 1 && initialEventInfo && (
        <EventInfoSection
          ref={eventInfoSectionRef}
          mode="storeRegistration"
          isEditMode={true}
          initialData={Object.keys(eventInfoDataRef.current).length > 0 ? eventInfoDataRef.current : initialEventInfo}
          onDataChange={(data) => {
            eventInfoDataRef.current = { ...eventInfoDataRef.current, ...data };
            // 데이터 변경 시 검증
            if (eventInfoSectionRef.current) {
              const isValid = eventInfoSectionRef.current.isValid();
              setIsFormValid(isValid);
            }
          }}
        />
      )}
      {currentStep === 2 && initialEventMission && (
        <EventMissionSection
          initialData={Object.keys(eventMissionDataRef.current).length > 0 ? eventMissionDataRef.current : initialEventMission}
          onDataChange={(data) => {
            eventMissionDataRef.current = { ...eventMissionDataRef.current, ...data };
          }}
        />
      )}
      {currentStep === 3 && initialLandingPage && (
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

      {/* 하단 고정 버튼 (스텝 0이 아닐 때) */}
      {currentStep > 0 && (
        <div className="fixed bottom-0 left-[240px] right-0 bg-white z-10 border-t border-gray-200">
          <div className="p-4 flex justify-end gap-3">
            <button
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <button
              onClick={handleNext}
              disabled={isSubmitting || !isFormValid}
              className="inline-flex h-10 items-center rounded px-5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isFormValid ? '#414B55' : '#C3C3C3',
              }}
              onMouseEnter={(e) => {
                if (isFormValid && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#32373D';
                }
              }}
              onMouseLeave={(e) => {
                if (isFormValid && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#414B55';
                }
              }}
            >
              {isSubmitting ? '저장 중...' : nextLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

