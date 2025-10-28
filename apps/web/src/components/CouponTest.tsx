'use client';

import { useEffect, useRef, useState } from 'react';
import { CouponDesign } from './CouponDesign';
import { useHtml2Canvas } from '@/hooks/useHtml2Canvas';
import { generateQRCode } from '@/utils/qrcode';

// 배경 그라데이션 프리셋
const backgroundPresets = {
  sunset: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  ocean: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  forest: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  lavender: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  cherry: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
};

import { CouponService } from '@myminglz/core';

export function CouponTest() {
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // 여기에 커스텀 토스트 구현
    alert(message); // 임시로 alert 사용
  };
  const couponRef = useRef<HTMLDivElement>(null);
  
  // 상태 관리
  const [locationSlug, setLocationSlug] = useState('test'); // location의 slug
  const [couponCode, setCouponCode] = useState('');
  const [description, setDescription] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [couponImage, setCouponImage] = useState<string | null>(null);
  const [background, setBackground] = useState(backgroundPresets.sunset);
  const [titleText, setTitleText] = useState('title');

  const { captureElement } = useHtml2Canvas({
    onSuccess: (url) => {
      setCouponImage(url);
      setIsGenerating(false);
    },
    onError: (error) => {
      showToast('쿠폰 이미지 생성 실패: ' + error.message, 'error');
      setIsGenerating(false);
    },
  });

  // 쿠폰 이미지 생성 함수
  const generateCouponImage = async () => {
    if (!couponRef.current || !couponCode) return;
    
    try {
      setCouponImage(null);
      setIsGenerating(true);
      
      // QR 코드를 먼저 생성하고 완료될 때까지 기다림
      if (!qrUrl) {
        try {
          const qrCodeUrl = await generateQRCode(couponCode);
          setQrUrl(qrCodeUrl);
          // QR 코드가 렌더링될 때까지 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('QR code generation error:', error);
        }
      }

      if (couponRef.current) {
        // 이미지 캡처 전에 모든 내용이 렌더링될 때까지 대기
        await new Promise(resolve => setTimeout(resolve, 500));
        const url = await captureElement(couponRef.current);
        if (url) {
          setCouponImage(url);
        }
      }
    } catch (error) {
      console.error('Image generation error:', error);
      showToast(error instanceof Error ? error.message : '이미지 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };



  const handleIssueCoupon = async () => {
    try {
      setLoading(true);
      console.log('Calling CouponService with locationSlug:', locationSlug);
      
      // 1. 코드 생성
      const generateResult = await CouponService.generateCodeForLocation(locationSlug);
      console.log('Code generation result:', generateResult);
      
      if (!generateResult.success || !generateResult.code) {
        throw new Error(generateResult.error || '쿠폰 코드 생성 실패');
      }

      // 2. 생성된 코드 저장
      const saveResult = await CouponService.saveCodeForLocation(generateResult.code, locationSlug);
      console.log('Save result:', saveResult);
      if (saveResult.success) {
        setCouponCode(generateResult.code);
        showToast(saveResult.message, 'success');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (couponCode && !isGenerating) {
      generateCouponImage();
    }
  }, [couponCode, description, background, titleText]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-4">쿠폰 발급</h1>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">장소 Slug</label>
            <input
              type="text"
              value={locationSlug}
              onChange={(e) => setLocationSlug(e.target.value)}
              placeholder="장소 slug 입력"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">쿠폰 설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">배경 스타일</label>
            <select
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(backgroundPresets).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">타이틀 텍스트</label>
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              placeholder="원하는 텍스트를 입력하세요 (예: SPECIAL COUPON)"
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              spellCheck="false"
              autoComplete="off"
            />
          </div>

          <button
            className={`w-full py-2 px-4 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              (loading || isGenerating) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleIssueCoupon}
            disabled={loading || isGenerating}
          >
            {loading || isGenerating ? '처리중...' : '쿠폰 발급'}
          </button>
        </div>

        {couponCode && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="font-bold mb-4">발급된 쿠폰</h2>
            
            <div className="mb-4 relative">
              {/* 실제 쿠폰 디자인 (캡처용) */}
              <div
                className={`${
                  isGenerating ? 'relative mb-4' : 'absolute left-[-9999px]'
                }`}
              >
                <CouponDesign
                  ref={couponRef}
                  couponCode={couponCode}
                  storeName={locationSlug}
                  description={description}
                  backgroundColor={background}
                  titleText={titleText}
                  qrUrl={qrUrl}
                />
              </div>

              {/* 생성된 이미지 표시 */}
              {couponImage && (
                <img
                  src={couponImage}
                  alt="쿠폰 이미지"
                  className="mx-auto block"
                />
              )}
            </div>

            {qrUrl && (
              <img
                src={qrUrl}
                alt="QR Code"
                className="w-[200px] h-[200px] mx-auto my-4"
              />
            )}

            <div className="flex space-x-4 mt-4">
              <button
                className={`px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={generateCouponImage}
                disabled={isGenerating}
              >
                이미지 다시 생성
              </button>
              <button
                className="px-4 py-2 bg-yellow-500 text-white rounded-md font-medium hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                onClick={() => {
                  if (!window.Kakao) return;
                  const url = `${window.location.origin}/coupon/${couponCode}`;
                  window.Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                      title: titleText,
                      description: description || '설명란',
                      imageUrl: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png',
                      link: {
                        mobileWebUrl: url,
                        webUrl: url
                      }
                    },
                    buttons: [
                      {
                        title: '쿠폰 받기',
                        link: {
                          mobileWebUrl: url,
                          webUrl: url
                        }
                      },
                      {
                        title: '자세히 보기',
                        link: {
                          mobileWebUrl: url,
                          webUrl: url
                        }
                      }
                    ]
                  });
                }}
              >
                카카오톡 공유
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}