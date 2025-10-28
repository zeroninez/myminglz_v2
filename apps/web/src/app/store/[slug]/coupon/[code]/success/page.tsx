'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CouponService } from '@myminglz/core';
import { useKakaoShare } from '@/hooks/useKakaoShare';
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
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

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
      <div className="p-4 max-w-sm mx-auto bg-white text-center">
        <div className="flex flex-col space-y-4">
          <h1 className="text-xl font-bold">
            발급완료
          </h1>
          <p>
            쿠폰발급이 완료되었습니다.
          </p>
          
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
            </div>
          )}

          <div className="w-full pt-4 space-y-2">
            <button
              className="w-full h-12 bg-black text-white text-md hover:bg-gray-800 transition-colors rounded-md"
              onClick={() => {
                // 사용처 확인하기 기능 추가 예정
              }}
            >
              사용처 확인하기
            </button>
            <button
              className="w-full h-12 bg-black text-white text-md hover:bg-gray-800 transition-colors rounded-md"
              onClick={() => {
                console.log('Opening share modal...');
                onOpen();
              }}
            >
              나에게 쿠폰 보내기
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
          <div className="fixed bottom-0 w-full max-w-lg mx-auto bg-white rounded-t-2xl overflow-hidden">
            <div className="p-6">
              <p className="text-sm text-gray-600 text-center mb-6 whitespace-pre-line">
                쿠폰을 나중에 사용할 수 있도록{'\n'}쿠폰 링크를 보내드릴게요
              </p>
              <div className="space-y-2">
                <button
                  className="w-full h-12 text-black flex items-center justify-center space-x-2 border border-gray-200 rounded-md"
                  onClick={() => {
                    if (couponData) {
                      shareCoupon(couponData.code);
                    }
                    onClose();
                  }}
                >
                  <span className="mr-2">
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path fill="#3C1E1E" d="M9 0.5C4.3 0.5 0.5 3.5 0.5 7.2c0 2.3 1.5 4.3 3.8 5.5l-1 3.5c-0.1 0.2 0 0.4 0.1 0.5c0.1 0.1 0.2 0.1 0.3 0.1c0.1 0 0.2 0 0.3-0.1l4.1-2.7c0.3 0 0.6 0 0.9 0c4.7 0 8.5-3 8.5-6.7C17.5 3.5 13.7 0.5 9 0.5z"/>
                    </svg>
                  </span>
                  카카오톡으로 링크 보내기
                </button>
                <button
                  className="w-full h-12 text-black flex items-center justify-center space-x-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    // 클립보드에 복사 기능 추가 예정
                  }}
                >
                  <span className="mr-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V7C20 5.89543 19.1046 5 18 5H16M8 5V3H16V5M8 5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  링크 복사하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
