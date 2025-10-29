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

export default function UsePage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCouponData = async () => {
      if (!code) {
        setError('쿠폰 코드가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        // Supabase 초기화
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error('서버 설정 오류');
        }

        CouponService.initialize(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const result = await CouponService.getCouponByCode(code);
        
        if (result.data) {
          setCouponData({
            code: result.data.code,
            created_at: result.data.created_at,
            location: result.data.location,
            is_used: result.data.is_used
          });
          setError(null);
        } else {
          setError(result.error || '쿠폰을 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('쿠폰 데이터 조회 실패:', error);
        setError(error instanceof Error ? error.message : '쿠폰 조회 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCouponData();
  }, [code]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white px-6 py-16 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">쿠폰 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white px-6 py-16 flex flex-col items-center justify-center">
        <div className="text-center max-w-[343px]">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">✕</span>
          </div>
          <h1 className="text-gray-900 text-[24px] font-bold mb-3">
            오류가 발생했습니다
          </h1>
          <p className="text-gray-600 text-[15px] mb-6">
            {error}
          </p>
          <button
            className="w-full h-[56px] bg-gray-900 text-white text-[17px] font-semibold rounded-[16px] shadow-lg active:bg-gray-800"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

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
