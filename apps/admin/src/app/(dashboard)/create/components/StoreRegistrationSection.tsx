'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { QRCodeService } from '@myminglz/core/src/utils/qr';
import { FormInput } from './FormInput';
import KakaoPlaceSearch, { type Place } from './KakaoPlaceSearch';
import DateRangePicker from './DateRangePicker';
import SplitFormLayout from './SplitFormLayout';
import ImageCropModal from './ImageCropModal';

export interface Store {
  id: string;
  name: string;
  location?: string;
  benefit: string;
  usagePeriod: string;
  useEventPeriod: boolean;
  qrCodeUrl: string | null;
  slug?: string;
  imageUrl?: string | null;
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

interface StoreRegistrationSectionProps {
  stores: Store[];
  setStores: (stores: Store[] | ((prev: Store[]) => Store[])) => void;
  domainCode: string;
  startDate: string;
  endDate: string;
  isHostSameAsStore: boolean;
  setIsHostSameAsStore: (value: boolean) => void;
  couponUsage: 'immediate' | 'later';
  setCouponUsage: (value: 'immediate' | 'later') => void;
}

export interface StoreRegistrationSectionRef {
  uploadPendingStoreImages: () => Promise<{ success: boolean; updatedStores?: Store[] }>;
}

const StoreRegistrationSection = forwardRef<StoreRegistrationSectionRef, StoreRegistrationSectionProps>(({
  stores,
  setStores,
  domainCode,
  startDate,
  endDate,
  isHostSameAsStore,
  setIsHostSameAsStore,
  couponUsage,
  setCouponUsage,
}, ref) => {
  const [storeQrLoading, setStoreQrLoading] = useState<Record<string, boolean>>({});
  const [cropModal, setCropModal] = useState<{ storeId: string; imageSrc: string } | null>(null);

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
  }, [domainCode, stores, setStores]);

  // 사용처 추가
  const addStore = () => {
    const newStore: Store = {
      id: `store-${Date.now()}`,
      name: '',
      location: '',
      benefit: '',
      usagePeriod: '',
      useEventPeriod: true,
      qrCodeUrl: null,
      imageUrl: null,
    };
    setStores([...stores, newStore]);
  };

