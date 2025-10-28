'use client';

import { useParams } from 'next/navigation';
import { CouponDesign } from '@/components/CouponDesign';

export default function CouponPage() {
  const params = useParams();
  const code = typeof params.code === 'string' ? params.code : '';
  const couponData = {
    code: code,
    location: { name: '테스트 매장' }
  };

  if (!code) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">유효하지 않은 쿠폰 코드입니다.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <CouponDesign
          couponCode={couponData.code}
          storeName={couponData.location?.name}
          titleText={couponData.location?.name + ' 방문 쿠폰'}
        />
        <div>
          <p className="text-center text-gray-500 text-sm">
            * 본 쿠폰은 매장에서 1회만 사용 가능합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
