'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ValidateForm } from '@/components/coupon/ValidateForm';
import { CouponService } from '@myminglz/core';

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.store_slug as string;
  
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    alert(message); // 임시로 alert 사용
  };
  
  const [isValidating, setIsValidating] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [validatedStoreSlug, setValidatedStoreSlug] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [couponCode, setCouponCode] = useState<string>('');

  const handleScan = async (scannedStoreSlug: string, qrImage: string) => {
    if (isValidating) return;

    console.log('🔍 QR 스캔 완료:', { 
      scannedStoreSlug, 
      storeSlug,
      couponCode,
      slugMatch: scannedStoreSlug === storeSlug
    });
    
    // 스캔한 store slug와 현재 페이지의 store slug가 일치하는지 확인
    // store slug 형식: {domain_code}-{store_name} (예: 23424324-3333)
    const normalizedScanned = scannedStoreSlug.trim();
    const normalizedCurrent = storeSlug.trim();
    
    if (normalizedScanned !== normalizedCurrent) {
      console.log('❌ Store slug 불일치:', { 
        scanned: normalizedScanned, 
        current: normalizedCurrent,
        scannedLength: normalizedScanned.length,
        currentLength: normalizedCurrent.length
      });
      showToast('이 사용처의 QR 코드가 아닙니다.');
      return;
    }

    if (!couponCode) {
      showToast('쿠폰 코드를 먼저 입력해주세요.');
      return;
    }

    setIsValidating(true);
    setQrImageUrl(qrImage);
    setValidatedStoreSlug(null);
    
    try {
      // 쿠폰 코드 검증 (store slug로 추적: {domain_code}-{store_name} 형식)
      console.log('✅ 쿠폰 검증 시작:', { code: couponCode, storeSlug: normalizedCurrent });
      const result = await CouponService.validateCodeAtStore(couponCode, normalizedCurrent);
      console.log('✅ 검증 결과:', result);
      
      if (result.success && result.isValid && !result.isUsed) {
        console.log('✅ 검증 성공 - 직원 확인 대기');
        setValidatedStoreSlug(storeSlug);
      } else {
        const errorMsg = result.message || '유효하지 않은 쿠폰입니다.';
        console.log('❌ 검증 실패:', errorMsg);
        showToast(errorMsg);
        setQrImageUrl(null);
      }
    } catch (error) {
      console.error('❌ 쿠폰 검증 실패:', error);
      showToast('쿠폰 검증 중 오류가 발생했습니다.');
      setQrImageUrl(null);
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
    if (!validatedStoreSlug || !couponCode || isConfirming) return;

    setShowConfirmModal(false);
    setIsConfirming(true);
    
    try {
      console.log('✅ 직원 확인 - 쿠폰 사용 처리 시작');
      const useResult = await CouponService.useCouponAtStore(couponCode, validatedStoreSlug);
      console.log('✅ 사용 처리 결과:', useResult);
      
      if (useResult.success) {
        showToast('쿠폰이 성공적으로 사용되었습니다!', 'success');
        router.push(`/store/${validatedStoreSlug}/coupon/${couponCode}/complete`);
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
      <div className="min-h-screen bg-white px-6 py-16 flex flex-col items-center">
        <div className="w-full max-w-[343px] mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            쿠폰 코드
          </label>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="쿠폰 코드를 입력하세요"
            className="w-full h-[48px] px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <ValidateForm 
          couponCode={couponCode || undefined}
          onScan={handleScan}
          qrImageUrl={qrImageUrl}
          isValidated={!!validatedStoreSlug}
          onConfirm={handleStaffConfirmClick}
          isConfirming={isConfirming}
        />
      </div>

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
