'use client';

import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { QRCodeService } from '@myminglz/core/src/utils/qr';
import { FormLabel } from './FormLabel';
import { FormInput } from './FormInput';
import KakaoPlaceSearch, { type Place } from './KakaoPlaceSearch';
import DateRangePicker from './DateRangePicker';
import SplitFormLayout from './SplitFormLayout';
import StoreRegistrationSection, { type Store } from './StoreRegistrationSection';

interface EventInfoSectionProps {
  initialData?: {
    name?: string;
    domain_code?: string;
    start_date?: string;
    end_date?: string;
    background_color?: string;
    description?: string;
    content_html?: string;
    coupon_preview_image_url?: string;
    event_info_config?: any;
  };
  onDataChange?: (data: {
    name?: string;
    domain_code?: string;
    start_date?: string;
    end_date?: string;
    background_color?: string;
    description?: string;
    content_html?: string;
    coupon_preview_image_url?: string;
    event_info_config?: any;
  }) => void;
  mode?: 'basicInfo' | 'storeRegistration' | 'all';
  isEditMode?: boolean; // 수정 모드 여부 (이미 저장된 이벤트인지)
}

export interface EventInfoSectionRef {
  validate: () => { isValid: boolean; error?: string };
  isValid: () => boolean;
  uploadPendingStoreImages?: () => Promise<{ success: boolean; updatedStores?: Store[] }>;
}

