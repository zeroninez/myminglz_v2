'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import EventInfoSection, { type EventInfoSectionRef } from './components/EventInfoSection';
import EventMissionSection, { type EventMissionSectionRef } from './components/EventMissionSection';
import LandingPageSection, { type LandingPageSectionRef } from './components/LandingPageSection';
import { convertPageBuilderToDB } from './utils/dataConverter';
import ConfirmEventCreationModal from './components/ConfirmEventCreationModal';
import EventCreationSuccessModal from './components/EventCreationSuccessModal';

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

export default function CreatePage() {
  const router = useRouter();
  const steps = [
    { number: 1, title: '기본정보' },
    { number: 2, title: '쿠폰 설정' },
    { number: 3, title: '미션 설정' },
    { number: 4, title: '랜딩 페이지' },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeStepLeft, setActiveStepLeft] = useState(0);
  const [activeStepWidth, setActiveStepWidth] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);

  // 단계 변경 시 폼 유효성 상태 초기화
  useEffect(() => {
    if (currentStep === 0) {
      // 기본정보 단계: 초기에는 false, 데이터 변경 시 검증
      if (eventInfoSectionRef.current) {
        const isValid = eventInfoSectionRef.current.isValid();
        setIsFormValid(isValid);
      } else {
        setIsFormValid(false);
      }
    } else if (currentStep === 2) {
      // 미션 설정 단계: 초기에는 false, 데이터 변경 시 검증
      if (eventMissionSectionRef.current) {
        const isValid = eventMissionSectionRef.current.isValid();
        setIsFormValid(isValid);
      } else {
        setIsFormValid(false);
      }
    } else {
      // 다른 단계들은 항상 유효
      setIsFormValid(true);
    }
  }, [currentStep]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // 각 섹션의 데이터를 저장할 ref
  const eventInfoDataRef = useRef<EventInfoData>({});
  const eventInfoSectionRef = useRef<EventInfoSectionRef>(null);
  const eventMissionDataRef = useRef<EventMissionData>({});
  const eventMissionSectionRef = useRef<EventMissionSectionRef>(null);
  const landingPageDataRef = useRef<LandingPageData>({
    pageSelections: {},
    pageBackgroundColors: {},
    designValues: {},
  });
  const landingPageSectionRef = useRef<LandingPageSectionRef>(null);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback(async () => {
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
      // 최종 제출 - 확인 모달 표시
      setShowConfirmModal(true);
    }
  }, [currentStep, steps.length]);

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

      // 1.5. 사용처 이미지들을 Storage에 업로드
      console.log('🔵 [1.5] 사용처 이미지 업로드 시작');
      const currentEventInfo = eventInfoDataRef.current;
      const stores = currentEventInfo.event_info_config?.stores || [];
      console.log('🔵 [1.5] 현재 stores:', stores);
      
      // Data URL을 가진 stores 찾아서 업로드
      const uploadPromises: Promise<{ storeIndex: number; url: string }>[] = [];
      const updatedStores = [...stores];
      
      for (let i = 0; i < stores.length; i++) {
        const store = stores[i];
        const imageUrl = store.image_url || store.imageUrl;
        if (imageUrl && (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:'))) {
          const storeIndex = i;
          console.log(`🔵 [1.5] 업로드 대상 발견: ${store.name}, imageUrl: ${imageUrl.substring(0, 50)}...`);
          uploadPromises.push(
            (async () => {
              try {
                // Data URL을 Blob으로 변환
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const file = new File([blob], `store-${store.id}-${Date.now()}.jpg`, { type: 'image/jpeg' });
                
                console.log(`🔵 [1.5] 이미지 업로드 시작: ${store.name}`);
                // S3에 업로드
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'store-images');
                
                const uploadResponse = await fetch('/api/upload-image', {
                  method: 'POST',
                  body: formData,
                });
                
                const uploadData = await uploadResponse.json();
                
                if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
                  throw new Error(uploadData.error || '이미지 업로드 실패');
                }
                
                console.log(`✅ [1.5] 이미지 업로드 성공: ${store.name}, URL: ${uploadData.url}`);
                return { storeIndex, url: uploadData.url };
              } catch (error: any) {
                console.error(`❌ [1.5] 사용처 이미지 업로드 실패 (${store.name}):`, error);
                throw error;
              }
            })()
          );
        }
      }
      
      if (uploadPromises.length > 0) {
        try {
          const results = await Promise.all(uploadPromises);
          // 업로드된 URL로 업데이트
          results.forEach(({ storeIndex, url }) => {
            updatedStores[storeIndex] = { ...updatedStores[storeIndex], image_url: url };
          });
          
          // eventInfoDataRef 업데이트
          if (currentEventInfo.event_info_config) {
            currentEventInfo.event_info_config.stores = updatedStores;
            eventInfoDataRef.current = currentEventInfo;
            console.log('✅ [1.5] eventInfoDataRef 업데이트 완료:', eventInfoDataRef.current.event_info_config.stores);
          }
        } catch (error: any) {
          console.error('❌ [1.5] 사용처 이미지 업로드 중 오류:', error);
          alert('사용처 이미지 업로드에 실패했습니다. 다시 시도해주세요.');
          setIsSubmitting(false);
          return;
        }
      } else {
        console.log('⚪ [1.5] 업로드할 이미지 없음');
      }

      // 1.6. 랜딩 페이지의 대기 중인 이미지들을 Storage에 업로드
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

      // 3. API 호출
      const finalEventInfo = eventInfoDataRef.current; // 업로드 후 최신 데이터 사용
      console.log('🔵 API 호출 전 최종 eventInfo:', finalEventInfo);
      console.log('🔵 stores:', finalEventInfo.event_info_config?.stores);
      if (finalEventInfo.event_info_config?.stores) {
        finalEventInfo.event_info_config.stores.forEach((store: any, index: number) => {
          console.log(`🔵 store[${index}]:`, {
            name: store.name,
            image_url: store.image_url,
            hasImageUrl: !!store.image_url,
          });
        });
      }
      const requestBody = {
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
      };
      
      console.log('🔵 API 요청 본문:', JSON.stringify(requestBody, null, 2));
      if (requestBody.event_info_config?.stores) {
        console.log('🔵 API 요청의 stores 상세:');
        requestBody.event_info_config.stores.forEach((store: any, index: number) => {
          console.log(`  store[${index}]:`, {
            name: store.name,
            image_url: store.image_url,
            imageUrlType: store.image_url ? (store.image_url.startsWith('http') ? 'S3 URL' : 'Local URL') : 'null',
          });
        });
      }
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '이벤트 생성에 실패했습니다.');
      }

      // 4. 성공 시 완료 모달 표시
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('이벤트 생성 오류:', error);
      alert(error.message || '이벤트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextLabel = useMemo(() => 
    currentStep === steps.length - 1 ? '완료' : '다음',
    [currentStep, steps.length]
  );

  // 필수 정보 검증 (스텝별로 다른 검증 로직)
  useEffect(() => {
    const checkValidation = () => {
      if (currentStep === 0 || currentStep === 1) {
        // 기본정보와 사용처 등록 검증
        if (eventInfoSectionRef.current) {
          const isValid = eventInfoSectionRef.current.isValid();
          setIsFormValid(isValid);
        } else {
          setIsFormValid(false);
        }
      } else if (currentStep === 2) {
        // 미션 설정 검증
        if (eventMissionSectionRef.current) {
          const isValid = eventMissionSectionRef.current.isValid();
          setIsFormValid(isValid);
        } else {
          setIsFormValid(false);
        }
      } else {
        // 랜딩 페이지 등 다른 스텝에서는 항상 활성화
        setIsFormValid(true);
      }
    };

    checkValidation();
    
    // 주기적으로 검증 (데이터 변경 감지)
    const interval = setInterval(checkValidation, 500);
    return () => clearInterval(interval);
  }, [currentStep, eventInfoDataRef.current, eventMissionDataRef.current]);

  // 활성 스텝 위치 계산 - requestAnimationFrame으로 최적화
  useEffect(() => {
    const activeStepRef = stepRefs.current[currentStep];
    if (activeStepRef) {
      // 다음 프레임에서 실행하여 레이아웃 계산 최적화
      const rafId = requestAnimationFrame(() => {
        const container = activeStepRef.parentElement?.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const stepRect = activeStepRef.getBoundingClientRect();
          const padding = 8; // 좌우 각각 8px 확장
          setActiveStepLeft((stepRect.left - containerRect.left) - padding);
          setActiveStepWidth(stepRect.width + (padding * 2));
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [currentStep]);

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6">
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-5">이벤트 생성</h2>
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

      {currentStep === 0 && (
        <>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <EventInfoSection
              ref={eventInfoSectionRef}
              mode="basicInfo"
              initialData={Object.keys(eventInfoDataRef.current).length > 0 ? eventInfoDataRef.current : undefined}
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
      {currentStep === 1 && (
        <EventInfoSection
          ref={eventInfoSectionRef}
          mode="storeRegistration"
          initialData={Object.keys(eventInfoDataRef.current).length > 0 ? eventInfoDataRef.current : undefined}
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
      {currentStep === 2 && (
        <EventMissionSection
          ref={eventMissionSectionRef}
          initialData={Object.keys(eventMissionDataRef.current).length > 0 ? eventMissionDataRef.current : undefined}
          onDataChange={(data) => {
            eventMissionDataRef.current = { ...eventMissionDataRef.current, ...data };
            // 데이터 변경 시 검증
            if (eventMissionSectionRef.current) {
              const isValid = eventMissionSectionRef.current.isValid();
              setIsFormValid(isValid);
            }
          }}
        />
      )}
      {currentStep === 3 && (
        <LandingPageSection
          ref={landingPageSectionRef}
          initialData={
            Object.keys(landingPageDataRef.current.pageSelections).length > 0 || 
            Object.keys(landingPageDataRef.current.designValues).length > 0
              ? landingPageDataRef.current
              : undefined
          }
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
              className="inline-flex h-10 items-center rounded border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* 확인 모달 */}
      <ConfirmEventCreationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={async () => {
          setShowConfirmModal(false);
          await handleSubmit();
        }}
      />

      {/* 완료 모달 */}
      <EventCreationSuccessModal
        isOpen={showSuccessModal}
        onConfirm={() => {
          setShowSuccessModal(false);
          window.location.href = '/manage';
        }}
      />
    </div>
  );
}

