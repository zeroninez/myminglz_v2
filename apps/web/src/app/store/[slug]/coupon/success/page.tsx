'use client';

import { useCouponStorage } from '@/hooks/useCouponStorage';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CouponService } from '@myminglz/core';
import type { Location } from '@myminglz/types';

interface CouponData {
  code: string;
  created_at: string;
  location?: Location;
}

export default function SuccessPage() {
  const router = useRouter();
  const { getFromLocal } = useCouponStorage();
  const [couponData, setCouponData] = useState<CouponData | null>(null);

  useEffect(() => {
    const fetchCouponData = async () => {
      const pathParts = window.location.pathname.split('/');
      const code = pathParts[pathParts.length - 2];
      if (!code) return;

      try {
        const result = await CouponService.getCouponByCode(code);
        if (result.data) {
          setCouponData({
            code: result.data.code,
            created_at: result.data.created_at,
            location: result.data.location
          });
        } else {
          console.error('쿠폰을 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('쿠폰 데이터 조회 실패:', error);
      }
    };

    fetchCouponData();
  }, []);

  return (
    <div className="p-8 max-w-sm mx-auto bg-white rounded-lg text-center">
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">
          발급완료
        </h1>
        <p className="text-lg">
          쿠폰발급이 완료
          되었습니다.
        </p>
        
        {couponData && (
          <>
            <p className="font-mono text-md">
              {couponData.code}
            </p>
            
            <div className="flex flex-col space-y-2 w-full">
              <p className="text-sm text-gray-500">
                발급일시: {new Date(couponData.created_at).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                유효기간: {new Date(new Date(couponData.created_at).getTime() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString()} 까지
              </p>
            </div>
          </>
        )}

        <div className="flex flex-col space-y-3 w-full pt-4">
          <button
            className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            onClick={() => {
              // 사용처 확인하기 기능 추가 예정
            }}
          >
            사용처 확인하기
          </button>
          <button
            className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            onClick={() => {
              // 나에게 쿠폰보내기 기능 추가 예정
            }}
          >
            나에게 쿠폰 보내기
          </button>
        </div>
      </div>
    </div>
  );
}