const EventInfoSection = forwardRef<EventInfoSectionRef, EventInfoSectionProps>(
  ({ initialData, onDataChange, mode = 'all', isEditMode = false }, ref) => {
  const [eventName, setEventName] = useState(initialData?.name || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [domainCode, setDomainCode] = useState(initialData?.domain_code || '');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  
  // 도메인 코드 중복 확인 상태
  const [domainCodeChecking, setDomainCodeChecking] = useState(false);
  const [domainCodeAvailable, setDomainCodeAvailable] = useState<boolean | null>(null);
  const [domainCodeMessage, setDomainCodeMessage] = useState<string | null>(null);
  
  // 한글 입력 에러 상태
  const [domainInputError, setDomainInputError] = useState<string | null>(null);

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // 이벤트 주최 = 사용처 여부
  const [isHostSameAsStore, setIsHostSameAsStore] = useState<boolean>(
    initialData?.event_info_config?.is_host_same_as_store || false
  );
  
  // 쿠폰 사용 방식
  const [couponUsage, setCouponUsage] = useState<'immediate' | 'later'>(
    initialData?.event_info_config?.coupon_usage || 'later'
  );
  
  // 이벤트 참여 장소
  const [participantLocation, setParticipantLocation] = useState<Place | null>(
    initialData?.event_info_config?.participant_location || null
  );
  
  // StoreRegistrationSection ref
  const storeRegistrationSectionRef = useRef<{ uploadPendingStoreImages: () => Promise<{ success: boolean; updatedStores?: Store[] }> } | null>(null);
  
  // 원본 stores 백업 (isHostSameAsStore 토글 시 복원용)
  const backupStoresRef = useRef<Store[]>([]);
  
  // 도메인 검증 중복 방지용 ref
  const domainCodeCheckingRef = useRef<boolean>(false);
  
  // 사용처 목록
  const [stores, setStores] = useState<Store[]>(() => {
    if (initialData?.event_info_config?.stores && Array.isArray(initialData.event_info_config.stores)) {
      const mappedStores = initialData.event_info_config.stores.map((store: any) => ({
        id: store.id || `store-${Date.now()}-${Math.random()}`,
        name: store.name || '',
        location: store.location || '',
        benefit: store.benefit || '',
        usagePeriod: store.usage_period || '',
        useEventPeriod: store.use_event_period !== false,
        qrCodeUrl: null,
        slug: store.slug, // DB에서 가져온 slug 포함
        imageUrl: store.image_url || null,
      }));
      // 백업 저장
      backupStoresRef.current = mappedStores;
      return mappedStores;
    }
    return [];
  });

  // initialData가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialData) {
      setEventName(initialData.name || '');
      setStartDate(initialData.start_date || '');
      setEndDate(initialData.end_date || '');
      setDomainCode(initialData.domain_code || '');
      setIsHostSameAsStore(initialData.event_info_config?.is_host_same_as_store || false);
      setCouponUsage(initialData.event_info_config?.coupon_usage || 'later');
      setParticipantLocation(initialData.event_info_config?.participant_location || null);
      if (initialData.event_info_config?.stores && Array.isArray(initialData.event_info_config.stores)) {
        const mappedStores = initialData.event_info_config.stores.map((store: any) => ({
          id: store.id || `store-${Date.now()}-${Math.random()}`,
          name: store.name || '',
          location: store.location || '',
          benefit: store.benefit || '',
          usagePeriod: store.usage_period || '',
          useEventPeriod: store.use_event_period !== false,
          qrCodeUrl: null,
          slug: store.slug, // DB에서 가져온 slug 포함
          imageUrl: store.image_url || null,
        }));
        // 백업 저장
        backupStoresRef.current = mappedStores;
        setStores(mappedStores);
      }
    }
  }, [initialData]);

  // 도메인 코드 중복 확인 (debounce 적용)
  useEffect(() => {
    // 빈 도메인 코드면 검사 안 함
    if (!domainCode.trim()) {
      setDomainCodeAvailable(null);
      setDomainCodeMessage(null);
      return;
    }

    // 수정 모드에서 기존 도메인 코드와 동일하면 검사 안 함
    if (isEditMode && initialData?.domain_code && domainCode.trim() === initialData.domain_code) {
      setDomainCodeAvailable(null);
      setDomainCodeMessage(null);
      return;
    }

    // debounce: 500ms 후에 검사
    const timeoutId = setTimeout(async () => {
      const trimmedCode = domainCode.trim();
      
      // Race condition 방지: 현재 입력값과 다르면 중단
      if (trimmedCode !== domainCode.trim()) {
        return;
      }
      
      if (!trimmedCode) {
        setDomainCodeAvailable(null);
        setDomainCodeMessage(null);
        return;
      }

      // 중복 요청 방지를 위한 ref 사용
      if (domainCodeCheckingRef.current) {
        return;
      }

      try {
        domainCodeCheckingRef.current = true;
        setDomainCodeChecking(true);
        setDomainCodeAvailable(null);
        setDomainCodeMessage(null);

        // 재시도 로직 (최대 3회)
        let response;
        let lastError;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            
            response = await fetch(`/api/events/check-domain-code?code=${encodeURIComponent(trimmedCode)}`, {
              headers: {
                'Cache-Control': 'no-cache',
              },
            });
            
            // 401 에러 시 세션 갱신 후 재시도
            if (response.status === 401) {
              try {
                const sessionResponse = await fetch('/api/auth/session', {
                  method: 'GET',
                  credentials: 'include',
                });
                
                if (sessionResponse.ok) {
                  const sessionResult = await sessionResponse.json();
                  if (sessionResult.success) {
                    response = await fetch(`/api/events/check-domain-code?code=${encodeURIComponent(trimmedCode)}`, {
                      headers: {
                        'Cache-Control': 'no-cache',
                      },
                    });
                  }
                }
              } catch (sessionError) {
                console.error('세션 갱신 실패:', sessionError);
              }
            }
            
            // 5xx 에러나 네트워크 에러가 아니면 재시도 중단
            if (response.status < 500) {
              break;
            }
            
            lastError = new Error(`HTTP ${response.status}`);
            
            // 마지막 시도가 아니면 잠시 대기
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            
          } catch (networkError) {
            lastError = networkError;
            
            // 마지막 시도가 아니면 잠시 대기
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
        
        if (!response) {
          throw lastError || new Error('모든 재시도 실패');
        }
        
        const result = await response.json();
        
        // Race condition 재확인: 응답이 왔을 때 입력값이 바뀌었으면 무시
        if (trimmedCode !== domainCode.trim()) {
          return;
        }

        if (result.success) {
          setDomainCodeAvailable(result.available);
          setDomainCodeMessage(result.message);
        } else {
          setDomainCodeAvailable(false);
          setDomainCodeMessage(result.error || '도메인 코드 확인 중 오류가 발생했습니다.');
        }
      } catch (error: any) {
        console.error('도메인 코드 확인 오류:', error);
        
        // Race condition 재확인
        if (trimmedCode !== domainCode.trim()) {
          return;
        }
        
        setDomainCodeAvailable(false);
        setDomainCodeMessage('도메인 코드 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        domainCodeCheckingRef.current = false;
        setDomainCodeChecking(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [domainCode, initialData?.domain_code]);


  // 도메인 주소가 변경되면 QR 코드 생성
  useEffect(() => {
    const generateQR = async () => {
      if (!domainCode.trim()) {
        setQrCodeUrl(null);
        return;
      }

      try {
        setQrLoading(true);
        // 기본 도메인 + 도메인 코드로 QR 생성
        const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://myminglz-v2-web.vercel.app';
        const qrUrl = `${baseUrl}/${domainCode.trim()}`;
        
        // QR 코드 이미지 생성
        const qrImageUrl = await QRCodeService.generateQRCodeURL(qrUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        
        setQrCodeUrl(qrImageUrl);
      } catch (error) {
        console.error('QR 코드 생성 실패:', error);
        setQrCodeUrl(null);
      } finally {
        setQrLoading(false);
      }
    };

    generateQR();
  }, [domainCode]);


  // 검증 함수
 
  const validate = (): { isValid: boolean; error?: string } => {
    // 기본정보 모드일 때만 기본정보 검증
    if (mode === 'basicInfo' || mode === 'all') {
      // 1. 이벤트 이름 필수
      if (!eventName || !eventName.trim()) {
        return { isValid: false, error: '이벤트 이름을 입력해주세요.' };
      }

      // 2. 이벤트 기간 필수
      if (!startDate || !endDate) {
        return { isValid: false, error: '이벤트 기간을 설정해주세요.' };
      }

      // 3. 이벤트 참여 장소 필수 (일단 필수 아님)
      // if (!participantLocation) {
      //   return { isValid: false, error: '이벤트 참여 장소를 선택해주세요.' };
      // }

      // 4. 도메인 코드 필수
      if (!domainCode || !domainCode.trim()) {
        return { isValid: false, error: '도메인 주소를 입력해주세요.' };
      }

      // 5. 도메인 코드 중복 확인 (수정 모드가 아닌 경우)
      if (!initialData?.domain_code) {
        if (domainCodeChecking) {
          return { isValid: false, error: '도메인 코드 확인 중입니다. 잠시 후 다시 시도해주세요.' };
        }
        if (domainCodeAvailable === false) {
          return { isValid: false, error: '이미 사용 중인 도메인 코드입니다. 다른 도메인 코드를 입력해주세요.' };
        }
        // domainCodeAvailable이 null이고 도메인 코드가 입력되어 있으면 아직 확인 중이거나 확인되지 않은 상태
        // 입력 후 충분한 시간이 지났다면 확인이 완료되어야 하므로, 확인되지 않은 경우 경고
        if (domainCodeAvailable === null && domainCode.trim()) {
          // 도메인 코드가 입력되어 있고, 아직 확인이 완료되지 않은 경우
          // debounce 시간(500ms)이 지났다면 확인이 완료되어야 함
          return { isValid: false, error: '도메인 코드 중복 확인이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.' };
        }
      }
    }

    // 사용처 등록 모드일 때만 사용처 검증
    if (mode === 'storeRegistration' || mode === 'all') {
      // 4. 이벤트 주최 = 사용처가 아닌 경우, 사용처 등록 필수
      if (!isHostSameAsStore) {
        if (stores.length === 0) {
          return { isValid: false, error: '사용처를 최소 1개 이상 등록해주세요. 또는 "이벤트 주최 = 사용처"를 선택해주세요.' };
        }
        
        // 각 사용처의 이름이 필수
        for (let i = 0; i < stores.length; i++) {
          const store = stores[i];
          if (!store.name || !store.name.trim()) {
            return { isValid: false, error: `사용처 ${i + 1}의 이름을 입력해주세요.` };
          }
        }
      }
    }

    return { isValid: true };
  };

  // 간단한 검증 함수 (에러 메시지 없이 true/false만 반환)
  const isValid = (): boolean => {
    return validate().isValid;
  };

  // ref를 통해 validate 함수 노출
  useImperativeHandle(ref, () => ({
    validate,
    isValid,
    uploadPendingStoreImages: async () => {
      console.log('🔵 EventInfoSection.uploadPendingStoreImages 호출, ref:', storeRegistrationSectionRef.current);
      if (storeRegistrationSectionRef.current) {
        return await storeRegistrationSectionRef.current.uploadPendingStoreImages();
      }
      console.warn('⚠️ storeRegistrationSectionRef.current가 null입니다');
      return { success: true };
    },
  }));

  // 데이터 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        name: eventName || undefined,
        domain_code: domainCode || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        event_info_config: {
          is_host_same_as_store: isHostSameAsStore,
          coupon_usage: couponUsage,
          participant_location: participantLocation || undefined,
          stores: stores.map((s) => ({
            id: s.id,
            name: s.name,
            location: s.location || '',
            benefit: s.benefit,
            usage_period: s.useEventPeriod ? null : s.usagePeriod, // 이벤트 기간 사용 시 null
            use_event_period: s.useEventPeriod,
            image_url: s.imageUrl || null,
          })),
        },
      });
    }
  }, [eventName, domainCode, startDate, endDate, isHostSameAsStore, couponUsage, participantLocation, stores, onDataChange]);


  const showBasicInfo = mode === 'all' || mode === 'basicInfo';
  const showStoreRegistration = mode === 'all' || mode === 'storeRegistration';

  return (
    <section className={`${mode === 'basicInfo' ? '' : 'space-y-6'} h-full flex flex-col`}>
      <div className={`${mode === 'basicInfo' ? 'border-x border-gray-200' : 'border border-gray-200'} bg-white p-6 shadow-sm flex-1 flex flex-col min-h-0`}>
        {mode === 'all' && (
          <>
            <h3 className="text-lg font-semibold text-gray-900">이벤트 정보</h3>
            <p className="mt-2 text-sm text-gray-500">
              이벤트 이름, 기간, 도메인 주소와 함께 쿠폰 사용처를 등록합니다.
            </p>
          </>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {/* 1. 기본 정보 - 좌우 분할 레이아웃 */}
          {showBasicInfo && (
          <div className="mb-20 flex-1 flex flex-col min-h-0">
            <SplitFormLayout
            infoBox={{
              stepNumber: 1,
              title: (
                <>
                  이벤트 기본 정보 작성 단계입니다. <span className="text-[#32373D] font-normal"><span className="text-[#4D82F3] font-bold">*표시</span>는 필수로 작성해야할 정보입니다.</span>
                </>
              ),
              description: [
                '이벤트 기본 정보 작성 단계는 이벤트 시작에 필요한 정보를 입력하는 단계입니다.',
                '여기에서 입력한 정보는 이벤트 참여 QR 발급에 사용되며, 기본 정보를 모두 작성해야 임시 저장이 가능합니다.',
              ],
            }}
            scrollHeight="calc(100vh-280px)"
            leftContent={
              <div className="grid gap-5">
                {/* 이벤트 이름 */}
                <div>
                  <FormLabel htmlFor="event-name" required>
                    이벤트 명
                  </FormLabel>
                  <FormInput
                    id="event-name"
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="이벤트 명을 입력해주세요."
                  />
                </div>

                {/* 이벤트 기간 */}
                <div>
                  <FormLabel required>
                    이벤트 기간
                  </FormLabel>
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onDateChange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                  />
                </div>

                {/* 이벤트 참여 장소 */}
                <div>
                  <FormLabel required>
                    이벤트 참여 장소
                  </FormLabel>
                  <KakaoPlaceSearch
                    value={participantLocation?.placeName || ''}
                    onSelect={(place) => {
                      setParticipantLocation(place);
                    }}
                    placeholder="이벤트 참여 장소를 검색해주세요."
                  />
                </div>

                {/* 도메인 주소 */}
                <div>
                  <FormLabel htmlFor="domain-code" required>
                    도메인 주소
                  </FormLabel>
                  <p className="text-sm text-gray-500 mb-1">띄어쓰기 없이 영문으로 입력해주세요. ex) realevent</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 whitespace-nowrap bg-gray-100 px-3 py-2 rounded border border-gray-300">
                    https://myminglz-v2-web.vercel.app
                    </span>
                    <div className="flex-1">
                      <FormInput
                        id="domain-code"
                        type="text"
                        value={domainCode}
                        onChange={(e) => {
                          const originalValue = e.target.value;
                          
                          
                          // 한글 입력 감지
                          const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(originalValue);
                          const hasInvalidChars = /[^a-zA-Z0-9-]/.test(originalValue);
                          
                          // 에러 메시지 설정
                          if (hasKorean) {
                            setDomainInputError('한글은 입력할 수 없습니다. 영문, 숫자, 하이픈(-)만 사용해주세요.');
                          } else if (hasInvalidChars) {
                            setDomainInputError('특수문자는 하이픈(-)만 사용 가능합니다.');
                          } else {
                            setDomainInputError(null);
                          }
                          
                          // 영어, 숫자, 하이픈만 허용 (실시간 필터링)
                          const value = originalValue.replace(/[^a-zA-Z0-9-]/g, '');
                          
                          
                          setDomainCode(value);
                          
                          // 입력 시 중복 검사 상태 초기화
                          // 수정 모드에서 기존 도메인 코드와 다르거나, 새 이벤트 생성 시
                          if (!isEditMode || !initialData?.domain_code || value.trim() !== initialData.domain_code) {
                            setDomainCodeAvailable(null);
                            setDomainCodeMessage(null);
                          }
                        }}
                        disabled={isEditMode && !!initialData?.domain_code}
                        placeholder="도메인 이름을 입력해주세요."
                        error={domainCodeAvailable === false}
                        success={domainCodeAvailable === true}
                        loading={domainCodeChecking}
                      />
                    </div>
                  </div>
                  
                  {/* 도메인 입력 에러 메시지 */}
                  {domainInputError && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      {domainInputError}
                    </p>
                  )}
                  
                  {isEditMode && initialData?.domain_code && (
                    <p className="mt-1 text-xs text-amber-600">
                      * 도메인 주소는 한번 설정 후 변경할 수 없습니다. 기존 QR 코드와 링크가 작동하지 않게 됩니다.
                    </p>
                  )}
                  {(!isEditMode || !initialData?.domain_code) && domainCode.trim() && (
                    <div className="mt-1">
                      {domainCodeChecking ? (
                        <p className="text-xs text-gray-500">도메인 코드 확인 중...</p>
                      ) : domainCodeMessage ? (
                        <p
                          className={`text-xs ${
                            domainCodeAvailable === true
                              ? 'text-green-600'
                              : domainCodeAvailable === false
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {domainCodeMessage}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            }
            rightContent={
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">이벤트 참여 QR 미리보기</h3>
                <div className="space-y-2 mb-6">
                  <p className="text-sm" style={{ color: '#4D82F3' }}>*이 QR 코드는 미리보기용입니다.</p>
                  <p className="text-sm text-gray-600" style={{ color: '#4D82F3' }}>
                    실제 사용 시에는 <span className="font-bold">최종 화면에서 QR을 다운로드해 인쇄 후 사용</span>해 주세요.
                  </p>
                  <p className="text-sm text-gray-600" style={{ color: '#4D82F3' }}>
                    참여자는 <span className="font-bold">해당 QR을 통해 이벤트에 참여</span>할 수 있습니다.
                  </p>
                </div>
                
                {qrLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 border border-gray-200 rounded bg-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                    <p className="text-sm text-gray-500">QR 코드 생성 중...</p>
                  </div>
                ) : qrCodeUrl ? (
                  <div className="border border-gray-200 rounded bg-white p-4">
                    <div className="flex gap-4 items-start">
                      {/* QR 코드 */}
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-white border border-gray-300 rounded">
                          <img
                            src={qrCodeUrl}
                            alt="이벤트 참여 QR 코드"
                            className="w-32 h-32"
                          />
                        </div>
                      </div>
                      {/* 이벤트 정보 */}
                      <div className="flex-1 flex flex-col justify-center space-y-3">
                        <div>
                          <div className="text-sm font-bold text-gray-600">이벤트 이름</div>
                          <div className="text-sm font-medium text-gray-900">{eventName || '-'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-600">이벤트 기간</div>
                          <div className="text-sm font-medium text-gray-900">
                            {startDate && endDate ? `${startDate} ~ ${endDate}` : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-600">이벤트 링크</div>
                          <div className="text-sm font-medium text-gray-900">
                            {domainCode ? `${process.env.NEXT_PUBLIC_WEB_URL || 'https://myminglz-v2-web.vercel.app'}/${domainCode}` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 w-full border border-gray-200 rounded bg-gray-50">
                    <p className="text-sm text-gray-400">도메인 주소를 입력하면</p>
                    <p className="text-sm text-gray-400 mt-1">QR 코드가 생성됩니다</p>
                  </div>
                )}
              </div>
            }
          />
          </div>
          )}

          {/* 2. 사용처 등록 - 좌우 분할 레이아웃 */}
          {showStoreRegistration && (
            <StoreRegistrationSection
              stores={stores}
              setStores={setStores}
              domainCode={domainCode}
              startDate={startDate}
              endDate={endDate}
              isHostSameAsStore={isHostSameAsStore}
              setIsHostSameAsStore={(value) => {
                setIsHostSameAsStore(value);
                // 토글을 false로 변경할 때 백업된 stores 복원
                if (!value && backupStoresRef.current.length > 0) {
                  setStores([...backupStoresRef.current]);
                } else if (value) {
                  // 토글을 true로 변경할 때 현재 stores 백업
                  backupStoresRef.current = [...stores];
                }
              }}
              couponUsage={couponUsage}
              setCouponUsage={setCouponUsage}
              eventName={eventName}
              participantLocation={participantLocation?.placeName || participantLocation?.addressName || participantLocation?.roadAddressName}
            />
          )}
        </div>
      </div>
    </section>
  );
});

EventInfoSection.displayName = 'EventInfoSection';

export default EventInfoSection;

