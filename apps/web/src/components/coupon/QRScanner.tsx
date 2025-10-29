import { forwardRef, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (storeId: string) => void;
  onScanError?: (error: string) => void;
}

export const QRScanner = forwardRef<{ scanFile: (file: File) => void }, QRScannerProps>(({ onScanSuccess, onScanError }, ref) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // scanFile 메서드를 부모 컴포넌트에 전달
  useEffect(() => {
    console.log('QRScanner ref 설정 시도...');
    if (ref && typeof ref === 'object') {
      console.log('ref 객체 발견, scanFile 설정 중...');
      ref.current = {
        scanFile: (file: File) => {
          console.log('scanFile 호출됨', file);
          scanFile(file);
        }
      };
      console.log('scanFile 설정 완료');
    } else {
      console.log('유효하지 않은 ref:', ref);
    }
  }, []);

  const scanFile = async (file: File) => {
    console.log('scanFile 함수 실행 시작', file);
    try {
      // 스캐너 인스턴스 생성
      if (!scannerRef.current) {
        console.log("Creating new scanner instance for file scan");
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      // 파일에서 QR 코드 스캔
      const decodedText = await scannerRef.current.scanFile(file, false);
      console.log("QR Code detected from file:", decodedText);

      // store:{store_slug} 형식 체크
      const match = decodedText.match(/^store:([a-z0-9-]+)$/);
      if (match) {
        const storeSlug = match[1];
        console.log('스캔된 가게 slug:', storeSlug);
        onScanSuccess(storeSlug);
      } else {
        console.log('잘못된 QR 코드 형식:', decodedText);
        onScanError?.('유효하지 않은 QR 코드입니다. 올바른 가게 QR 코드를 스캔해주세요.');
      }
    } catch (error) {
      console.error("File scan error:", error);
      onScanError?.('QR 코드를 읽을 수 없습니다. 다른 이미지를 선택해주세요.');
    }
  };

  return (
    <div id="qr-reader" className="hidden" />
  );
});