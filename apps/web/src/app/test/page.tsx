'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CouponService } from '@myminglz/core';

export default function TestPage() {
  const router = useRouter();
  const [immediateUse, setImmediateUse] = useState(false);

  const handleStart = async () => {
    try {
      if (immediateUse) {
        // 즉시사용 ON - 발급 후 바로 검증
        router.push('/store/test/coupon/validate');
      } else {
        // 즉시사용 OFF - 발급 후 보관
        // 새 쿠폰 생성
        // 쿠폰 코드 생성 및 저장
        console.log('Generating coupon code...');
        const result = await CouponService.generateCodeForLocation('test-location');
        console.log('Generation result:', result);
        
        if (!result.success || !result.code) {
          console.error('쿠폰 생성 실패:', result.error);
          alert('쿠폰 생성 실패: ' + result.error);
          return;
        }

        // DB에 저장
        console.log('Saving coupon code:', result.code);
        const saveResult = await CouponService.saveCodeForLocation(result.code, 'test-location');
        console.log('Save result:', saveResult);
        
        if (!saveResult.success) {
          console.error('쿠폰 저장 실패:', saveResult.error);
          alert('쿠폰 저장 실패: ' + saveResult.error);
          return;
        }
        
        const finalCode = result.code;
        console.log('Redirecting to success page with code:', finalCode);
        router.push(`/store/test/coupon/${finalCode}/success`);
      }
    } catch (error) {
      console.error('테스트 시작 에러:', error);
      alert('에러 발생: ' + (error instanceof Error ? error.message : '알 수 없는 에러'));
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col space-y-6">
        <h1 className="text-xl font-bold">쿠폰 서비스 테스트</h1>
        
        <div className="flex items-center">
          <label htmlFor="immediate-use" className="flex-grow">
            즉시사용
          </label>
          <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
            <input
              type="checkbox"
              id="immediate-use"
              className="peer sr-only"
              checked={immediateUse}
              onChange={(e) => setImmediateUse(e.target.checked)}
            />
            <span className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-200 ${
              immediateUse ? 'translate-x-6 bg-white' : 'bg-white'
            }`} />
            <span className={`absolute inset-0 rounded-full transition-colors duration-200 ${
              immediateUse ? 'bg-blue-500' : 'bg-gray-200'
            }`} />
          </div>
        </div>

        <p className="text-sm text-gray-600 whitespace-pre-line">
          즉시사용: {immediateUse ? "ON" : "OFF"}
          {immediateUse 
            ? "\n* 발급 즉시 매장에서 사용할 수 있습니다."
            : "\n* 발급된 쿠폰을 보관하고 나중에 사용할 수 있습니다."}
        </p>

        <button
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={handleStart}
        >
          테스트 시작
        </button>
      </div>
    </div>
  );
}