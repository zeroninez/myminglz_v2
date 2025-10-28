'use client';

import { ValidateForm } from '@/components/coupon/ValidateForm';
import { useCouponStorage } from '@/hooks/useCouponStorage';
import { useEffect, useState } from 'react';

export default function ValidatePage() {
  const { getFromSession } = useCouponStorage();
  const [couponCode, setCouponCode] = useState<string | null>(null);

  useEffect(() => {
    const code = getFromSession('tempCouponCode');
    if (code) setCouponCode(code);
  }, []);

  const handleScan = (result: string) => {
    console.log('QR Scan result:', result);
    // 여기서 QR 코드 검증 로직 구현
  };

  return <ValidateForm couponCode={couponCode || undefined} onScan={handleScan} />;
}
