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
      console.log('Supabase initialized');
    } else {
      console.warn('Supabase credentials not found in environment variables');
    }
  }, []);

  // Kakao SDK 초기화
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const kakaoJS = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      if (!window.Kakao?.isInitialized() && kakaoJS) {
        window.Kakao.init(kakaoJS);
        console.log('Kakao SDK initialized:', window.Kakao.isInitialized());
      }
    }
  }, []);

  return (
    <>
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}