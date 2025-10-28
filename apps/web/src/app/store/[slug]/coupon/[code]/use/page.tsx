'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CouponService } from '@myminglz/core';
import type { Location } from '@myminglz/types';

interface LocationWithExpiry extends Location {
  coupon_expiry_days?: number | null;
}

interface CouponData {
  code: string;
  created_at: string;
  location?: LocationWithExpiry;
  is_used: boolean;
}

// Supabase 초기화 함수
const initializeSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are not set');
    return false;
  }

  try {
    CouponService.initialize(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    return false;
  }
};

// 컴포넌트 마운트 전에 Supabase 초기화
initializeSupabase();

export default function UsePage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCouponData = async () => {
      if (!code) {
        console.error('No coupon code provided');
        return;
      }

      try {
        const result = await CouponService.getCouponByCode(code);
        
        if (result.data) {
          setCouponData({
            code: result.data.code,
            created_at: result.data.created_at,
            location: result.data.location,
            is_used: result.data.is_used
          });
        } else {
          console.error('쿠폰을 찾을 수 없습니다. Error:', result.error);
        }
      } catch (error) {
        console.error('쿠폰 데이터 조회 실패:', error);
      }
    };

    fetchCouponData();
  }, [code]);


  return (
    <div className="p-4 max-w-sm mx-auto bg-white text-center">
      <div className="flex flex-col space-y-4">
        <h1 className="text-xl font-bold">
          쿠폰 사용
        </h1>
        
        {couponData && (
          <div className="w-full bg-gray-50 p-4 rounded-md space-y-2">
            <p className="text-lg font-bold">
              {couponData.code}
            </p>
            <p className="text-sm text-gray-600">
              발급일시: {new Date(couponData.created_at).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-sm text-gray-600">
              유효기간: {couponData.location?.coupon_expiry_days ? `${new Date(new Date(couponData.created_at).getTime() + (couponData.location.coupon_expiry_days * 24 * 60 * 60 * 1000)).toLocaleDateString('ko-KR')} 까지` : '없음'}
            </p>
            {couponData.is_used && (
              <p className="text-red-500 font-bold">
                이미 사용된 쿠폰입니다
              </p>
            )}
          </div>
        )}

        <div className="w-full pt-4 space-y-2">
          <button
            className={`w-full h-12 bg-black text-white text-md rounded-md transition-colors ${
              couponData?.is_used ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
            }`}
            onClick={() => router.push(`/store/${params.slug}/coupon/${code}/validate`)}
            disabled={couponData?.is_used}
          >
            쿠폰 사용하기
          </button>
          <button
            className="w-full h-12 border border-gray-200 text-md rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => {
              // TODO: 사용처 정보 페이지로 이동
            }}
          >
            사용처 정보
          </button>
        </div>
      </div>
    </div>
  );
}
