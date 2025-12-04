'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { QRCodeService } from '@myminglz/core/src/utils/qr';

interface Store {
  id: string;
  name: string;
  benefit: string;
  usagePeriod: string;
  useEventPeriod: boolean; // 이벤트 기간 사용 여부
  qrCodeUrl: string | null;
  slug?: string; // store slug 추가
}

// Store name을 slug로 변환하는 함수 (API와 동일한 로직)
function generateStoreSlug(name: string, domainCode: string, index: number): string {
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-가-힣]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (!cleaned || /[가-힣]/.test(cleaned)) {
    return `${domainCode}-store-${index + 1}`;
  }
  
  return `${domainCode}-${cleaned}`;
}

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
}

export interface EventInfoSectionRef {
  validate: () => { isValid: boolean; error?: string };
}

const EventInfoSection = forwardRef<EventInfoSectionRef, EventInfoSectionProps>(
  ({ initialData, onDataChange }, ref) => {
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
  
  // 사용처 목록
  const [stores, setStores] = useState<Store[]>(() => {
    if (initialData?.event_info_config?.stores && Array.isArray(initialData.event_info_config.stores)) {
      return initialData.event_info_config.stores.map((store: any) => ({
        id: store.id || `store-${Date.now()}-${Math.random()}`,
        name: store.name || '',
        benefit: store.benefit || '',
        usagePeriod: store.usage_period || '',
        useEventPeriod: store.use_event_period !== false,
        qrCodeUrl: null,
        slug: store.slug, // DB에서 가져온 slug 포함
      }));
    }
    return [];
  });
  const [storeQrLoading, setStoreQrLoading] = useState<Record<string, boolean>>({});

  // initialData가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialData) {
      setEventName(initialData.name || '');
      setStartDate(initialData.start_date || '');
      setEndDate(initialData.end_date || '');
      setDomainCode(initialData.domain_code || '');
      setIsHostSameAsStore(initialData.event_info_config?.is_host_same_as_store || false);
      setCouponUsage(initialData.event_info_config?.coupon_usage || 'later');
      if (initialData.event_info_config?.stores && Array.isArray(initialData.event_info_config.stores)) {
        setStores(
          initialData.event_info_config.stores.map((store: any) => ({
            id: store.id || `store-${Date.now()}-${Math.random()}`,
            name: store.name || '',
            benefit: store.benefit || '',
            usagePeriod: store.usage_period || '',
            useEventPeriod: store.use_event_period !== false,
            qrCodeUrl: null,
            slug: store.slug, // DB에서 가져온 slug 포함
          }))
        );
      }
    }
  }, [initialData]);

  // 도메인 코드 중복 확인 (debounce 적용)
  useEffect(() => {
    // 수정 모드이거나 도메인 코드가 비어있으면 중복 검사 안 함
    if (initialData?.domain_code || !domainCode.trim()) {
      setDomainCodeAvailable(null);
      setDomainCodeMessage(null);
      return;
    }

    // debounce: 500ms 후에 검사
    const timeoutId = setTimeout(async () => {
      const trimmedCode = domainCode.trim();
      if (!trimmedCode) {
        setDomainCodeAvailable(null);
        setDomainCodeMessage(null);
        return;
      }

      try {
        setDomainCodeChecking(true);
        setDomainCodeAvailable(null);
        setDomainCodeMessage(null);

        const response = await fetch(`/api/events/check-domain-code?code=${encodeURIComponent(trimmedCode)}`);
        const result = await response.json();

        if (result.success) {
          setDomainCodeAvailable(result.available);
          setDomainCodeMessage(result.message);
        } else {
          setDomainCodeAvailable(false);
          setDomainCodeMessage(result.error || '도메인 코드 확인 중 오류가 발생했습니다.');
        }
      } catch (error: any) {
        console.error('도메인 코드 확인 오류:', error);
        setDomainCodeAvailable(false);
        setDomainCodeMessage('도메인 코드 확인 중 오류가 발생했습니다.');
      } finally {
        setDomainCodeChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
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

  // 사용처별 QR 코드 생성
  useEffect(() => {
    const generateStoreQRs = async () => {
      if (!domainCode.trim() || stores.length === 0) {
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://myminglz-v2-web.vercel.app';
      
      for (const store of stores) {
        // QR이 없거나 도메인 코드가 변경된 경우에만 재생성
        if (store.qrCodeUrl && domainCode.trim()) {
          // 기존 QR URL을 확인하여 같은 도메인 코드인지 체크
          try {
            const url = new URL(store.qrCodeUrl);
            // QR이 이미 생성되어 있고 도메인이 같으면 스킵
            continue;
          } catch {
            // QR URL이 유효하지 않으면 재생성
          }
        }
        
        try {
          setStoreQrLoading((prev) => ({ ...prev, [store.id]: true }));
          // store slug 생성 (쿠폰 사용 추적을 위해)
          const storeIndex = stores.findIndex(s => s.id === store.id);
          const storeSlug = store.slug || generateStoreSlug(store.name, domainCode.trim(), storeIndex >= 0 ? storeIndex : 0);
          // 간단한 형식: /verify/{store_slug}
          const verifyUrl = `${baseUrl}/verify/${storeSlug}`;
          
          const qrImageUrl = await QRCodeService.generateQRCodeURL(verifyUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          
          setStores((prev) =>
            prev.map((s) => (s.id === store.id ? { ...s, qrCodeUrl: qrImageUrl, slug: storeSlug } : s))
          );
        } catch (error) {
          console.error(`사용처 ${store.name} QR 코드 생성 실패:`, error);
        } finally {
          setStoreQrLoading((prev) => ({ ...prev, [store.id]: false }));
        }
      }
    };

    generateStoreQRs();
  }, [domainCode, stores]);

  // 사용처 추가
  const addStore = () => {
    const newStore: Store = {
      id: `store-${Date.now()}`,
      name: '',
      benefit: '',
      usagePeriod: '',
      useEventPeriod: true, // 기본값: 이벤트 기간 사용
      qrCodeUrl: null,
    };
    setStores([...stores, newStore]);
  };

  // 사용처 삭제
  const removeStore = (storeId: string) => {
    setStores(stores.filter((s) => s.id !== storeId));
  };

  // 사용처 정보 업데이트
  const updateStore = (storeId: string, field: keyof Store, value: string | boolean) => {
    setStores((prev) =>
      prev.map((s) => {
        if (s.id === storeId) {
          if (field === 'useEventPeriod') {
            return { ...s, [field]: value === 'true' || value === true };
          }
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  // 검증 함수
  const validate = (): { isValid: boolean; error?: string } => {
    // 1. 이벤트 이름 필수
    if (!eventName || !eventName.trim()) {
      return { isValid: false, error: '이벤트 이름을 입력해주세요.' };
    }

    // 2. 도메인 코드 필수
    if (!domainCode || !domainCode.trim()) {
      return { isValid: false, error: '도메인 주소를 입력해주세요.' };
    }

    // 3. 도메인 코드 중복 확인 (수정 모드가 아닌 경우)
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

    return { isValid: true };
  };

  // ref를 통해 validate 함수 노출
  useImperativeHandle(ref, () => ({
    validate,
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
          stores: isHostSameAsStore ? [] : stores.map((s) => ({
            id: s.id,
            name: s.name,
            benefit: s.benefit,
            usage_period: s.useEventPeriod ? null : s.usagePeriod, // 이벤트 기간 사용 시 null
            use_event_period: s.useEventPeriod,
          })),
        },
      });
    }
  }, [eventName, domainCode, startDate, endDate, isHostSameAsStore, couponUsage, stores, onDataChange]);

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">이벤트 정보</h3>
        <p className="mt-2 text-sm text-gray-500">
          이벤트 이름, 기간, 도메인 주소와 함께 쿠폰 사용처를 등록합니다.
        </p>

        <div className="mt-6">
          {/* 1. 기본 정보 - 좌우 분할 레이아웃 */}
          <div className="grid gap-6 md:grid-cols-[1fr_360px]">
            {/* 좌측: 입력 폼 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800">1. 기본 정보</h4>
              <p className="mt-1 text-xs text-gray-500">
                이벤트 제목, 이벤트 기간, 도메인 주소 등을 입력합니다.
              </p>
              <div className="mt-3 grid gap-3">
                {/* 이벤트 이름 */}
                <div>
                  <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
                    이벤트 이름
                  </label>
                  <input
                    id="event-name"
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="이벤트 이름"
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                {/* 이벤트 기간 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이벤트 기간
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={getTodayDate()}
                        placeholder="이벤트 시작일"
                        className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || getTodayDate()}
                        placeholder="이벤트 마감일"
                        className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 도메인 주소 */}
                <div>
                  <label htmlFor="domain-code" className="block text-sm font-medium text-gray-700 mb-1">
                    도메인 주소 (한번 설정 후 수정 불가, 영어만 입력) {initialData?.domain_code && <span className="text-xs text-gray-500 font-normal">(한번 설정 후 수정 불가)</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      https://myminglz-v2-web.vercel.app/
                    </span>
                    <div className="flex-1 relative">
                    <input
                      id="domain-code"
                      type="text"
                      value={domainCode}
                        onChange={(e) => {
                          // 영어, 숫자, 하이픈만 허용
                          const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                          setDomainCode(value);
                          // 입력 시 중복 검사 상태 초기화
                          if (!initialData?.domain_code) {
                            setDomainCodeAvailable(null);
                            setDomainCodeMessage(null);
                          }
                        }}
                        disabled={!!initialData?.domain_code}
                        placeholder="영어, 숫자, 하이픈(-)만 입력"
                        className={`w-full h-12 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 ${
                          domainCodeAvailable === false
                            ? 'border-red-300 focus:ring-red-500'
                            : domainCodeAvailable === true
                            ? 'border-green-300 focus:ring-green-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {domainCodeChecking && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                      {!domainCodeChecking && domainCodeAvailable === true && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {!domainCodeChecking && domainCodeAvailable === false && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  {initialData?.domain_code && (
                    <p className="mt-1 text-xs text-amber-600">
                      * 도메인 주소는 한번 설정 후 변경할 수 없습니다. 기존 QR 코드와 링크가 작동하지 않게 됩니다.
                    </p>
                  )}
                  {!initialData?.domain_code && domainCode.trim() && (
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
            </div>

            {/* 우측: 이벤트 참여 QR */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">*이벤트 참여 QR</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                해당 QR을 인쇄하여{' '}
                <span className="underline">이벤트 발행처에서 노출시켜야 합니다.</span>
                {isHostSameAsStore && (
                  <>
                    <br />
                    <span className="text-blue-600 font-medium">* 이벤트 주최 = 사용처인 경우, 이 QR 코드를 검증 QR 코드로도 사용할 수 있습니다.</span>
                  </>
                )}
              </p>
              
              <div className="mt-6 flex items-center justify-center">
                {qrLoading ? (
                  <div className="flex flex-col items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                    <p className="text-sm text-gray-500">QR 코드 생성 중...</p>
                  </div>
                ) : qrCodeUrl ? (
                  <div className="flex flex-col items-center">
                    <div className="p-2 bg-white rounded-lg border-2 border-pink-200">
                      <img
                        src={qrCodeUrl}
                        alt="이벤트 참여 QR 코드"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-400">도메인 주소를 입력하면</p>
                    <p className="text-sm text-gray-400 mt-1">QR 코드가 생성됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. 사용처 등록 */}
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-gray-800">2. 사용처 등록</h4>
            <p className="mt-1 text-xs text-gray-500">
              쿠폰 사용이 가능한 매장/지점 정보를 등록합니다.
            </p>

            {/* 이벤트 주최 = 사용처 옵션 */}
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHostSameAsStore}
                  onChange={(e) => {
                    setIsHostSameAsStore(e.target.checked);
                    if (e.target.checked) {
                      // 주최 = 사용처 선택 시 사용처 목록 초기화
                      setStores([]);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">이벤트 주최 = 사용처</span>
              </label>
              {isHostSameAsStore && (
                <p className="mt-2 text-xs text-blue-600">
                  * 이벤트 주최가 사용처와 동일한 경우, 별도 사용처 등록 없이 도메인 주소로 검증이 가능합니다. 진입 QR 코드를 검증 QR 코드로도 사용할 수 있습니다.
                </p>
              )}
            </div>

            {/* 쿠폰 사용 방식 선택 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">쿠폰 사용</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="coupon-usage"
                    value="immediate"
                    checked={couponUsage === 'immediate'}
                    onChange={(e) => setCouponUsage(e.target.value as 'immediate' | 'later')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">즉시사용</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="coupon-usage"
                    value="later"
                    checked={couponUsage === 'later'}
                    onChange={(e) => setCouponUsage(e.target.value as 'immediate' | 'later')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">나중에 사용</span>
                </label>
              </div>
              {couponUsage === 'later' && (
                <p className="mt-2 text-xs text-blue-600">
                  *나중에 사용을 택하면 사용자가 쿠폰을 저장했다가 나중에 사용 가능합니다.
                </p>
              )}
            </div>

            {/* 사용처 정보 테이블 */}
            <div className={`mt-6 ${isHostSameAsStore ? 'opacity-50 pointer-events-none' : ''}`}>
              <h5 className="text-sm font-semibold text-gray-800 mb-3">사용처 정보</h5>
              
              {/* 테이블 헤더 */}
              <div className="grid grid-cols-12 gap-2 mb-2 pb-2 border-b border-gray-200 text-xs font-medium text-gray-600">
                <div className="col-span-1">NO.</div>
                <div className="col-span-3">사용처 이름</div>
                <div className="col-span-4">이벤트 혜택 내용</div>
                <div className="col-span-3">이벤트 쿠폰 사용 기간</div>
                <div className="col-span-1"></div>
              </div>

              {/* 사용처 목록 */}
              <div className="space-y-3">
                {stores.map((store, index) => (
                  <div key={store.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 text-sm text-gray-600">사용처 {index + 1}</div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={store.name}
                        onChange={(e) => updateStore(store.id, 'name', e.target.value)}
                        placeholder="사용처 이름"
                        className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={store.benefit}
                        onChange={(e) => updateStore(store.id, 'benefit', e.target.value)}
                        placeholder="혜택 내용"
                        className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={store.useEventPeriod}
                            onChange={(e) => updateStore(store.id, 'useEventPeriod', e.target.checked ? 'true' : 'false')}
                            className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span>이벤트 기간 사용</span>
                        </label>
                        {!store.useEventPeriod && (
                          <input
                            type="date"
                            value={store.usagePeriod}
                            onChange={(e) => updateStore(store.id, 'usagePeriod', e.target.value)}
                            min={startDate || undefined}
                            max={endDate || undefined}
                            disabled={!startDate || !endDate}
                            className="flex-1 h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                            title={!startDate || !endDate ? '먼저 이벤트 기간을 설정해주세요' : ''}
                          />
                        )}
                        {store.useEventPeriod && (
                          <span className="flex-1 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 flex items-center">
                            {startDate && endDate ? `${startDate} ~ ${endDate}` : '이벤트 기간 사용'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeStore(store.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="삭제"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 추가하기 버튼 */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={addStore}
                  disabled={isHostSameAsStore}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  추가하기
                </button>
              </div>
            </div>
          </div>

          {/* 이벤트 미션 인증 QR (가로 배치) */}
          {!isHostSameAsStore && stores.length > 0 && (
            <div className="mt-8">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">*이벤트 미션 인증 QR</h3>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  해당 QR을 인쇄하여{' '}
                  <span className="underline">이벤트 사용처에서 노출시켜야 합니다.</span>
                </p>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {stores.map((store, index) => (
                    <div key={store.id} className="flex flex-col items-center">
                      <p className="text-sm font-medium text-gray-700 mb-2 text-center">
                        사용처 {index + 1}: {store.name || '(이름 없음)'}
                      </p>
                      <div className="flex items-center justify-center">
                        {storeQrLoading[store.id] ? (
                          <div className="flex flex-col items-center justify-center h-32 w-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                            <p className="text-xs text-gray-500">QR 생성 중...</p>
                          </div>
                        ) : store.qrCodeUrl ? (
                          <div className="flex flex-col items-center">
                            <div className="p-2 bg-white rounded-lg border-2 border-teal-200">
                              <img
                                src={store.qrCodeUrl}
                                alt={`${store.name} 검증 QR 코드`}
                                className="w-32 h-32"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                            <p className="text-xs text-gray-400 text-center px-2">사용처 정보 입력 후</p>
                            <p className="text-xs text-gray-400 mt-1 text-center px-2">QR 코드가 생성됩니다</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

EventInfoSection.displayName = 'EventInfoSection';

export default EventInfoSection;

