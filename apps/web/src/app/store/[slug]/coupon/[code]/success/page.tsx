'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CouponService } from '@myminglz/core';
import { useKakaoShare } from '@/hooks/useKakaoShare';
import { CouponCard } from '@/components/ui/coupon/CouponCard';
import type { Location } from '@myminglz/types';

interface LocationWithExpiry extends Location {
  coupon_expiry_days?: number | null;
}

interface CouponData {
  code: string;
  created_at: string;
  location?: LocationWithExpiry;
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

export default function SuccessPage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const { shareCoupon } = useKakaoShare();
  // const [isOpen, setIsOpen] = useState(false);
  // const onOpen = () => setIsOpen(true);
  // const onClose = () => setIsOpen(false);

  useEffect(() => {
    const fetchCouponData = async () => {
      console.log('Fetching coupon data for code:', code);
      if (!code) {
        console.error('No coupon code provided');
        return;
      }

      // 이미 Supabase가 초기화되어 있음

      try {
        // 쿠폰 데이터 조회 시작
        console.log('Starting to fetch coupon data...');

        console.log('Attempting to fetch coupon with code:', code);
        const result = await CouponService.getCouponByCode(code);
        console.log('Coupon data result:', result);
        
        if (result.data) {
          console.log('Found coupon data:', result.data);
          setCouponData({
            code: result.data.code,
            created_at: result.data.created_at,
            location: result.data.location
          });
        } else {
          console.error('쿠폰을 찾을 수 없습니다. Error:', result.error);
        }
      } catch (error) {
        console.error('쿠폰 데이터 조회 실패. Full error:', error);
      }
    };

    fetchCouponData();
  }, [code]);

  return (
    <>
      <div className="min-h-screen bg-white px-6 py-16 flex flex-col items-center">
        {/* 상단 텍스트 */}
        <div className="text-center mb-8">
          <h1 className="text-gray-900 text-[32px] font-bold mb-3 leading-tight">
            쿠폰 발급 완료!
          </h1>
          <p className="text-gray-600 text-[15px]">
            캡쳐한 쿠폰은 사용하실 수 없습니다
          </p>
        </div>

        {/* 쿠폰 카드 */}
        {couponData && (
          <div className="mb-6">
            <CouponCard
              code={couponData.code}
              createdAt={couponData.created_at}
              expiryDays={couponData.location?.coupon_expiry_days}
            />
          </div>
        )}

        {/* 내 카톡방에 보내기 버튼 */}
        <button
          className="w-full max-w-[343px] h-[56px] bg-gray-900 text-white text-[17px] font-semibold rounded-[16px] shadow-lg active:bg-gray-800 transition-colors"
          onClick={() => {
            if (couponData) {
              // location slug (domain_code) 사용 (params.slug는 location slug)
              const locationSlug = params?.slug as string;
              shareCoupon(couponData.code, locationSlug);
            }
          }}
        >
          내 카톡방에 보내기
        </button>
      </div>

      {/* 액션 시트 모달 */}
      {/* {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
            onClick={onClose}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-gray-50 z-50 pb-10 pt-2 rounded-t-[20px] animate-slide-up">
            <div className="w-[90%] max-w-[343px] mx-auto flex flex-col gap-2">
              <div className="w-full bg-white rounded-[14px] overflow-hidden shadow-sm">
                <button
                  className="w-full h-[56px] text-[17px] font-medium text-gray-900 active:bg-gray-50 transition-colors"
                  onClick={() => {
                    if (couponData) {
                      shareCoupon(couponData.code);
                    }
                    onClose();
                  }}
                >
                  카카오톡으로 공유하기
                </button>
                <button
                  className="w-full h-[56px] text-[17px] font-medium text-gray-900 border-t border-gray-200 active:bg-gray-50 transition-colors"
                  onClick={() => {
                    // 클립보드에 복사 기능 추가 예정
                    onClose();
                  }}
                >
                  링크 복사하기
                </button>
              </div>
              <button
                className="w-full h-[56px] text-[17px] font-semibold bg-white rounded-[14px] text-gray-900 active:bg-gray-50 transition-colors shadow-sm"
                onClick={onClose}
              >
                취소
              </button>
            </div>
          </div>
        </>
      )} */}
    </>
  );
}
