'use client';

import { useState } from 'react';
import { QRScanner } from '@/components/coupon/QRScanner';
import { QRPlaceholder } from '@/components/ui/coupon/QRPlaceholder';

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
        <button
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] h-[56px] bg-gray-900 text-white text-[17px] font-semibold rounded-[16px] shadow-lg active:bg-gray-800"
          onClick={handleStartScan}
        >
          QR코드 촬영하기
        </button>
      )}
    </div>
  );
}
