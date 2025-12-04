'use client';

import { CouponService } from '@myminglz/core';
import React from 'react';
import Script from 'next/script';

export function Providers({ children }: { children: React.ReactNode }) {
  // Supabase 환경 변수 초기화
  React.useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      CouponService.initialize(supabaseUrl, supabaseKey);
    }
  }, []);

  // Kakao SDK 초기화
  const [kakaoLoaded, setKakaoLoaded] = React.useState(false);

  React.useEffect(() => {
    if (kakaoLoaded && typeof window !== 'undefined' && window.Kakao) {
      const kakaoJS = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      if (!window.Kakao.isInitialized() && kakaoJS) {
        try {
          window.Kakao.init(kakaoJS);
          console.log('Kakao SDK initialized:', window.Kakao.isInitialized());
        } catch (error) {
          console.error('Kakao SDK initialization error:', error);
        }
      }
    }
  }, [kakaoLoaded]);

  return (
    <>
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Kakao SDK loaded');
          setKakaoLoaded(true);
        }}
        onError={(e) => {
          console.error('Kakao SDK load error:', e);
        }}
      />
      {children}
    </>
  );
}