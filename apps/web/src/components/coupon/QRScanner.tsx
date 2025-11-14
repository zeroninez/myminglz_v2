import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScanSuccess: (storeId: string, qrImageUrl: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
}

export const QRScanner = ({ onScanSuccess, onScanError, isScanning }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // 카메라 시작
  const startCamera = async () => {
    try {
      console.log('🎥 카메라 시작 시도...');
      
      // 후면 카메라 우선 사용
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // 후면 카메라 우선
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // iOS Safari 대응
        await videoRef.current.play();
        console.log('✅ 카메라 시작 완료');
        setHasPermission(true);
        
        // 비디오가 재생되면 스캔 시작
        if (isScanning) {
          scanQRCode();
        }
      }
    } catch (error) {
      console.error('❌ 카메라 접근 실패:', error);
      setHasPermission(false);
      onScanError?.('카메라 접근 권한이 필요합니다.');
    }
  };

  // 카메라 중지
  const stopCamera = () => {
    console.log('🛑 카메라 중지');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // QR 코드 스캔 (실시간)
  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isScanning) {
      return;
    }

          const ctx = canvas.getContext('2d');
          if (!ctx) {
      console.error('❌ Canvas context를 가져올 수 없습니다');
            return;
          }
          
    // 비디오가 준비되지 않았으면 다음 프레임에 재시도
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
            }

    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
          
    // 현재 프레임을 캔버스에 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 이미지 데이터 가져오기
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
    // jsQR로 QR 코드 스캔
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
          
          if (code) {
      console.log('✅ QR Code 감지:', code.data);
            
            let storeSlug: string | null = null;
            const qrData = code.data.trim();
            
            // 1. 이벤트 검증 URL 형식 체크: https://.../{domain_code}/verify/{store_id}
            const eventVerifyMatch = qrData.match(/\/verify\/([a-z0-9-_]+)$/i);
            if (eventVerifyMatch) {
              storeSlug = eventVerifyMatch[1];
              console.log('✅ 이벤트 검증 URL에서 추출된 store_id:', storeSlug);
            } else {
              // 2. 기존 쿠폰 URL 형식 체크: https://myminglz-validator.vercel.app/{store_slug}
              const urlMatch = qrData.match(/^https?:\/\/[^\/]+\/([a-z0-9-_]+)$/i);
              if (urlMatch) {
                storeSlug = urlMatch[1].toLowerCase();
                console.log('✅ URL에서 추출된 가게 slug:', storeSlug);
              } else {
                // 3. store:{store_slug} 형식 체크
                const storeMatch = qrData.match(/^store:([a-z0-9-_]+)$/i);
                if (storeMatch) {
                  storeSlug = storeMatch[1].toLowerCase();
                  console.log('✅ store: 형식에서 추출된 가게 slug:', storeSlug);
                }
              }
            }
            
            if (storeSlug) {
        // QR 코드가 감지된 영역의 이미지 캡처
        const qrImageUrl = canvas.toDataURL('image/png');
        
        // 스캔 중지
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        
              onScanSuccess(storeSlug, qrImageUrl);
            } else {
        console.log('⚠️ 잘못된 QR 코드 형식:', code.data);
        // 계속 스캔 시도
        animationRef.current = requestAnimationFrame(scanQRCode);
            }
          } else {
      // QR 코드를 찾지 못하면 다음 프레임 스캔
      animationRef.current = requestAnimationFrame(scanQRCode);
          }
  };

  // isScanning 상태에 따라 카메라 제어
  useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
        }

    // 컴포넌트 언마운트 시 카메라 중지
    return () => {
      stopCamera();
    };
  }, [isScanning]);

  if (!isScanning) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      {/* 비디오 스트림 */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      
      {/* QR 코드 스캔용 캔버스 (숨김) */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* 스캔 가이드 오버레이 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-64 h-64">
          {/* 모서리 가이드 */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
        </div>
      </div>

      {/* 안내 텍스트 */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white text-lg font-medium bg-black bg-opacity-50 px-4 py-2 rounded-lg inline-block">
          QR 코드를 화면 중앙에 맞춰주세요
        </p>
      </div>

      {/* 권한 요청 실패 메시지 */}
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-center px-4">
            <p className="text-xl font-bold mb-2">카메라 접근 권한 필요</p>
            <p className="text-sm">
              설정에서 카메라 권한을 허용해주세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
};