'use client';

import { useState, useRef } from 'react';
import { QRScanner } from '@/components/coupon/QRScanner';
import { QRPlaceholder } from '@/components/ui/coupon/QRPlaceholder';
import jsQR from 'jsqr';

interface ValidateFormProps {
  couponCode?: string;
  onScan: (result: string, qrImageUrl: string) => void;
  qrImageUrl?: string | null;
  isValidated?: boolean;
  onConfirm?: () => void;
  isConfirming?: boolean;
}

export function ValidateForm({ couponCode, onScan, qrImageUrl, isValidated, onConfirm, isConfirming }: ValidateFormProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    setErrorMessage(null);
  };

  const handleScanSuccess = (storeId: string, qrImageUrl: string) => {
    console.log('✅ 스캔 성공:', storeId);
    setIsScanning(false);
    setErrorMessage(null);
    onScan(storeId, qrImageUrl);
  };

  const handleScanError = (error: string) => {
    console.error('❌ 스캔 에러:', error);
    setErrorMessage(error);
    setIsScanning(false);
  };

  const handleCancelScan = () => {
    setIsScanning(false);
    setErrorMessage(null);
  };

  // 개발용: 이미지에서 QR 코드 읽기
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      setErrorMessage('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsProcessingImage(true);
    setErrorMessage(null);

    try {
      // 파일을 이미지로 로드
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          // Canvas 생성
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas context를 가져올 수 없습니다.');
          }

          // Canvas 크기를 이미지 크기에 맞춤
          canvas.width = img.width;
          canvas.height = img.height;

          // 이미지를 Canvas에 그리기
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // 이미지 데이터 가져오기
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // jsQR로 QR 코드 읽기
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code) {
            console.log('✅ 이미지에서 QR Code 감지:', code.data);
            
            let storeSlug: string | null = null;
            const qrData = code.data.trim();
            
            // 1. 간단한 형식 체크: /verify/{store_slug} 또는 https://.../verify/{store_slug}
            const verifyMatch = qrData.match(/\/verify\/([a-z0-9-_]+)$/i);
            if (verifyMatch) {
              storeSlug = verifyMatch[1]; // store_slug 추출
              console.log('✅ /verify/ URL에서 추출된 store_slug:', storeSlug);
            } else {
              // 2. 기존 쿠폰 URL 형식 체크
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
              onScan(storeSlug, qrImageUrl);
              URL.revokeObjectURL(objectUrl);
            } else {
              throw new Error('QR 코드에서 store 정보를 찾을 수 없습니다.');
            }
          } else {
            throw new Error('이미지에서 QR 코드를 찾을 수 없습니다.');
          }
        } catch (error: any) {
          console.error('❌ 이미지 처리 오류:', error);
          setErrorMessage(error.message || '이미지에서 QR 코드를 읽을 수 없습니다.');
          URL.revokeObjectURL(objectUrl);
        } finally {
          setIsProcessingImage(false);
          // 파일 input 초기화
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      img.onerror = () => {
        setErrorMessage('이미지를 로드할 수 없습니다.');
        setIsProcessingImage(false);
        URL.revokeObjectURL(objectUrl);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      img.src = objectUrl;
    } catch (error: any) {
      console.error('❌ 이미지 업로드 오류:', error);
      setErrorMessage(error.message || '이미지 업로드 중 오류가 발생했습니다.');
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 스캔 중일 때는 전체 화면 카메라 뷰 표시
  if (isScanning) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <QRScanner 
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
          isScanning={isScanning}
        />
        
        {/* 취소 버튼 */}
        <button
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          onClick={handleCancelScan}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-5 pt-16">
        <h1 className="text-gray-900 text-[32px] font-bold leading-[1.3] mb-3">
          매장 내 비치된<br />
          QR코드를<br />
          촬영해주세요
        </h1>

        <p className="text-gray-600 text-[15px] mb-8">
          QR코드 위치는 점원에게 문의해주세요
        </p>

        <div className="bg-gray-50 border-2 border-gray-200 rounded-[20px] p-5">
          <h2 className="text-[17px] font-bold text-gray-900 mb-4">
            주의사항
          </h2>
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
              <span className="text-gray-400 text-xs font-bold">!</span>
            </div>
            <p className="text-[15px] text-gray-600 leading-[1.5]">
              QR 코드를 카메라 중앙에 맞춰주세요
            </p>
          </div>
        </div>

        {/* QR 코드 표시 영역 */}
        <div className="mt-8 aspect-square w-full max-w-[280px] mx-auto flex items-center justify-center border-2 border-gray-300 rounded-[14px] bg-gray-50">
          {errorMessage ? (
            // 에러 메시지 표시
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-red-500 text-2xl">✕</span>
              </div>
              <p className="text-red-600 text-[15px] font-medium mb-2">스캔 실패</p>
              <p className="text-gray-600 text-[13px] whitespace-pre-line text-left">{errorMessage}</p>
            </div>
          ) : qrImageUrl ? (
            // 스캔된 QR 이미지 표시
            <img 
              src={qrImageUrl} 
              alt="스캔된 QR 코드" 
              className="w-full h-full object-contain p-4"
            />
          ) : (
            // 기본 플레이스홀더
            <QRPlaceholder className="" />
          )}
        </div>
      </div>

      {/* 검증 완료 후 직원 확인 버튼 또는 QR 촬영 버튼 */}
      {isValidated ? (
        <button
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] h-[56px] bg-gray-900 text-white text-[17px] font-semibold rounded-[16px] shadow-lg active:bg-gray-800 disabled:bg-gray-400"
          onClick={onConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? '처리 중...' : '직원확인'}
        </button>
      ) : (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] flex flex-col gap-2">
          <button
            className="w-full h-[56px] bg-gray-900 text-white text-[17px] font-semibold rounded-[16px] shadow-lg active:bg-gray-800"
            onClick={handleStartScan}
          >
            QR코드 촬영하기
          </button>
          {/* 개발용 이미지 업로드 버튼 */}
          <button
            type="button"
            className="w-full h-[48px] bg-blue-500 text-white text-[15px] font-medium rounded-[12px] shadow-md active:bg-blue-600 disabled:opacity-50"
            onClick={handleImageUploadClick}
            disabled={isProcessingImage}
          >
            {isProcessingImage ? '처리 중...' : '📷 개발용: 사진 넣기'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
