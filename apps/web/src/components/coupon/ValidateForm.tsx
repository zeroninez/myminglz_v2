'use client';

import { useRef, useState } from 'react';
import { QRScanner } from '@/components/coupon/QRScanner';
import { QRPlaceholder } from '@/components/ui/coupon/QRPlaceholder';
import { ActionSheet, ActionSheetButton, ActionSheetButtonGroup } from '@/components/ui/ActionSheet';

interface ValidateFormProps {
  couponCode?: string;
  onScan: (result: string) => void;
}

export function ValidateForm({ couponCode, onScan }: ValidateFormProps) {
  const scannerRef = useRef<{ scanFile: (file: File) => void } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImageUrl, setScannedImageUrl] = useState<string | null>(null);

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && scannerRef.current?.scanFile) {
        setIsScanning(true);
        setScannedImageUrl(null);
        
        // 파일을 이미지 URL로 변환
        const imageUrl = URL.createObjectURL(file);
        
        try {
          await scannerRef.current.scanFile(file);
          // 스캔 성공 시 이미지 표시
          setScannedImageUrl(imageUrl);
        } catch (error) {
          // 스캔 실패 시 URL 해제
          URL.revokeObjectURL(imageUrl);
        } finally {
          setIsScanning(false);
        }
      }
    };
    input.click();
  };

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
              스캔이 안된 촬영 후 업로드까지 완료해주세요
            </p>
          </div>
        </div>

        {/* QR 코드 표시 영역 */}
        <div className="mt-8 aspect-square w-full max-w-[280px] mx-auto flex items-center justify-center border-2 border-gray-300 rounded-[14px] bg-gray-50">
          {isScanning ? (
            // 스캔 중 메시지
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600 text-[15px]">유효한 코드인지 확인중...</p>
            </div>
          ) : scannedImageUrl ? (
            // 스캔된 QR 이미지 표시
            <img 
              src={scannedImageUrl} 
              alt="스캔된 QR 코드" 
              className="w-full h-full object-contain p-4"
            />
          ) : (
            // 기본 플레이스홀더
            <QRPlaceholder className="" />
          )}
        </div>

        <QRScanner onScanSuccess={onScan} ref={scannerRef} />
      </div>

      <button
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] h-[56px] bg-gray-900 text-white text-[17px] font-semibold rounded-[16px] shadow-lg active:bg-gray-800"
        onClick={handleFileSelect}
      >
        QR코드 촬영하기
      </button>
    </div>
  );
}