  // 이미지 업로드 핸들러 - 크롭 모달 열기
  const handleImageUpload = (storeId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageSrc = reader.result as string;
      setCropModal({ storeId, imageSrc });
    };
    reader.readAsDataURL(file);
  };

  // 크롭 완료 핸들러 - Data URL만 저장 (업로드는 나중에)
  const handleCropComplete = (storeId: string, croppedImageUrl: string) => {
    // Data URL만 저장 (blob URL 또는 data URL)
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, imageUrl: croppedImageUrl } : s))
    );
    setCropModal(null);
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

  // 대기 중인 사용처 이미지들을 S3에 업로드
  const uploadPendingStoreImages = async (): Promise<{ success: boolean; updatedStores?: Store[] }> => {
    console.log('🔵 uploadPendingStoreImages 시작, stores:', stores);
    const uploadPromises: Promise<void>[] = [];
    const updatedStores = [...stores]; // 복사본

    // Data URL을 가진 stores 찾기 (blob: 또는 data:로 시작하는 것들)
    let uploadCount = 0;
    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];
      if (store.imageUrl && (store.imageUrl.startsWith('blob:') || store.imageUrl.startsWith('data:'))) {
        uploadCount++;
        const storeIndex = i;
        console.log(`🔵 업로드 대상 발견: ${store.name}, imageUrl: ${store.imageUrl.substring(0, 50)}...`);
        uploadPromises.push(
          (async () => {
            try {
              // Data URL을 Blob으로 변환
              const response = await fetch(store.imageUrl!);
              const blob = await response.blob();
              const file = new File([blob], `store-${store.id}-${Date.now()}.jpg`, { type: 'image/jpeg' });
              
              console.log(`🔵 이미지 업로드 시작: ${store.name}`);
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
              
              console.log(`✅ 이미지 업로드 성공: ${store.name}, URL: ${uploadData.url}`);
              // 업로드된 URL로 업데이트
              updatedStores[storeIndex] = { ...updatedStores[storeIndex], imageUrl: uploadData.url };
            } catch (error: any) {
              console.error(`❌ 사용처 이미지 업로드 실패 (${store.name}):`, error);
              throw error;
            }
          })()
        );
      } else {
        console.log(`⚪ 업로드 불필요: ${store.name}, imageUrl: ${store.imageUrl || 'null'}`);
      }
    }

    console.log(`🔵 총 ${uploadCount}개 이미지 업로드 예정`);

    try {
      // 모든 이미지 업로드 완료 대기
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
        console.log('✅ 모든 이미지 업로드 완료, updatedStores:', updatedStores);
        // 업데이트된 stores로 상태 업데이트
        setStores(updatedStores);
      } else {
        console.log('⚪ 업로드할 이미지 없음');
      }
      console.log('✅ uploadPendingStoreImages 완료, 반환할 updatedStores:', updatedStores);
      return { success: true, updatedStores };
    } catch (error: any) {
      console.error('❌ 사용처 이미지 업로드 중 오류:', error);
      return { success: false };
    }
  };

  // ref를 통해 메서드 노출
  useImperativeHandle(ref, () => ({
    uploadPendingStoreImages,
  }));

  return (
    <div className="mb-8 flex-1 flex flex-col min-h-0">
      <SplitFormLayout
        infoBox={{
          stepNumber: 2,
          title: (
            <>
              이벤트 쿠폰 조건 설정 단계입니다. <span className="text-[#32373D] font-normal"><span className="text-[#4D82F3] font-bold">*표시</span>는 필수로 작성해야할 정보입니다.</span>
            </>
          ),
          description: [
            '이벤트 쿠폰 조건 설정 단계는 이벤트 참여자에게 발급될 쿠폰의 조건과 사용 방식을 정하는 단계입니다.',
            '이 단계에서 설정한 내용은 쿠폰이 발급될 때와 사용처에서 적용될 때 기준으로 사용됩니다.',
          ],
        }}
        scrollHeight="calc(100vh-280px)"
        leftContent={
          <>
            {/* 이벤트 사용처 등록 */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">*이벤트 사용처 등록</h4>
              <p className="text-xs text-gray-500 mb-4">
                이벤트 참여 장소와 사용처가 동일할 경우, 이벤트 기본정보가 불러와집니다.
              </p>
              
              {/* 이벤트 참여 장소와 동일 옵션 */}
              <div className="mb-4">
                <div className="border border-gray-200 rounded bg-white p-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-gray-700">이벤트 참여 장소와 동일</span>
                    <div className="relative inline-block w-11 h-6">
                      <input
                        type="checkbox"
                        checked={isHostSameAsStore}
                        onChange={(e) => {
                          setIsHostSameAsStore(e.target.checked);
                          // 토글을 true로 변경할 때만 stores 비우기 (false로 변경 시 복원은 EventInfoSection에서 처리)
                          if (e.target.checked) {
                            setStores([]);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white border-2 border-[#414B55] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-[#414B55] peer-checked:border-2 peer-checked:border-[#414B55] peer-checked:after:translate-x-[20px] after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-[#414B55] after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:duration-300 peer-checked:after:bg-white"></div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 쿠폰 사용 방식 선택 */}
              <div className="mb-6">
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

              {/* 사용처 목록 */}
              <div className="space-y-4">
                {stores.map((store, index) => (
                  <div key={store.id} className="border border-gray-200 rounded overflow-hidden">
                    {/* 헤더 */}
                    <div className="bg-gray-100 px-4 py-3 rounded-t">
                      <div className="flex items-center justify-between">
                        <h6 className="text-sm font-semibold text-gray-800">사용처 {index + 1}</h6>
                        <button
                          onClick={() => removeStore(store.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          삭제하기
                        </button>
                      </div>
                    </div>
                    
                    {/* 본문 */}
                    <div className="p-4 bg-white">
                      <div className="flex gap-4">
                        {/* 왼쪽: 이미지 업로드 */}
                        <div className="flex-shrink-0">
                          <label
                            htmlFor={`store-image-${store.id}`}
                            className="flex flex-col items-center justify-center w-[92px] h-[92px] border-2 border-gray-200 border-dashed rounded cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            {store.imageUrl ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={store.imageUrl}
                                  alt="대표사진"
                                  className="w-full h-full object-cover rounded"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStores((prev) =>
                                      prev.map((s) => (s.id === store.id ? { ...s, imageUrl: null } : s))
                                    );
                                  }}
                                  className="absolute top-1 right-1 p-0.5 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <svg className="w-8 h-8" style={{ color: '#8E8E8E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <div className="flex flex-col items-center gap-0">
                                  <p className="text-xs font-medium" style={{ color: '#8E8E8E' }}>대표사진</p>
                                  <p className="text-xs font-medium" style={{ color: '#8E8E8E' }}>업로드</p>
                                </div>
                              </div>
                            )}
                            <input
                              id={`store-image-${store.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(store.id, file);
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* 오른쪽: 입력 필드들 */}
                        <div className="flex-1 space-y-4">
                          {/* 사용처 이름 */}
                          <div>
                            <FormInput
                              id={`store-name-${store.id}`}
                              type="text"
                              value={store.name}
                              onChange={(e) => updateStore(store.id, 'name', e.target.value)}
                              placeholder="*사용처 이름"
                            />
                          </div>

                          {/* 사용처 위치 */}
                          <div>
                            <KakaoPlaceSearch
                              value={store.location || ''}
                              onSelect={(place) => {
                                updateStore(store.id, 'location', place.addressName || place.roadAddressName || place.placeName);
                              }}
                              placeholder="*사용처 위치"
                            />
                          </div>

                          {/* 혜택 항목 */}
                          <div>
                            <FormInput
                              id={`store-benefit-${store.id}`}
                              type="text"
                              value={store.benefit}
                              onChange={(e) => updateStore(store.id, 'benefit', e.target.value)}
                              placeholder="*혜택 항목"
                            />
                          </div>

                          {/* 쿠폰 사용 기간 */}
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                {!store.useEventPeriod ? (
                                  <DateRangePicker
                                    startDate={store.usagePeriod.includes('~') ? store.usagePeriod.split('~')[0]?.trim() : store.usagePeriod || ''}
                                    endDate={store.usagePeriod.includes('~') ? store.usagePeriod.split('~')[1]?.trim() : ''}
                                    onDateChange={(start, end) => {
                                      updateStore(store.id, 'usagePeriod', `${start} ~ ${end}`);
                                    }}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={startDate && endDate ? `${startDate} ~ ${endDate}` : '이벤트 기간과 동일'}
                                    disabled
                                    className="w-full h-12 px-4 rounded border border-gray-300 bg-gray-50 text-sm text-gray-500"
                                  />
                                )}
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={store.useEventPeriod}
                                  onChange={(e) => updateStore(store.id, 'useEventPeriod', e.target.checked ? 'true' : 'false')}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">이벤트 기간과 동일</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 추가하기 버튼 */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={addStore}
                  disabled={isHostSameAsStore}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#414B55] text-white text-sm font-medium rounded hover:bg-[#32373D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  사용처 추가
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        }
        rightContent={
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">이벤트 사용처 QR 미리보기</h3>
            <div className="space-y-2 mb-6">
              <p className="text-sm" style={{ color: '#4D82F3' }}>*이 QR 코드는 미리보기용입니다.</p>
              <p className="text-sm text-gray-600" style={{ color: '#4D82F3' }}>
                실제 사용 시에는 <span className="font-bold">최종 화면에서 QR을 다운로드해 인쇄 후 사용</span>해 주세요.
              </p>
              <p className="text-sm text-gray-600" style={{ color: '#4D82F3' }}>
                참여자는 <span className="font-bold">해당 QR을 통해 이벤트 쿠폰을 사용</span>할 수 있습니다.
              </p>
            </div>

            {!isHostSameAsStore && stores.length > 0 ? (
              <div className="space-y-6">
                {stores.map((store, index) => (
                  <div key={store.id} className="border border-gray-200 rounded-lg bg-white p-4">
                    <div className="flex gap-4 items-start">
                      {/* QR 코드 */}
                      <div className="flex-shrink-0">
                        {storeQrLoading[store.id] ? (
                          <div className="flex flex-col items-center justify-center h-32 w-32 border border-gray-200 rounded bg-white">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                            <p className="text-xs text-gray-500">QR 생성 중...</p>
                          </div>
                        ) : store.qrCodeUrl ? (
                          <div className="p-2 bg-white border border-gray-300 rounded">
                            <img
                              src={store.qrCodeUrl}
                              alt={`${store.name} 쿠폰 QR 코드`}
                              className="w-32 h-32"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded bg-gray-50">
                            <p className="text-xs text-gray-400 text-center px-2">사용처 정보 입력 후</p>
                            <p className="text-xs text-gray-400 mt-1 text-center px-2">QR 코드가 생성됩니다</p>
                          </div>
                        )}
                      </div>
                      {/* 사용처 정보 */}
                      <div className="flex-1 flex flex-col justify-center space-y-2">
                        <div>
                          <div className="text-sm font-bold text-gray-600">[사용처 {index + 1}]</div>
                          <div className="text-sm font-medium text-gray-900">{store.name || '-'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-600">쿠폰 사용 기간</div>
                          <div className="text-sm font-medium text-gray-900">
                            {store.useEventPeriod && startDate && endDate
                              ? `${startDate} ~ ${endDate}`
                              : store.usagePeriod
                              ? store.usagePeriod
                              : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-600">혜택 항목</div>
                          <div className="text-sm font-medium text-gray-900">{store.benefit || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 w-full border border-gray-200 rounded bg-gray-50">
                <p className="text-sm text-gray-400">사용처를 등록하면</p>
                <p className="text-sm text-gray-400 mt-1">QR 코드 미리보기가 표시됩니다</p>
              </div>
            )}
          </div>
        }
      />
      
      {/* 이미지 크롭 모달 */}
      {cropModal && (
        <ImageCropModal
          imageSrc={cropModal.imageSrc}
          onCropComplete={(croppedImageUrl: string) => handleCropComplete(cropModal.storeId, croppedImageUrl)}
          onClose={() => setCropModal(null)}
        />
      )}
    </div>
  );
});

StoreRegistrationSection.displayName = 'StoreRegistrationSection';

export default StoreRegistrationSection;
