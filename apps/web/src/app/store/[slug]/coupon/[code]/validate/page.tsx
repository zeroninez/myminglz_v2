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

  const handleScan = async (storeSlug: string) => {
    if (isValidating) return;

    setIsValidating(true);
    try {
      // 현재 페이지의 slug와 스캔된 가게의 slug가 일치하는지 확인
      if (storeSlug !== params.slug) {
        showToast('잘못된 매장의 QR 코드입니다. 올바른 매장의 QR 코드를 스캔해주세요.');
        return;
      }

      const result = await CouponService.validateCodeAtStore(code, storeSlug);
      
      if (result.success && result.isValid && !result.isUsed) {
        // 쿠폰 사용 처리
        const useResult = await CouponService.useCouponAtStore(code, storeSlug);
        if (useResult.success) {
          showToast('쿠폰이 성공적으로 사용되었습니다!', 'success');
          router.push(`/store/${storeSlug}/coupon/${code}/complete`);
        } else {
          showToast(useResult.error || '쿠폰 사용 중 오류가 발생했습니다.');
        }
      } else {
        showToast(result.message || '유효하지 않은 쿠폰입니다.');
      }
    } catch (error) {
      console.error('쿠폰 검증 실패:', error);
      showToast('쿠폰 검증 중 오류가 발생했습니다.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <ValidateForm 
      couponCode={code}
      onScan={handleScan}
    />
  );
}
