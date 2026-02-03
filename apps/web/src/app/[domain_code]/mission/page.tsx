'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CouponService } from '@myminglz/core';

interface EventData {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  background_color: string;
  mission_config?: {
    type: string;
    hashtags: string[];
  } | null;
  event_info_config?: {
    coupon_usage?: 'immediate' | 'later';
    stores?: Array<{
      id?: string;
      name?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  } | null;
  stores?: Array<{
    id: string;
    name: string;
    slug: string;
    location_id: string;
    description?: string;
    is_active: boolean;
  }>;
}

export default function MissionPage() {
  const params = useParams();
  const router = useRouter();
  const domainCode = params.domain_code as string;
  
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // 포토캡쳐 관련 상태
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: 사진촬영, 2: 해시태그 추가, 3: 공유
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // 카메라 관련 refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!domainCode) return;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        console.log('🚀 이벤트 조회 시작 - domain_code:', domainCode);
        
        const response = await fetch(`/api/events/${domainCode}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API 오류 응답:', errorText);
          setError(`서버 오류 (${response.status}): 이벤트를 찾을 수 없습니다.`);
          return;
        }
        
        const result = await response.json();

        if (!result.success) {
          setError(result.error || '이벤트를 찾을 수 없습니다.');
          return;
        }

        setEventData(result.data);
      } catch (err: any) {
        console.error('이벤트 로드 오류:', err);
        setError(`이벤트를 불러오는 중 오류가 발생했습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [domainCode]);

  // 카메라 시작
  const startCamera = async () => {
    try {
      console.log('🎥 카메라 시작...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // 전면 카메라
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      console.log('✅ 카메라 스트림 받음');

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        await new Promise<void>((resolve) => {
          const onLoadedMetadata = () => {
            console.log('📹 비디오 메타데이터 로드');
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            resolve();
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          
          video.play().catch((err) => {
            console.error('비디오 재생 실패:', err);
            resolve();
          });
        });

        await new Promise((resolve) => setTimeout(resolve, 200));
        setIsCameraActive(true);
        console.log('✅ 카메라 활성화 완료');
      }
    } catch (error) {
      console.error('❌ 카메라 접근 실패:', error);
      alert('카메라 권한이 필요합니다.');
    }
  };

  // 카메라 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  // 사진 촬영
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isCameraActive) {
      return;
    }

    // Canvas 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 비디오 프레임을 Canvas에 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Canvas를 이미지 데이터 URL로 변환
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    setCurrentStep(2);
    
    // 카메라 중지
    stopCamera();
  };

  // 컴포넌트 언마운트 시 카메라 중지
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 미션 완료 처리
  const handleMissionComplete = async () => {
    if (!eventData) return;

    try {
      setIsCompleting(true);

      // event_info_config에서 설정 가져오기
      const couponUsage = eventData.event_info_config?.coupon_usage || 'later';
      const isHostSameAsStore = eventData.event_info_config?.is_host_same_as_store || false;
      
      // Stores 정보 가져오기
      const stores = eventData.stores || [];
      const firstStore = stores[0];
      const storeSlug = isHostSameAsStore 
        ? domainCode
        : (firstStore?.slug || domainCode || 'default');
      const locationSlug = domainCode;
      
      console.log('🔍 Store 정보:', {
        stores,
        firstStore,
        storeSlug,
        locationSlug,
        domainCode,
        couponUsage,
      });

      // 쿠폰 코드 생성
      console.log('Generating coupon code...');
      const result = await CouponService.generateCodeForLocation(locationSlug);
      console.log('Generation result:', result);
      
      if (!result.success || !result.code) {
        console.error('쿠폰 생성 실패:', result.error);
        const errorMessage = result.error?.includes('장소를 찾을 수 없습니다') 
          ? `장소를 찾을 수 없습니다. 관리자에게 문의해주세요. (사용된 slug: ${locationSlug})`
          : result.error || '알 수 없는 오류';
        alert('쿠폰 생성 실패: ' + errorMessage);
        setIsCompleting(false);
        return;
      }

      // DB에 저장
      console.log('Saving coupon code:', result.code);
      const saveResult = await CouponService.saveCodeForLocation(result.code, locationSlug);
      console.log('Save result:', saveResult);
      
      if (!saveResult.success) {
        console.error('쿠폰 저장 실패:', saveResult.error);
        alert('쿠폰 저장 실패: ' + saveResult.error);
        setIsCompleting(false);
        return;
      }
      
      const finalCode = result.code;

      if (couponUsage === 'immediate') {
        console.log('Redirecting to validate page with code:', finalCode);
        router.push(`/store/${locationSlug}/coupon/${finalCode}/validate`);
      } else {
        console.log('Redirecting to success page with code:', finalCode);
        router.push(`/store/${locationSlug}/coupon/${finalCode}/success`);
      }
    } catch (error) {
      console.error('미션 완료 에러:', error);
      alert('에러 발생: ' + (error instanceof Error ? error.message : '알 수 없는 에러'));
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">이벤트를 찾을 수 없습니다</h1>
          <p className="text-gray-600">{error || '존재하지 않는 이벤트입니다.'}</p>
          <p className="text-sm text-gray-500 mt-2">도메인 코드: {domainCode}</p>
        </div>
      </div>
    );
  }

