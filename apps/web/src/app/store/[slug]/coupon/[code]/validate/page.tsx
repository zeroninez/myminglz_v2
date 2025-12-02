'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CouponService } from '@myminglz/core';
import { ValidateForm } from '@/components/coupon/ValidateForm';

export default function ValidatePage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    // 여기에 커스텀 토스트 구현
    alert(message); // 임시로 alert 사용
  };
  const [isValidating, setIsValidating] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [validatedStoreSlug, setValidatedStoreSlug] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleScan = async (scannedStoreSlug: string, qrImage: string) => {
    if (isValidating) return;

    console.log('🔍 QR 스캔 완료:', { 
      scannedStoreSlug, 
      code 
    });

    setIsValidating(true);
    setQrImageUrl(qrImage); // QR 이미지 저장
    setValidatedStoreSlug(null); // 이전 검증 결과 초기화
    
    try {
      // 스캔한 매장에서 쿠폰 코드 검증 (store slug로 추적)
      console.log('✅ 쿠폰 검증 시작:', { code, storeSlug: scannedStoreSlug });
      const result = await CouponService.validateCodeAtStore(code, scannedStoreSlug);
      console.log('✅ 검증 결과:', result);
      
      if (result.success && result.isValid && !result.isUsed) {
        // 검증 성공 - 직원 확인 버튼 표시를 위해 storeSlug 저장
        console.log('✅ 검증 성공 - 직원 확인 대기');
        setValidatedStoreSlug(scannedStoreSlug);
      } else {
        const errorMsg = result.message || '유효하지 않은 쿠폰입니다.';
        console.log('❌ 검증 실패:', errorMsg);
        showToast(errorMsg);
        setQrImageUrl(null); // 에러 시 이미지 제거
      }
    } catch (error) {
      console.error('❌ 쿠폰 검증 실패:', error);
      showToast('쿠폰 검증 중 오류가 발생했습니다.');
      setQrImageUrl(null); // 에러 시 이미지 제거
    } finally {
      setIsValidating(false);
    }
  };

  const handleStaffConfirmClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmModalClose = () => {
    setShowConfirmModal(false);
  };

  const handleConfirmUse = async () => {
    if (!validatedStoreSlug || isConfirming) return;

    setShowConfirmModal(false);
    setIsConfirming(true);
    
    try {
      console.log('✅ 직원 확인 - 쿠폰 사용 처리 시작');
      const useResult = await CouponService.useCouponAtStore(code, validatedStoreSlug);
      console.log('✅ 사용 처리 결과:', useResult);
      
      if (useResult.success) {
        showToast('쿠폰이 성공적으로 사용되었습니다!', 'success');
        router.push(`/store/${validatedStoreSlug}/coupon/${code}/complete`);
      } else {
        showToast(useResult.error || '쿠폰 사용 중 오류가 발생했습니다.');
        setQrImageUrl(null);
        setValidatedStoreSlug(null);
      }
    } catch (error) {
      console.error('❌ 쿠폰 사용 실패:', error);
      showToast('쿠폰 사용 중 오류가 발생했습니다.');
      setQrImageUrl(null);
      setValidatedStoreSlug(null);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <ValidateForm 
        couponCode={code}
        onScan={handleScan}
        qrImageUrl={qrImageUrl}
        isValidated={!!validatedStoreSlug}
        onConfirm={handleStaffConfirmClick}
        isConfirming={isConfirming}
      />

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-5">
          <div className="bg-white rounded-[20px] w-full max-w-[300px] p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-600 text-2xl">!</span>
            </div>
            <h3 className="text-[18px] font-bold text-gray-900 mb-2">
              쿠폰을 사용하시겠습니까?
            </h3>
            <p className="text-[14px] text-gray-600 mb-6">
              쿠폰을 사용한 후에는 재발급해야합니다
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 h-[48px] bg-gray-100 text-gray-900 text-[15px] font-medium rounded-[12px] active:bg-gray-200"
                onClick={handleConfirmModalClose}
              >
                취소
              </button>
              <button
                className="flex-1 h-[48px] bg-gray-900 text-white text-[15px] font-semibold rounded-[12px] active:bg-gray-800"
                onClick={handleConfirmUse}
                disabled={isConfirming}
              >
                {isConfirming ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
