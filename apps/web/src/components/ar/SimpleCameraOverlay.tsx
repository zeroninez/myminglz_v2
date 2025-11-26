'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SimpleCameraOverlayProps {
  overlayImageUrl?: string; // 오버레이할 이미지 URL
}

/**
 * 웹 카메라 오버레이 컴포넌트
 * 카메라를 켜고 이미지를 오버레이합니다
 */
export const SimpleCameraOverlay = ({ overlayImageUrl }: SimpleCameraOverlayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  // 오버레이 이미지 로드
  useEffect(() => {
    if (overlayImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        // 이미지 로드 후, 카메라가 활성화되어 있으면 drawFrame 시작
        if (isActive) {
          drawFrame();
        }
      };
      img.onerror = () => {
        imageRef.current = null;
      };
      img.src = overlayImageUrl;
    } else {
      imageRef.current = null;
    }
  }, [overlayImageUrl, isActive]);

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
        
        // 비디오가 재생될 때까지 기다리기
        await new Promise<void>((resolve) => {
          const onLoadedMetadata = () => {
            console.log('📹 비디오 메타데이터 로드:', {
              width: video.videoWidth,
              height: video.videoHeight,
              readyState: video.readyState
            });
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            resolve();
          };

          const onPlaying = () => {
            console.log('▶️ 비디오 재생 시작');
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('playing', onPlaying);
          
          video.play().catch((err) => {
            console.error('비디오 재생 실패:', err);
            resolve();
          });
        });

        // 비디오가 준비될 때까지 조금 더 기다리기
        await new Promise((resolve) => setTimeout(resolve, 200));

        setIsActive(true);
        console.log('✅ 카메라 활성화 완료');
        
        // 오버레이 이미지가 있으면 프레임 그리기 시작
        if (overlayImageUrl) {
          // 이미지가 이미 로드되어 있으면 바로 시작, 아니면 이미지 로드 후 시작됨
          if (imageRef.current?.complete) {
            drawFrame();
          }
        }
      }
    } catch (error) {
      console.error('❌ 카메라 접근 실패:', error);
      alert('카메라 권한이 필요합니다.');
    }
  };

  // 카메라 중지
  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  };

  // 프레임 그리기 (오버레이 이미지가 있을 때만)
  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isActive || !overlayImageUrl) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    // 비디오가 준비되지 않았으면 다음 프레임에 재시도
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      animationRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    // 비디오 크기가 0이면 대기
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    // Canvas 크기를 화면 크기에 맞춤 (비디오와 동일하게)
    const container = canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    }

    // Canvas 초기화 (투명하게)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 오버레이 이미지 그리기 (위에)
    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
      const img = imageRef.current;
      const imgWidth = 200; // 고정 크기
      const imgHeight = (img.naturalHeight / img.naturalWidth) * 200;
      const x = (canvas.width - imgWidth) / 2;
      const y = (canvas.height - imgHeight) / 2;
      ctx.drawImage(img, x, y, imgWidth, imgHeight);
    }

    // 다음 프레임 그리기
    animationRef.current = requestAnimationFrame(drawFrame);
  }, [isActive, overlayImageUrl]);


  // 컴포넌트 언마운트 시 카메라 중지
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      {/* 비디오 (실제 카메라 화면) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ 
          width: '100%',
          height: '100%',
          display: isActive ? 'block' : 'none'
        }}
      />
      
      {/* Canvas (오버레이만 - 이미지가 있을 때만 표시) */}
      {isActive && overlayImageUrl && imageRef.current && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ 
            width: '100%',
            height: '100%',
            zIndex: 10
          }}
        />
      )}

      {/* 컨트롤 버튼 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        {!isActive ? (
          <button
            onClick={startCamera}
            className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
          >
            카메라 시작
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors"
          >
            카메라 중지
          </button>
        )}
      </div>
    </div>
  );
};