  // 해시태그가 없으면 기본 해시태그 사용
  const hashtags = eventData.mission_config?.hashtags && eventData.mission_config.hashtags.length > 0 
    ? eventData.mission_config.hashtags 
    : ['#이벤트', '#참여완료'];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#DEE7EC' }}>
      {/* 헤더 - 단계 표시 */}
      <div className="bg-white px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* 1-2-3 단계 표시 */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center">
              {/* Step 1 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-[#56A3FF] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              
              {/* Line 1-2 */}
              <div className={`w-12 h-0.5 ${
                currentStep >= 2 ? 'bg-white' : 'bg-[#AAD1FF]'
              }`} />
              
              {/* Step 2 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-white text-[#56A3FF] border-2 border-[#56A3FF]' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              
              {/* Line 2-3 */}
              <div className={`w-12 h-0.5 ${
                currentStep >= 3 ? 'bg-[#56A3FF]' : 'bg-[#AAD1FF]'
              }`} />
              
              {/* Step 3 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 3 ? 'bg-[#56A3FF] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* STEP 2 라벨 */}
          <div className="flex justify-center mb-4">
            <div className="bg-[#56A3FF] text-white px-3 py-1 rounded text-xs font-bold">
              STEP 2
            </div>
          </div>

          {/* 제목 */}
          <h1 className="text-xl font-bold text-center text-gray-900 mb-2">
            사진을 찍고 해시태그를 추가해 주세요!
          </h1>

          {/* 설명 */}
          <p className="text-sm text-gray-600 text-center mb-4">
            해시태그를 추가해 인스타그램, 페이스북,<br />
            카카오톡에 공유해 주세요!
          </p>

          {/* 해시태그 표시 */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {hashtags.map((hashtag, index) => (
              <span
                key={index}
                className="bg-[#56A3FF] text-white px-3 py-1 rounded-full text-sm"
              >
                {hashtag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* 사진 영역 */}
          <div className="bg-gray-300 aspect-square rounded-lg mb-6 flex items-center justify-center relative overflow-hidden">
            {capturedImage ? (
              <img 
                src={capturedImage} 
                alt="촬영된 사진" 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : isCameraActive ? (
              <>
                {/* 카메라 비디오 */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
                
                {/* 촬영 버튼 */}
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                </button>
              </>
            ) : (
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-2 bg-gray-400 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm">사진을 촬영해주세요</p>
              </div>
            )}
            
            {/* 숨겨진 Canvas (사진 촬영용) */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* 버튼들 */}
          <div className="space-y-3">
            {!capturedImage && !isCameraActive && (
              <button
                onClick={startCamera}
                className="w-full bg-[#56A3FF] text-white py-3 rounded-lg font-medium"
              >
                사진 촬영하기
              </button>
            )}

            {isCameraActive && (
              <button
                onClick={stopCamera}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-medium"
              >
                카메라 끄기
              </button>
            )}

            {capturedImage && (
              <>
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setCurrentStep(1);
                  }}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg font-medium"
                >
                  다시 찍기
                </button>

                <button
                  onClick={handleMissionComplete}
                  disabled={isCompleting}
                  className="w-full bg-[#4CAF50] text-white py-3 rounded-lg font-medium disabled:opacity-50"
                >
                  {isCompleting ? '처리 중...' : '공유하기'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}