'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CouponService } from '@myminglz/core';
import { CouponCard } from '@/components/ui/coupon/CouponCard';
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
    <div className="min-h-screen bg-white px-6 py-16 flex flex-col items-center">
      {/* 상단 텍스트 */}
      <div className="text-center mb-8">
        <h1 className="text-gray-900 text-[32px] font-bold mb-3 leading-tight">
        쿠폰     
        </h1>
        <p className="text-gray-600 text-[15px]">
        캡쳐 x
        </p>
      </div>

      {/* 쿠폰 카드 */}
      {couponData && (
        <div className="mb-6">
          <CouponCard
            code={couponData.code}
            createdAt={couponData.created_at}
            expiryDays={couponData.location?.coupon_expiry_days}
            isUsed={couponData.is_used}
          />
        </div>
      )}

      {/* 버튼 그룹 */}
      <div className="w-full max-w-[343px] space-y-3">
        <button
          className={`w-full h-[56px] bg-gray-900 text-white text-[17px] font-semibold rounded-[16px] shadow-lg transition-colors ${
            couponData?.is_used ? 'opacity-50 cursor-not-allowed' : 'active:bg-gray-800'
          }`}
          onClick={() => router.push(`/store/${params.slug}/coupon/${code}/validate`)}
          disabled={couponData?.is_used}
        >
          쿠폰 사용하기
        </button>
        <button
          className="w-full h-[56px] border-2 border-gray-200 text-gray-900 text-[17px] font-medium rounded-[16px] active:bg-gray-50 transition-colors"
          onClick={() => {
            // TODO: 사용처 정보 페이지로 이동
          }}
        >
          사용처 예정
        </button>
      </div>
    </div>
  );
}
